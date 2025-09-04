import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET() {
  const urls = [
    'postgresql://postgres:anypass@localhost:5432/opus_language',
    'postgresql://postgres:anypass@127.0.0.1:5432/opus_language',
  ]
  
  const results = []
  
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
    } catch (error: any) {
      results.push({ url: url.replace(/postgres:.*@/, 'postgres:***@'), success: false, error: error.message })
    }
  }
  
  return NextResponse.json({ 
    success: false,
    message: 'No connection string worked',
    results 
  }, { status: 500 })
}