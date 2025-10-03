import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { WordListType } from '@prisma/client'

const createWordListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
})

// Helper функция для получения авто-списков
async function getAutoListsWithCounts(userId: string) {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)

  const [count7Days, count14Days, count28Days] = await Promise.all([
    prisma.dictionaryEntry.count({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo }
      }
    }),
    prisma.dictionaryEntry.count({
      where: {
        userId,
        createdAt: { gte: fourteenDaysAgo }
      }
    }),
    prisma.dictionaryEntry.count({
      where: {
        userId,
        createdAt: { gte: twentyEightDaysAgo }
      }
    })
  ])

  return [
    {
      id: 'auto-7-days',
      userId,
      name: 'Последние 7 дней',
      type: WordListType.AUTO_7_DAYS,
      description: 'Слова, добавленные за последние 7 дней',
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      wordCount: count7Days
    },
    {
      id: 'auto-14-days',
      userId,
      name: 'Последние 14 дней',
      type: WordListType.AUTO_14_DAYS,
      description: 'Слова, добавленные за последние 14 дней',
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      wordCount: count14Days
    },
    {
      id: 'auto-28-days',
      userId,
      name: 'Последние 28 дней',
      type: WordListType.AUTO_28_DAYS,
      description: 'Слова, добавленные за последние 28 дней',
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      wordCount: count28Days
    }
  ]
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeArchived = searchParams.get('includeArchived') === 'true'

    // Получаем кастомные списки с количеством слов
    const customLists = await prisma.wordList.findMany({
      where: {
        userId,
        type: WordListType.CUSTOM,
        ...(includeArchived ? {} : { isArchived: false })
      },
      include: {
        _count: {
          select: { wordListItems: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Преобразуем в формат с wordCount
    const customListsWithCount = customLists.map(list => ({
      ...list,
      wordCount: list._count.wordListItems,
      _count: undefined
    }))

    // Получаем авто-списки
    const autoLists = await getAutoListsWithCounts(userId)

    // Объединяем: сначала авто, потом кастомные
    const allLists = [...autoLists, ...customListsWithCount]

    return NextResponse.json({ lists: allLists })

  } catch (error) {
    console.error('Word lists GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch word lists' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createWordListSchema.parse(body)

    // Проверка на дубликаты по имени
    const existingList = await prisma.wordList.findFirst({
      where: {
        userId,
        name: validatedData.name,
        type: WordListType.CUSTOM
      }
    })

    if (existingList) {
      return NextResponse.json(
        { error: 'Список с таким именем уже существует' },
        { status: 400 }
      )
    }

    // Создаем новый список
    const newList = await prisma.wordList.create({
      data: {
        userId,
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color,
        type: WordListType.CUSTOM
      },
      include: {
        _count: {
          select: { wordListItems: true }
        }
      }
    })

    return NextResponse.json({
      ...newList,
      wordCount: newList._count.wordListItems
    }, { status: 201 })

  } catch (error) {
    console.error('Word lists POST error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create word list' },
      { status: 500 }
    )
  }
}
