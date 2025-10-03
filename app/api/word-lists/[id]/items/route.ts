import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Авто-списки нельзя модифицировать
    if (listId.startsWith('auto-')) {
      return NextResponse.json(
        { error: 'Cannot modify auto-generated lists' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { entryId } = addItemSchema.parse(body)

    // Проверяем существование списка и ownership
    const list = await prisma.wordList.findFirst({
      where: { id: listId, userId }
    })

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Проверяем существование записи и ownership
    const entry = await prisma.dictionaryEntry.findFirst({
      where: { id: entryId, userId }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Проверяем, нет ли уже этого слова в списке
    const existingItem = await prisma.wordListItem.findFirst({
      where: {
        listId,
        entryId
      }
    })

    if (existingItem) {
      return NextResponse.json(
        { error: 'Entry already in list' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to add entry to list' },
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
    const { id: listId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Авто-списки нельзя модифицировать
    if (listId.startsWith('auto-')) {
      return NextResponse.json(
        { error: 'Cannot modify auto-generated lists' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entryId')

    if (!entryId) {
      return NextResponse.json(
        { error: 'entryId query parameter required' },
        { status: 400 }
      )
    }

    // Проверяем существование списка и ownership
    const list = await prisma.wordList.findFirst({
      where: { id: listId, userId }
    })

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Удаляем запись из списка
    const deletedItem = await prisma.wordListItem.deleteMany({
      where: {
        listId,
        entryId
      }
    })

    if (deletedItem.count === 0) {
      return NextResponse.json(
        { error: 'Entry not found in list' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Entry removed from list' })

  } catch (error) {
    console.error('Word list item DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to remove entry from list' },
      { status: 500 }
    )
  }
}
