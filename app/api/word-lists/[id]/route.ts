import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { WordListType } from '@prisma/client'

const updateWordListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isArchived: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем, является ли это авто-списком
    if (id.startsWith('auto-')) {
      // Для авто-списков возвращаем записи напрямую из DictionaryEntry
      const now = new Date()
      let dateFilter: Date

      if (id === 'auto-7-days') {
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (id === 'auto-14-days') {
        dateFilter = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      } else if (id === 'auto-28-days') {
        dateFilter = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
      } else {
        return NextResponse.json({ error: 'Invalid auto-list id' }, { status: 400 })
      }

      const entries = await prisma.dictionaryEntry.findMany({
        where: {
          userId,
          createdAt: { gte: dateFilter }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({
        entries,
        list: {
          id,
          userId,
          type: id === 'auto-7-days' ? WordListType.AUTO_7_DAYS :
                id === 'auto-14-days' ? WordListType.AUTO_14_DAYS :
                WordListType.AUTO_28_DAYS,
          wordCount: entries.length
        }
      })
    }

    // Для кастомных списков
    const list = await prisma.wordList.findFirst({
      where: {
        id,
        userId
      },
      include: {
        wordListItems: {
          include: {
            entry: true
          },
          orderBy: { addedAt: 'desc' }
        },
        _count: {
          select: { wordListItems: true }
        }
      }
    })

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    const entries = list.wordListItems.map(item => item.entry)

    return NextResponse.json({
      entries,
      list: {
        ...list,
        wordCount: list._count.wordListItems,
        wordListItems: undefined,
        _count: undefined
      }
    })

  } catch (error) {
    console.error('Word list GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch word list' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Авто-списки нельзя редактировать
    if (id.startsWith('auto-')) {
      return NextResponse.json(
        { error: 'Cannot edit auto-generated lists' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateWordListSchema.parse(body)

    // Проверяем существование и ownership
    const existingList = await prisma.wordList.findFirst({
      where: { id, userId }
    })

    if (!existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Обновляем список
    const updatedList = await prisma.wordList.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: { wordListItems: true }
        }
      }
    })

    return NextResponse.json({
      ...updatedList,
      wordCount: updatedList._count.wordListItems
    })

  } catch (error) {
    console.error('Word list PUT error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update word list' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Авто-списки нельзя удалять
    if (id.startsWith('auto-')) {
      return NextResponse.json(
        { error: 'Cannot delete auto-generated lists' },
        { status: 400 }
      )
    }

    // Проверяем существование и ownership
    const existingList = await prisma.wordList.findFirst({
      where: { id, userId }
    })

    if (!existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Удаляем список (wordListItems удалятся каскадно)
    await prisma.wordList.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'List deleted successfully' })

  } catch (error) {
    console.error('Word list DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete word list' },
      { status: 500 }
    )
  }
}
