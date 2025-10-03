import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createDictionaryEntrySchema, dictionaryFiltersSchema } from '@/features/dictionary'

export async function GET(request: NextRequest) {
  try {
    // Получаем userId из middleware headers
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Парсим query параметры для фильтрации
    const { searchParams } = new URL(request.url)
    const filters = {
      sourceLanguage: searchParams.get('sourceLanguage') || undefined,
      targetLanguage: searchParams.get('targetLanguage') || undefined,
      search: searchParams.get('search') || undefined,
    }

    // Валидация фильтров
    const validatedFilters = dictionaryFiltersSchema.parse(filters)

    // Построение условий фильтрации
    const where: any = {
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

    // Пагинация
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
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
    return NextResponse.json(
      { error: 'Failed to fetch dictionary entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Получаем userId из middleware headers
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json(
        { error: 'Такое слово уже есть в вашем словаре' },
        { status: 400 }
      )
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
    
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create dictionary entry' },
      { status: 500 }
    )
  }
}
