import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WordListType } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { entryId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!entryId) {
      return NextResponse.json({ error: 'entryId parameter required' }, { status: 400 })
    }

    // Ensure the entry belongs to the current user
    const entry = await prisma.dictionaryEntry.findFirst({
      where: { id: entryId, userId },
      select: { id: true }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const lists = await prisma.wordList.findMany({
      where: {
        userId,
        type: WordListType.CUSTOM,
        wordListItems: {
          some: { entryId }
        }
      },
      include: {
        _count: {
          select: { wordListItems: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formatted = lists.map((list) => ({
      ...list,
      wordCount: list._count.wordListItems,
      _count: undefined
    }))

    return NextResponse.json({ lists: formatted })
  } catch (error) {
    console.error('Word list membership GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch word list membership' },
      { status: 500 }
    )
  }
}
