declare module 'swagger-ui-dist/swagger-ui-bundle.js' {
  export interface SwaggerUIOptions {
    url: string
    domNode: HTMLElement
    docExpansion?: 'list' | 'full' | 'none'
    defaultModelsExpandDepth?: number
    displayRequestDuration?: boolean
    tryItOutEnabled?: boolean
  }

  const SwaggerUI: (options: SwaggerUIOptions) => void
  export default SwaggerUI
}
