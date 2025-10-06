import { NextResponse } from 'next/server'
import { Client } from 'pg'
import { createErrorResponse } from '@/lib/http'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return createErrorResponse({
      code: 'NOT_FOUND',
      message: 'Not Found',
      status: 404,
    })
  }

  const urls = [
    'postgresql://postgres:anypass@localhost:5432/opus_language',
    'postgresql://postgres:anypass@127.0.0.1:5432/opus_language',
  ]
  
  const results: Array<{
    url: string
    success: boolean
    time?: unknown
    error?: string
  }> = []
  
  for (const url of urls) {
    const client = new Client({ connectionString: url })
    
    try {
      await client.connect()
      const res = await client.query('SELECT NOW()')
      results.push({ url: url.replace(/postgres:.*@/, 'postgres:***@'), success: true, time: res.rows[0].now })
      await client.end()
      
      // Если подключение успешно, обновляем переменную окружения
      process.env.DATABASE_URL = url + '?schema=public'
      
      return NextResponse.json({ 
        success: true,
        workingUrl: url.replace(/postgres:.*@/, 'postgres:***@'),
        results 
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      results.push({ url: url.replace(/postgres:.*@/, 'postgres:***@'), success: false, error: message })
    }
  }
  
  return createErrorResponse({
    code: 'DATABASE_CONNECTION_FAILED',
    message: 'No connection string worked',
    status: 500,
    details: { results }
  })
}
