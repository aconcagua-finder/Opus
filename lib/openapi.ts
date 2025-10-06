const errorResponseSchema = {
  type: 'object',
  required: ['error', 'code'],
  additionalProperties: false,
  properties: {
    error: { type: 'string', description: 'Человеко-читаемое описание ошибки' },
    code: { type: 'string', description: 'Машино-читаемый код ошибки' },
    details: { description: 'Дополнительные данные об ошибке' }
  }
} as const

const messageResponseSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string' }
  }
} as const

const languageSchema = {
  type: 'string',
  description: 'Код языка',
  enum: ['SPANISH', 'ENGLISH', 'RUSSIAN']
} as const

const dictionaryEntrySchema = {
  type: 'object',
  required: [
    'id',
    'userId',
    'word',
    'sourceLanguage',
    'translation',
    'targetLanguage',
    'timesViewed',
    'timesCorrect',
    'createdAt',
    'updatedAt'
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    word: { type: 'string', description: 'Оригинальное слово' },
    sourceLanguage: { $ref: '#/components/schemas/LanguageCode' },
    translation: { type: 'string', description: 'Перевод слова' },
    targetLanguage: { $ref: '#/components/schemas/LanguageCode' },
    notes: { type: 'string', nullable: true, description: 'Произвольные заметки' },
    difficulty: { type: 'number', nullable: true, description: 'Устаревшее поле сложности' },
    timesViewed: { type: 'integer', format: 'int32' },
    timesCorrect: { type: 'integer', format: 'int32' },
    lastReviewed: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
} as const

const createDictionaryEntrySchema = {
  type: 'object',
  required: ['word', 'sourceLanguage', 'translation', 'targetLanguage'],
  additionalProperties: false,
  properties: {
    word: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Слово в оригинале'
    },
    sourceLanguage: { $ref: '#/components/schemas/LanguageCode' },
    translation: {
      type: 'string',
      minLength: 1,
      maxLength: 200,
      description: 'Перевод слова'
    },
    targetLanguage: { $ref: '#/components/schemas/LanguageCode' },
    notes: {
      type: 'string',
      maxLength: 1500,
      description: 'Произвольные заметки к слову'
    }
  }
} as const

const updateDictionaryEntrySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    word: { ...createDictionaryEntrySchema.properties.word },
    sourceLanguage: { $ref: '#/components/schemas/LanguageCode' },
    translation: { ...createDictionaryEntrySchema.properties.translation },
    targetLanguage: { $ref: '#/components/schemas/LanguageCode' },
    notes: { ...createDictionaryEntrySchema.properties.notes }
  }
} as const

const paginationSchema = {
  type: 'object',
  required: ['page', 'limit', 'total', 'pages'],
  properties: {
    page: { type: 'integer', format: 'int32', minimum: 1 },
    limit: { type: 'integer', format: 'int32', minimum: 1, maximum: 200 },
    total: { type: 'integer', format: 'int32', minimum: 0 },
    pages: { type: 'integer', format: 'int32', minimum: 0 }
  }
} as const

const dictionaryListResponseSchema = {
  type: 'object',
  required: ['entries', 'pagination'],
  properties: {
    entries: {
      type: 'array',
      items: { $ref: '#/components/schemas/DictionaryEntry' }
    },
    pagination: paginationSchema
  }
} as const

const dictionaryStatsSchema = {
  type: 'object',
  required: ['totalEntries', 'entriesByLanguage', 'recentlyAdded', 'needsReview'],
  properties: {
    totalEntries: { type: 'integer', format: 'int32' },
    entriesByLanguage: {
      type: 'object',
      additionalProperties: { type: 'integer', format: 'int32' },
      description: 'Количество слов по каждому исходному языку'
    },
    recentlyAdded: { type: 'integer', format: 'int32' },
    needsReview: { type: 'integer', format: 'int32' }
  }
} as const

const dictionaryImportRequestSchema = {
  type: 'object',
  required: ['entries'],
  properties: {
    entries: {
      type: 'array',
      minItems: 1,
      maxItems: 100,
      items: createDictionaryEntrySchema
    }
  }
} as const

const dictionaryImportResponseSchema = {
  type: 'object',
  required: ['created', 'skipped'],
  properties: {
    created: { type: 'integer', format: 'int32', minimum: 0 },
    skipped: { type: 'integer', format: 'int32', minimum: 0 }
  }
} as const

const wordListTypeSchema = {
  type: 'string',
  enum: ['CUSTOM', 'AUTO_7_DAYS', 'AUTO_14_DAYS', 'AUTO_28_DAYS']
} as const

const wordListSchema = {
  type: 'object',
  required: [
    'id',
    'userId',
    'name',
    'type',
    'isArchived',
    'createdAt',
    'updatedAt'
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    type: { $ref: '#/components/schemas/WordListType' },
    description: { type: 'string', nullable: true, maxLength: 500 },
    color: { type: 'string', nullable: true, pattern: '^#[0-9A-Fa-f]{6}$' },
    isArchived: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    wordCount: { type: 'integer', format: 'int32', nullable: true }
  }
} as const

const createWordListSchema = {
  type: 'object',
  required: ['name'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string', maxLength: 500 },
    color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }
  }
} as const

const updateWordListSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string', maxLength: 500 },
    color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    isArchived: { type: 'boolean' }
  }
} as const

const wordListArrayResponseSchema = {
  type: 'object',
  required: ['lists'],
  properties: {
    lists: {
      type: 'array',
      items: { $ref: '#/components/schemas/WordList' }
    }
  }
} as const

const wordListWithEntriesResponseSchema = {
  type: 'object',
  required: ['entries', 'list'],
  properties: {
    entries: {
      type: 'array',
      items: { $ref: '#/components/schemas/DictionaryEntry' }
    },
    list: { $ref: '#/components/schemas/WordList' }
  }
} as const

const wordListItemWithEntrySchema = {
  type: 'object',
  required: ['id', 'listId', 'entryId', 'addedAt', 'entry'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    listId: { type: 'string', format: 'uuid' },
    entryId: { type: 'string', format: 'uuid' },
    addedAt: { type: 'string', format: 'date-time' },
    entry: { $ref: '#/components/schemas/DictionaryEntry' }
  }
} as const

const addWordListItemRequestSchema = {
  type: 'object',
  required: ['entryId'],
  properties: {
    entryId: { type: 'string', format: 'uuid' }
  }
} as const

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Opus API',
    version: '1.0.0',
    description: 'Документация REST API для словаря и списков слов приложения Opus.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Локальная разработка'
    }
  ],
  tags: [
    { name: 'Dictionary', description: 'Работа с персональным словарем' },
    { name: 'Word Lists', description: 'Управление пользовательскими списками слов' }
  ],
  paths: {
    '/api/dictionary': {
      get: {
        tags: ['Dictionary'],
        summary: 'Получить список слов из словаря',
        parameters: [
          {
            name: 'sourceLanguage',
            in: 'query',
            schema: { $ref: '#/components/schemas/LanguageCode' },
            description: 'Фильтрация по языку оригинала'
          },
          {
            name: 'targetLanguage',
            in: 'query',
            schema: { $ref: '#/components/schemas/LanguageCode' },
            description: 'Фильтрация по языку перевода'
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Поиск по слову или переводу'
          },
          {
            name: 'listId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Идентификатор списка для фильтрации'
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000 },
            description: 'Номер страницы (по умолчанию 1)'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 200 },
            description: 'Размер страницы (по умолчанию 50)'
          }
        ],
        responses: {
          '200': {
            description: 'Список слов пользователя',
            content: {
              'application/json': {
                schema: dictionaryListResponseSchema
              }
            }
          },
          '400': {
            description: 'Некорректные параметры фильтрации или пагинации',
            content: { 'application/json': { schema: errorResponseSchema } }
          },
          '401': {
            description: 'Неавторизованный доступ',
            content: { 'application/json': { schema: errorResponseSchema } }
          },
          '500': {
            description: 'Не удалось получить список слов',
            content: { 'application/json': { schema: errorResponseSchema } }
          }
        },
        security: [{ SessionCookie: [] }]
      },
      post: {
        tags: ['Dictionary'],
        summary: 'Добавить новое слово в словарь',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: createDictionaryEntrySchema
            }
          }
        },
        responses: {
          '201': {
            description: 'Слово добавлено',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DictionaryEntry' }
              }
            }
          },
          '400': {
            description: 'Ошибка валидации данных или дубликат слова',
            content: { 'application/json': { schema: errorResponseSchema } }
          },
          '401': {
            description: 'Неавторизованный доступ',
            content: { 'application/json': { schema: errorResponseSchema } }
          },
          '500': {
            description: 'Не удалось создать запись',
            content: { 'application/json': { schema: errorResponseSchema } }
          }
        },
        security: [{ SessionCookie: [] }]
      }
    },
    '/api/dictionary/{id}': {
      get: {
        tags: ['Dictionary'],
        summary: 'Получить слово по идентификатору',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Запись словаря',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DictionaryEntry' }
              }
            }
          },
          '401': { description: 'Неавторизованный доступ', content: { 'application/json': { schema: errorResponseSchema } } },
          '404': { description: 'Слово не найдено', content: { 'application/json': { schema: errorResponseSchema } } },
          '500': { description: 'Ошибка получения записи', content: { 'application/json': { schema: errorResponseSchema } } }
        },
        security: [{ SessionCookie: [] }]
      },
      put: {
        tags: ['Dictionary'],
        summary: 'Обновить существующее слово',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: updateDictionaryEntrySchema
            }
          }
        },
        responses: {
          '200': {
            description: 'Обновленная запись',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DictionaryEntry' }
              }
            }
          },
          '400': { description: 'Ошибка валидации или дубликат', content: { 'application/json': { schema: errorResponseSchema } } },
          '401': { description: 'Неавторизованный доступ', content: { 'application/json': { schema: errorResponseSchema } } },
          '404': { description: 'Запись не найдена', content: { 'application/json': { schema: errorResponseSchema } } },
          '500': { description: 'Ошибка обновления', content: { 'application/json': { schema: errorResponseSchema } } }
        },
        security: [{ SessionCookie: [] }]
      },
      delete: {
        tags: ['Dictionary'],
        summary: 'Удалить слово',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': { description: 'Слово удалено', content: { 'application/json': { schema: messageResponseSchema } } },
          '401': { description: 'Неавторизованный доступ', content: { 'application/json': { schema: errorResponseSchema } } },
          '404': { description: 'Запись не найдена', content: { 'application/json': { schema: errorResponseSchema } } },
          '500': { description: 'Ошибка удаления', content: { 'application/json': { schema: errorResponseSchema } } }
        },
        security: [{ SessionCookie: [] }]
      }
    },
    '/api/dictionary/stats': {
      get: {
        tags: ['Dictionary'],
        summary: 'Получить агрегированную статистику словаря',
        responses: {
          '200': {
            description: 'Статистика словаря',
            content: {
              'application/json': {
                schema: dictionaryStatsSchema
              }
            }
          },
          '401': { description: 'Неавторизованный доступ', content: { 'application/json': { schema: errorResponseSchema } } },
          '500': { description: 'Ошибка получения статистики', content: { 'application/json': { schema: errorResponseSchema } } }
        },
        security: [{ SessionCookie: [] }]
      }
    },
    '/api/dictionary/import': {
      post: {
        tags: ['Dictionary'],
        summary: 'Массовый импорт слов',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: dictionaryImportRequestSchema
            }
          }
        },
        responses: {
          '200': {
            description: 'Результат импорта',
            content: {
              'application/json': {
                schema: dictionaryImportResponseSchema
              }
            }
          },
          '400': { description: 'Ошибка валидации', content: { 'application/json': { schema: errorResponseSchema } } },
          '401': { description: 'Неавторизованный доступ', content: { 'application/json': { schema: errorResponseSchema } } },
          '500': { description: 'Ошибка импорта', content: { 'application/json': { schema: errorResponseSchema } } }
        },
        security: [{ SessionCookie: [] }]
      }
    },
    '/api/word-lists': {
      get: {
        tags: ['Word Lists'],
        summary: 'Получить списки слов пользователя',
        parameters: [
          {
            name: 'includeArchived',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Включить архивированные списки (по умолчанию false)'
          }
        ],
        responses: {
          '200': {
            description: 'Списки слов',
            content: {
              'application/json': {
                schema: wordListArrayResponseSchema
              }
            }
          },
          '401': { description: 'Неавторизованный доступ', content: { 'application/json': { schema: errorResponseSchema } } },
          '500': { description: 'Ошибка получения списков', content: { 'application/json': { schema: errorResponseSchema } } }
        },
        security: [{ SessionCookie: [] }]
      },
      post: {
        tags: ['Word Lists'],
        summary: 'Создать новый кастомный список',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: createWordListSchema } }
        },
        responses: {
          '201': {
            description: 'Список создан',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WordList' }
              }
            }
          },
          '400': { description: 'Ошибка валидации или дубликат имени', content: { 'application/json': { schema: errorResponseSchema } } },
          '401': { description: 'Неавторизованный доступ', content: { 'application/json': { schema: errorResponseSchema } } },
          '500': { description: 'Ошибка создания списка', content: { 'application/json': { schema: errorResponseSchema } } }
        },
        security: [{ SessionCookie: [] }]
      }
    },
    '/api/word-lists/{id}': {
      get: {
        tags: ['Word Lists'],
        summary: 'Получить список и его содержимое',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Список и слова внутри',
            content: {
              'application/json': {
                schema: wordListWithEntriesResponseSchema
              }
            }
          },
          '400': { description: 'Некорректный идентификатор авто-списка', content: { 'application/json': { schema: errorResponseSchema } } },
          '401': { description: 'Неавторизованный доступ', content: { 'application/json': { schema: errorResponseSchema } } },
          '404': { description: 'Список не найден', content: { 'application/json': { schema: errorResponseSchema } } },
          '500': { description: 'Ошибка получения списка', content: { 'application/json': { schema: errorResponseSchema } } }
        },
        security: [{ SessionCookie: [] }]
      },
      put: {
        tags: ['Word Lists'],
        summary: 'Обновить свойства списка',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: updateWordListSchema } }
        },
        responses: {
          '200': { description: 'Обновленный список', content: { 'application/json': { schema: { $ref: '#/components/schemas/WordList' } } } },
          '400': { description: 'Ошибка валидации или попытка изменить авто-список', content: { 'application/json': { schema: errorResponseSchema } } },
          '401': { description: 'Неавторизованный доступ', content: { 'application/json': { schema: errorResponseSchema } } },
          '404': { description: 'Список не найден', content: { 'application/json': { schema: errorResponseSchema } } },
          '500': { description: 'Ошибка обновления', content: { 'application/json': { schema: errorResponseSchema } } }
        },
        security: [{ SessionCookie: [] }]
      },
      delete: {
        tags: ['Word Lists'],
        summary: 'Удалить список',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Список удален', content: { 'application/json': { schema: messageResponseSchema } } },
          '400': { description: 'Нельзя удалить авто-список', content: { 'application/json': { schema: errorResponseSchema } } },
          '401': { description: 'Неавторизованный доступ', content: { 'application/json': { schema: errorResponseSchema } } },
          '404': { description: 'Список не найден', content: { 'application/json': { schema: errorResponseSchema } } },
          '500': { description: 'Ошибка удаления', content: { 'application/json': { schema: errorResponseSchema } } }
        },
        security: [{ SessionCookie: [] }]
      }
    },
    '/api/word-lists/{id}/items': {
      post: {
        tags: ['Word Lists'],
        summary: 'Добавить слово в список',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: addWordListItemRequestSchema
            }
          }
        },
        responses: {
          '201': {
            description: 'Слово добавлено в список',
            content: {
              'application/json': {
                schema: wordListItemWithEntrySchema
              }
            }
          },
          '400': { description: 'Ошибка валидации или попытка изменить авто-список', content: { 'application/json': { schema: errorResponseSchema } } },
          '401': { description: 'Неавторизованный доступ', content: { 'application/json': { schema: errorResponseSchema } } },
          '404': { description: 'Список или слово не найдены', content: { 'application/json': { schema: errorResponseSchema } } },
          '500': { description: 'Ошибка добавления', content: { 'application/json': { schema: errorResponseSchema } } }
        },
        security: [{ SessionCookie: [] }]
      }
    },
    '/api/word-lists/{id}/items/{entryId}': {
      delete: {
        tags: ['Word Lists'],
        summary: 'Удалить слово из списка',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'entryId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': { description: 'Слово удалено из списка', content: { 'application/json': { schema: messageResponseSchema } } },
          '400': { description: 'Попытка изменить авто-список или некорректные параметры', content: { 'application/json': { schema: errorResponseSchema } } },
          '401': { description: 'Неавторизованный доступ', content: { 'application/json': { schema: errorResponseSchema } } },
          '404': { description: 'Список или запись не найдены', content: { 'application/json': { schema: errorResponseSchema } } },
          '500': { description: 'Ошибка удаления', content: { 'application/json': { schema: errorResponseSchema } } }
        },
        security: [{ SessionCookie: [] }]
      }
    },
    '/api/word-lists/entries/{entryId}': {
      get: {
        tags: ['Word Lists'],
        summary: 'Получить списки, в которых присутствует слово',
        parameters: [
          { name: 'entryId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Списки с указанием количества слов',
            content: {
              'application/json': {
                schema: wordListArrayResponseSchema
              }
            }
          },
          '401': { description: 'Неавторизованный доступ', content: { 'application/json': { schema: errorResponseSchema } } },
          '404': { description: 'Запись словаря не найдена', content: { 'application/json': { schema: errorResponseSchema } } },
          '500': { description: 'Ошибка получения данных', content: { 'application/json': { schema: errorResponseSchema } } }
        },
        security: [{ SessionCookie: [] }]
      }
    }
  },
  components: {
    securitySchemes: {
      SessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'Сессия пользователя. Требуется авторизация через /api/auth/login или Google OAuth.'
      }
    },
    schemas: {
      LanguageCode: languageSchema,
      DictionaryEntry: dictionaryEntrySchema,
      CreateDictionaryEntryInput: createDictionaryEntrySchema,
      UpdateDictionaryEntryInput: updateDictionaryEntrySchema,
      DictionaryListResponse: dictionaryListResponseSchema,
      DictionaryStats: dictionaryStatsSchema,
      DictionaryImportRequest: dictionaryImportRequestSchema,
      DictionaryImportResult: dictionaryImportResponseSchema,
      WordListType: wordListTypeSchema,
      WordList: wordListSchema,
      CreateWordListInput: createWordListSchema,
      UpdateWordListInput: updateWordListSchema,
      WordListArrayResponse: wordListArrayResponseSchema,
      WordListWithEntriesResponse: wordListWithEntriesResponseSchema,
      WordListItemWithEntry: wordListItemWithEntrySchema,
      AddWordListItemInput: addWordListItemRequestSchema,
      ErrorResponse: errorResponseSchema,
      MessageResponse: messageResponseSchema
    }
  }
} as const

export type OpenApiDocument = typeof openApiDocument
