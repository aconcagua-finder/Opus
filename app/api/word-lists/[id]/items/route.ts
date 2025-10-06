import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createErrorResponse, formatZodError } from '@/lib/http'

const addItemSchema = z.object({
  entryId: z.string().uuid()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { id: listId } = await params

    if (!userId) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        status: 401,
      })
    }

    // Авто-списки нельзя модифицировать
    if (listId.startsWith('auto-')) {
      return createErrorResponse({
        code: 'AUTO_LIST_LOCKED',
        message: 'Cannot modify auto-generated lists',
        status: 400,
      })
    }

    const body = await request.json()
    const { entryId } = addItemSchema.parse(body)

    // Проверяем существование списка и ownership
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

    // Проверяем существование записи и ownership
    const entry = await prisma.dictionaryEntry.findFirst({
      where: { id: entryId, userId }
    })

    if (!entry) {
      return createErrorResponse({
        code: 'DICTIONARY_ENTRY_NOT_FOUND',
        message: 'Entry not found',
        status: 404,
      })
    }

    // Проверяем, нет ли уже этого слова в списке
    const existingItem = await prisma.wordListItem.findFirst({
      where: {
        listId,
        entryId
      }
    })

    if (existingItem) {
      return createErrorResponse({
        code: 'WORD_LIST_ENTRY_EXISTS',
        message: 'Entry already in list',
        status: 400,
      })
    }

    // Добавляем слово в список
    const newItem = await prisma.wordListItem.create({
      data: {
        listId,
        entryId
      },
      include: {
        entry: true
      }
    })

    return NextResponse.json(newItem, { status: 201 })

  } catch (error) {
    console.error('Word list item POST error:', error)

    if (error instanceof z.ZodError) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Некорректные данные запроса',
        status: 400,
        details: formatZodError(error),
      })
    }

    return createErrorResponse({
      code: 'WORD_LIST_ITEM_CREATE_FAILED',
      message: 'Failed to add entry to list',
      status: 500,
    })
  }
}
