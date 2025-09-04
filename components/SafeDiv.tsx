import React from 'react'

// Безопасный div который игнорирует ошибки гидратации от расширений браузера
export const SafeDiv = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => {
  return (
    <div {...props} ref={ref} suppressHydrationWarning>
      {children}
    </div>
  )
})

SafeDiv.displayName = 'SafeDiv'

export default SafeDiv