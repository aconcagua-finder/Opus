import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateDictionaryEntrySchema } from '@/features/dictionary'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await prisma.dictionaryEntry.findFirst({
      where: {
        id,
        userId,
      }
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Dictionary entry not found' },
        { status: 404 }
      )
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
    return NextResponse.json(
      { error: 'Failed to fetch dictionary entry' },
      { status: 500 }
    )
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json(
        { error: 'Dictionary entry not found' },
        { status: 404 }
      )
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
        return NextResponse.json(
          { error: 'Такое слово уже есть в вашем словаре' },
          { status: 400 }
        )
      }
    }

    // Обновление записи
    const updateData: any = { ...validatedData }
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
    
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update dictionary entry' },
      { status: 500 }
    )
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем, существует ли запись и принадлежит ли она пользователю
    const existingEntry = await prisma.dictionaryEntry.findFirst({
      where: {
        id,
        userId,
      }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Dictionary entry not found' },
        { status: 404 }
      )
    }

    // Удаление записи
    await prisma.dictionaryEntry.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Dictionary entry deleted successfully' })

  } catch (error) {
    console.error('Dictionary DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete dictionary entry' },
      { status: 500 }
    )
  }
}