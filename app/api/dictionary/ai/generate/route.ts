import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Language } from '@prisma/client'

const MAX_TEXT_BYTES = 2 * 1024 * 1024 // 2 MiB
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = process.env.OPENAI_DICTIONARY_MODEL || 'gpt-5-mini'

const requestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  sourceLanguage: z.nativeEnum(Language),
  targetLanguage: z.nativeEnum(Language),
})

const generatedEntrySchema = z.object({
  word: z.string().min(1),
  translation: z.string().min(1),
  notes: z.string(),
})

type GeneratedEntry = z.infer<typeof generatedEntrySchema>

function getByteLength(text: string) {
  return Buffer.byteLength(text, 'utf8')
}

type OpenAIResponsePayload = {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

function extractEntriesFromPayload(payload: OpenAIResponsePayload): unknown {
  console.log('Extracting from payload:', payload)

  if (!payload?.choices?.[0]?.message?.content) {
    console.log('No content found in payload')
    return null
  }

  const content = payload.choices[0].message.content.trim()
  console.log('Content to parse:', content)

  if (!content) {
    console.log('Content is empty')
    return null
  }

  try {
    const parsed = JSON.parse(content)
    console.log('Parsed JSON:', parsed)
    return parsed
  } catch (error) {
    console.log('JSON parse error:', error, 'Content was:', content)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Получаем userId из middleware headers
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured on the server' },
        { status: 500 }
      )
    }

    const json = await request.json()
    const { text, sourceLanguage, targetLanguage } = requestSchema.parse(json)

    if (sourceLanguage === targetLanguage) {
      return NextResponse.json(
        { error: 'Source and target languages must be different' },
        { status: 400 }
      )
    }

    if (getByteLength(text) > MAX_TEXT_BYTES) {
      return NextResponse.json(
        { error: 'Размер текста превышает допустимый лимит (2 МБ)' },
        { status: 413 }
      )
    }

    const systemPrompt = `You are an assistant that extracts foreign language vocabulary pairs.
Always reply with a JSON array of objects that strictly match this TypeScript type:

type VocabularyItem = {
  word: string // unique vocabulary item in the source language, lowercased unless proper noun
  translation: string // natural translation in the target language
  notes?: string // optional usage note or short example (${sourceLanguage} or ${targetLanguage}), <= 120 chars
}

Rules:
- Work with the provided source and target languages.
- Extract up to 50 of the most useful unique vocabulary items.
- Focus on single words or very short multi-word expressions (<= 3 words).
- Ignore numbers, URLs, email addresses, gibberish, or duplicates.
- Normalise words to dictionary form when possible.
- Preserve proper nouns (names, places) with correct casing.
- If nothing suitable is found, return an empty array [] without additional text.
- DO NOT wrap the JSON answer in markdown code fences or add explanations.`

    const userPrompt = `Source language: ${sourceLanguage}
Target language: ${targetLanguage}

Text:
"""
${text}
"""`

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_completion_tokens: 4000,
        reasoning_effort: "low",
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'vocabulary_items',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['entries'],
              properties: {
                entries: {
                  type: 'array',
                  maxItems: 50,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['word', 'translation', 'notes'],
                    properties: {
                      word: { type: 'string', minLength: 1, maxLength: 100 },
                      translation: { type: 'string', minLength: 1, maxLength: 200 },
                      notes: { type: 'string', maxLength: 500 },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null)
      console.error('OpenAI API error:', errorPayload)
      const message = errorPayload?.error?.message || 'Не удалось получить ответ от модели OpenAI'
      return NextResponse.json(
        { error: message },
        { status: 502 }
      )
    }

    const payload: OpenAIResponsePayload = await response.json()

    // Добавим логирование для отладки
    console.log('OpenAI Response:', JSON.stringify(payload, null, 2))

    const structured = extractEntriesFromPayload(payload)

    if (!structured) {
      console.log('Failed to extract entries from payload:', payload)
      return NextResponse.json(
        { error: 'Модель не вернула распознаваемый ответ' },
        { status: 502 }
      )
    }

    const candidateEntries = (structured as any)?.entries ?? structured

    const validated = z.array(generatedEntrySchema).safeParse(candidateEntries)
    if (!validated.success) {
      console.error('Validation error for generated entries:', validated.error.format())
      return NextResponse.json(
        { error: 'Ответ модели содержит некорректные данные' },
        { status: 502 }
      )
    }

    const entries: GeneratedEntry[] = validated.data.map((item) => ({
      word: item.word.trim(),
      translation: item.translation.trim(),
      notes: item.notes?.trim() || '',
    })).filter((item) => item.word && item.translation)

    const enriched = entries.map((entry) => ({
      ...entry,
      sourceLanguage,
      targetLanguage,
    }))

    return NextResponse.json({ entries: enriched })
  } catch (error) {
    console.error('Dictionary AI generate error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Некорректные данные запроса', details: error.flatten() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Не удалось обработать запрос генерации слов' },
      { status: 500 }
    )
  }
}
