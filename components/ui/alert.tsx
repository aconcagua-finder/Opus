import * as React from "react"
import { cn } from "@/lib/utils"

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'error' | 'success' | 'warning'
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'border-subtle bg-surface-muted text-primary',
    error: 'border-red-500/40 bg-red-500/10 text-red-500',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500',
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  }

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative w-full rounded-xl border p-4 backdrop-blur-xl transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }
