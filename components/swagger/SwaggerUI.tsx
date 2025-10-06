'use client'

import { useEffect, useRef } from 'react'
import 'swagger-ui-dist/swagger-ui.css'

type SwaggerUIBundleType = (options: {
  url: string
  domNode: HTMLElement
  docExpansion?: 'list' | 'full' | 'none'
  defaultModelsExpandDepth?: number
  displayRequestDuration?: boolean
  tryItOutEnabled?: boolean
}) => void

export function ApiSwaggerUI() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    async function loadSwagger() {
      const mod = await import('swagger-ui-dist/swagger-ui-bundle.js')
      const SwaggerUIBundle: SwaggerUIBundleType = (mod as unknown as { default: SwaggerUIBundleType }).default

      if (!isMounted || !containerRef.current) {
        return
      }

      SwaggerUIBundle({
        url: '/api/openapi',
        domNode: containerRef.current,
        docExpansion: 'list',
        defaultModelsExpandDepth: 0,
        displayRequestDuration: true,
        tryItOutEnabled: false,
      })
    }

    void loadSwagger()

    return () => {
      isMounted = false
    }
  }, [])

  return <div ref={containerRef} className="swagger-ui" />
}
