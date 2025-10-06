import { ApiSwaggerUI } from '@/components/swagger/SwaggerUI'

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-app px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Opus API</h1>
          <p className="text-muted-foreground">
            Описание REST API для словаря и пользовательских списков слов. Авторизация по сессионным кукам.
          </p>
        </header>
        <div className="rounded-lg border border-subtle bg-background p-4 shadow-sm">
          <ApiSwaggerUI />
        </div>
      </div>
    </div>
  )
}
