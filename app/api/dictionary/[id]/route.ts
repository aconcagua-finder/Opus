import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { updateDictionaryEntrySchema } from '@/features/dictionary'
import type { UpdateDictionaryEntryInput } from '@/features/dictionary'
import { createErrorResponse, formatZodError } from '@/lib/http'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        status: 401,
      })
    }

    const entry = await prisma.dictionaryEntry.findFirst({
      where: {
        id,
        userId,
      }
    })

    if (!entry) {
      return createErrorResponse({
        code: 'DICTIONARY_ENTRY_NOT_FOUND',
        message: 'Dictionary entry not found',
        status: 404,
      })
    }

    // Увеличиваем счетчик просмотров
    await prisma.dictionaryEntry.update({
      where: { id },
      data: { 
        timesViewed: entry.timesViewed + 1,
        lastReviewed: new Date()
      }
    })

    return NextResponse.json(entry)

  } catch (error) {
    console.error('Dictionary GET by ID error:', error)
    return createErrorResponse({
      code: 'DICTIONARY_ENTRY_FETCH_FAILED',
      message: 'Failed to fetch dictionary entry',
      status: 500,
    })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        status: 401,
      })
    }

    const body = await request.json()

    // Валидация входных данных
    const validatedData = updateDictionaryEntrySchema.parse(body)

    // Проверяем, существует ли запись и принадлежит ли она пользователю
    const existingEntry = await prisma.dictionaryEntry.findFirst({
      where: {
        id,
        userId,
      }
    })

    if (!existingEntry) {
      return createErrorResponse({
        code: 'DICTIONARY_ENTRY_NOT_FOUND',
        message: 'Dictionary entry not found',
        status: 404,
      })
    }

    // Проверка на дубликаты при изменении слова
    if (validatedData.word || validatedData.sourceLanguage || validatedData.targetLanguage) {
      const checkWord = validatedData.word?.toLowerCase() || existingEntry.word
      const checkSourceLang = validatedData.sourceLanguage || existingEntry.sourceLanguage
      const checkTargetLang = validatedData.targetLanguage || existingEntry.targetLanguage

      const duplicate = await prisma.dictionaryEntry.findFirst({
        where: {
          userId,
          word: checkWord,
          sourceLanguage: checkSourceLang,
          targetLanguage: checkTargetLang,
          id: { not: id }, // Исключаем текущую запись
        }
      })

      if (duplicate) {
        return createErrorResponse({
          code: 'DICTIONARY_ENTRY_EXISTS',
          message: 'Такое слово уже есть в вашем словаре',
          status: 400,
        })
      }
    }

    // Обновление записи
    const updateData: UpdateDictionaryEntryInput = { ...validatedData }
    if (updateData.word) {
      updateData.word = updateData.word.toLowerCase()
    }

    const updatedEntry = await prisma.dictionaryEntry.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedEntry)

  } catch (error) {
    console.error('Dictionary PUT error:', error)

    if (error instanceof ZodError) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Некорректные данные запроса',
        status: 400,
        details: formatZodError(error),
      })
    }

    return createErrorResponse({
      code: 'DICTIONARY_UPDATE_FAILED',
      message: 'Failed to update dictionary entry',
      status: 500,
    })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        status: 401,
      })
    }

    // Проверяем, существует ли запись и принадлежит ли она пользователю
    const existingEntry = await prisma.dictionaryEntry.findFirst({
      where: {
        id,
        userId,
      }
    })

    if (!existingEntry) {
      return createErrorResponse({
        code: 'DICTIONARY_ENTRY_NOT_FOUND',
        message: 'Dictionary entry not found',
        status: 404,
      })
    }

    // Удаление записи
    await prisma.dictionaryEntry.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Dictionary entry deleted successfully' })

  } catch (error) {
    console.error('Dictionary DELETE error:', error)
    return createErrorResponse({
      code: 'DICTIONARY_DELETE_FAILED',
      message: 'Failed to delete dictionary entry',
      status: 500,
    })
  }
}
