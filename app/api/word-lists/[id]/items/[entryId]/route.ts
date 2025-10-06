import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, formatZodError } from '@/lib/http'

const paramsSchema = z.object({
  id: z.string(),
  entryId: z.string().uuid(),
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { id: listId, entryId } = paramsSchema.parse(await params)

    if (!userId) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        status: 401,
      })
    }

    if (listId.startsWith('auto-')) {
      return createErrorResponse({
        code: 'AUTO_LIST_LOCKED',
        message: 'Cannot modify auto-generated lists',
        status: 400,
      })
    }

    const list = await prisma.wordList.findFirst({
      where: { id: listId, userId }
    })

    if (!list) {
      return createErrorResponse({
        code: 'WORD_LIST_NOT_FOUND',
        message: 'List not found',
        status: 404,
      })
    }

    const deletedItem = await prisma.wordListItem.deleteMany({
      where: {
        listId,
        entryId
      }
    })

    if (deletedItem.count === 0) {
      return createErrorResponse({
        code: 'WORD_LIST_ENTRY_NOT_FOUND',
        message: 'Entry not found in list',
        status: 404,
      })
    }

    return NextResponse.json({ message: 'Entry removed from list' })
  } catch (error) {
    console.error('Word list item DELETE error:', error)

    if (error instanceof z.ZodError) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Некорректные параметры запроса',
        status: 400,
        details: formatZodError(error),
      })
    }

    return createErrorResponse({
      code: 'WORD_LIST_ITEM_DELETE_FAILED',
      message: 'Failed to remove entry from list',
      status: 500,
    })
  }
}
