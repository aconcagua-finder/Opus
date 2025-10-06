import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WordListType } from '@prisma/client'
import { createErrorResponse } from '@/lib/http'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { entryId } = await params

    if (!userId) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        status: 401,
      })
    }

    if (!entryId) {
      return createErrorResponse({
        code: 'ENTRY_ID_REQUIRED',
        message: 'entryId parameter required',
        status: 400,
      })
    }

    // Ensure the entry belongs to the current user
    const entry = await prisma.dictionaryEntry.findFirst({
      where: { id: entryId, userId },
      select: { id: true }
    })

    if (!entry) {
      return createErrorResponse({
        code: 'DICTIONARY_ENTRY_NOT_FOUND',
        message: 'Entry not found',
        status: 404,
      })
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
    return createErrorResponse({
      code: 'WORD_LIST_MEMBERSHIP_FETCH_FAILED',
      message: 'Failed to fetch word list membership',
      status: 500,
    })
  }
}
