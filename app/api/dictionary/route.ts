import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  createDictionaryEntrySchema,
  dictionaryFiltersSchema,
  dictionaryPaginationSchema
} from '@/features/dictionary'
import { createErrorResponse, formatZodError } from '@/lib/http'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 50

export async function GET(request: NextRequest) {
  try {
    // Получаем userId из middleware headers
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        status: 401,
      })
    }

    // Парсим query параметры для фильтрации
    const { searchParams } = new URL(request.url)
    const filters = {
      sourceLanguage: searchParams.get('sourceLanguage') || undefined,
      targetLanguage: searchParams.get('targetLanguage') || undefined,
      search: searchParams.get('search') || undefined,
      listId: searchParams.get('listId') || undefined,
    }

    // Валидация фильтров
    const validatedFilters = dictionaryFiltersSchema.parse(filters)

    const paginationInput = {
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    }

    const { page: parsedPage, limit: parsedLimit } = dictionaryPaginationSchema.parse(paginationInput)

    const page = parsedPage ?? DEFAULT_PAGE
    const limit = parsedLimit ?? DEFAULT_LIMIT

    // Построение условий фильтрации
    const where: Prisma.DictionaryEntryWhereInput = {
      userId,
    }

    if (validatedFilters.sourceLanguage) {
      where.sourceLanguage = validatedFilters.sourceLanguage
    }

    if (validatedFilters.targetLanguage) {
      where.targetLanguage = validatedFilters.targetLanguage
    }

    // Поиск - используем ILIKE для всех случаев (полнотекстовый поиск требует raw SQL)
    if (validatedFilters.search) {
      const searchTerm = validatedFilters.search.trim()
      where.OR = [
        { word: { contains: searchTerm, mode: 'insensitive' } },
        { translation: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    // Фильтрация по списку
    if (validatedFilters.listId) {
      if (validatedFilters.listId.startsWith('auto-')) {
        // Для авто-списков - фильтруем по дате
        const now = new Date()
        let dateFilter: Date | null = null

        if (validatedFilters.listId === 'auto-7-days') {
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else if (validatedFilters.listId === 'auto-14-days') {
          dateFilter = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        } else if (validatedFilters.listId === 'auto-28-days') {
          dateFilter = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
        }

        if (dateFilter) {
          where.createdAt = { gte: dateFilter }
        }
      } else {
        // Для кастомных списков - используем связь wordListItems
        where.wordListItems = {
          some: {
            listId: validatedFilters.listId
          }
        }
      }
    }

    const skip = (page - 1) * limit

    // Получение записей
    const [entries, totalCount] = await Promise.all([
      prisma.dictionaryEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dictionaryEntry.count({ where })
    ])

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Dictionary GET error:', error)
    if (error instanceof ZodError) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Некорректные параметры запроса',
        status: 400,
        details: formatZodError(error),
      })
    }

    return createErrorResponse({
      code: 'DICTIONARY_FETCH_FAILED',
      message: 'Failed to fetch dictionary entries',
      status: 500,
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Получаем userId из middleware headers
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
    const validatedData = createDictionaryEntrySchema.parse(body)

    // Проверка на дубликаты
    const existingEntry = await prisma.dictionaryEntry.findFirst({
      where: {
        userId,
        word: validatedData.word.toLowerCase(),
        sourceLanguage: validatedData.sourceLanguage,
        targetLanguage: validatedData.targetLanguage,
      }
    })

    if (existingEntry) {
      return createErrorResponse({
        code: 'DICTIONARY_ENTRY_EXISTS',
        message: 'Такое слово уже есть в вашем словаре',
        status: 400,
      })
    }

    // Создание новой записи
    const entry = await prisma.dictionaryEntry.create({
      data: {
        userId,
        word: validatedData.word.toLowerCase(),
        sourceLanguage: validatedData.sourceLanguage,
        translation: validatedData.translation,
        targetLanguage: validatedData.targetLanguage,
        notes: validatedData.notes,
      }
    })

    return NextResponse.json(entry, { status: 201 })

  } catch (error) {
    console.error('Dictionary POST error:', error)
    if (error instanceof ZodError) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Некорректные данные запроса',
        status: 400,
        details: formatZodError(error),
      })
    }

    return createErrorResponse({
      code: 'DICTIONARY_CREATE_FAILED',
      message: 'Failed to create dictionary entry',
      status: 500,
    })
  }
}
