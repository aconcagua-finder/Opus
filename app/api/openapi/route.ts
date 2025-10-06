import { NextResponse } from 'next/server'
import { openApiDocument } from '@/lib/openapi'

export function GET() {
  const response = NextResponse.json(openApiDocument)
  response.headers.set('Content-Type', 'application/json; charset=utf-8')
  return response
}
