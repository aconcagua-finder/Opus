import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Language } from '@prisma/client'
import {
  DICTIONARY_AI_MODEL,
  DICTIONARY_AI_RESPONSE_FORMAT,
  buildDictionaryAiSystemPrompt,
  buildDictionaryAiUserPrompt,
} from '@/features/dictionary/prompts/ai-import'

const MAX_TEXT_BYTES = 2 * 1024 * 1024 // 2 MiB
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const requestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  sourceLanguage: z.nativeEnum(Language),
  targetLanguage: z.nativeEnum(Language),
  detectPhrases: z.boolean().default(false),
})

const trimmedString = () =>
  z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: 'String must not be empty after trimming',
    })

const generatedEntrySchema = z.object({
  word: trimmedString(),
  translation: trimmedString(),
  notes: trimmedString(),
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
    const { text, sourceLanguage, targetLanguage, detectPhrases } = requestSchema.parse(json)

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

    const systemPrompt = buildDictionaryAiSystemPrompt({
      sourceLanguage,
      targetLanguage,
      detectPhrases,
    })

    const userPrompt = buildDictionaryAiUserPrompt({
      sourceLanguage,
      targetLanguage,
      text,
      detectPhrases,
    })

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DICTIONARY_AI_MODEL,
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
        response_format: DICTIONARY_AI_RESPONSE_FORMAT,
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

    const candidateEntries =
      typeof structured === 'object' && structured !== null && 'entries' in structured
        ? (structured as { entries: unknown }).entries
        : structured

    const validated = z.array(generatedEntrySchema).safeParse(candidateEntries)
    if (!validated.success) {
      console.error('Validation error for generated entries:', validated.error.format())
      return NextResponse.json(
        { error: 'Ответ модели содержит некорректные данные' },
        { status: 502 }
      )
    }

    const entries: GeneratedEntry[] = validated.data
      .map((item) => ({
        word: item.word,
        translation: item.translation,
        notes: item.notes,
      }))
      .filter((item) => item.word && item.translation)

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
