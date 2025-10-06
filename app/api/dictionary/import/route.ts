import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Language } from '@prisma/client'
import { createErrorResponse, formatZodError } from '@/lib/http'

const ENTRY_LIMIT = 100

const entrySchema = z.object({
  word: z.string().min(1).max(100),
  translation: z.string().min(1).max(200),
  notes: z.string().max(500).optional(),
  sourceLanguage: z.nativeEnum(Language),
  targetLanguage: z.nativeEnum(Language),
})

const requestSchema = z.object({
  entries: z.array(entrySchema).min(1).max(ENTRY_LIMIT),
})

type EntryInput = z.infer<typeof entrySchema>

type NormalizedEntry = EntryInput & { word: string }

function normalizeEntry(entry: EntryInput): NormalizedEntry {
  const trimmedWord = entry.word.trim()
  return {
    word: trimmedWord,
    translation: entry.translation.trim(),
    notes: entry.notes?.trim() || undefined,
    sourceLanguage: entry.sourceLanguage,
    targetLanguage: entry.targetLanguage,
  }
}

function keyForEntry(entry: Pick<NormalizedEntry, 'word' | 'sourceLanguage' | 'targetLanguage'>) {
  return `${entry.word.toLowerCase()}__${entry.sourceLanguage}__${entry.targetLanguage}`
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        status: 401,
      })
    }

    const json = await request.json()
    const { entries } = requestSchema.parse(json)

    const normalized = entries
      .map(normalizeEntry)
      .filter((entry) => entry.word && entry.translation)

    const uniqueMap = new Map<string, NormalizedEntry>()
    for (const entry of normalized) {
      const key = keyForEntry(entry)
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, entry)
      }
    }

    const uniqueEntries = Array.from(uniqueMap.values())

    if (uniqueEntries.length === 0) {
      return NextResponse.json({ created: 0, skipped: entries.length })
    }

    const existing = await prisma.dictionaryEntry.findMany({
      where: {
        userId,
        OR: uniqueEntries.map((entry) => ({
          word: entry.word.toLowerCase(),
          sourceLanguage: entry.sourceLanguage,
          targetLanguage: entry.targetLanguage,
        })),
      },
      select: {
        word: true,
        sourceLanguage: true,
        targetLanguage: true,
      },
    })

    const existingSet = new Set(existing.map((item) => keyForEntry({
      word: item.word,
      sourceLanguage: item.sourceLanguage,
      targetLanguage: item.targetLanguage,
    })))

    const toCreate = uniqueEntries.filter((entry) => !existingSet.has(keyForEntry(entry)))

    if (toCreate.length === 0) {
      return NextResponse.json({ created: 0, skipped: entries.length })
    }

    await prisma.dictionaryEntry.createMany({
      data: toCreate.map((entry) => ({
        userId,
        word: entry.word.toLowerCase(),
        translation: entry.translation,
        sourceLanguage: entry.sourceLanguage,
        targetLanguage: entry.targetLanguage,
        notes: entry.notes,
      })),
    })

    return NextResponse.json({
      created: toCreate.length,
      skipped: entries.length - toCreate.length,
    })
  } catch (error) {
    console.error('Dictionary import error:', error)
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Некорректные данные запроса',
        status: 400,
        details: formatZodError(error),
      })
    }

    return createErrorResponse({
      code: 'DICTIONARY_IMPORT_FAILED',
      message: 'Не удалось сохранить список слов',
      status: 500,
    })
  }
}
