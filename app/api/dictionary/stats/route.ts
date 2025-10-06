import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Language } from '@prisma/client'
import { createErrorResponse } from '@/lib/http'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        status: 401,
      })
    }

    // Вычисляем даты для фильтрации
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    // Оптимизированный запрос: получаем все статистики одним запросом
    const [totalEntries, entriesByLanguage, recentlyAdded, needsReview] = await Promise.all([
      // Общее количество записей
      prisma.dictionaryEntry.count({
        where: { userId }
      }),
      
      // Количество записей по языкам
      prisma.dictionaryEntry.groupBy({
        by: ['sourceLanguage'],
        where: { userId },
        _count: {
          sourceLanguage: true
        }
      }),
      
      // Недавно добавленные записи (за последнюю неделю)
      prisma.dictionaryEntry.count({
        where: {
          userId,
          createdAt: {
            gte: oneWeekAgo
          }
        }
      }),
      
      // Записи, требующие повторения
      prisma.dictionaryEntry.count({
        where: {
          userId,
          OR: [
            { lastReviewed: null },
            { lastReviewed: { lt: threeDaysAgo } }
          ]
        }
      })
    ])

    // Преобразуем в объект для удобства
    const languageStats: Record<Language, number> = {
      SPANISH: 0,
      ENGLISH: 0,
      RUSSIAN: 0
    }

    entriesByLanguage.forEach(group => {
      languageStats[group.sourceLanguage] = group._count.sourceLanguage
    })

    const stats = {
      totalEntries,
      entriesByLanguage: languageStats,
      recentlyAdded,
      needsReview
    }

    // Кеширование статистики на 5 минут
    const response = NextResponse.json(stats)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
    
    return response

  } catch (error) {
    console.error('Dictionary stats error:', error)
    return createErrorResponse({
      code: 'DICTIONARY_STATS_FAILED',
      message: 'Failed to fetch dictionary stats',
      status: 500,
    })
  }
}
