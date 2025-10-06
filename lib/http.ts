import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

export interface ErrorResponseOptions {
  code: string
  message: string
  status: number
  details?: unknown
  headers?: HeadersInit
}

export function createErrorResponse({
  code,
  message,
  status,
  details,
  headers,
}: ErrorResponseOptions) {
  const body: Record<string, unknown> = {
    error: message,
    code,
  }

  if (details !== undefined) {
    body.details = details
  }

  const init: ResponseInit = { status }

  if (headers) {
    init.headers = headers
  }

  return NextResponse.json(body, init)
}

export type ZodIssueDetail = {
  message: string
  path: (string | number)[]
  code: string
}

export function formatZodError(error: ZodError): ZodIssueDetail[] {
  return error.issues.map((issue) => ({
    message: issue.message,
    path: issue.path
      .map((segment) => (typeof segment === 'symbol' ? segment.toString() : segment))
      .filter((segment): segment is string | number => typeof segment === 'string' || typeof segment === 'number'),
    code: issue.code,
  }))
}
