'use client'

import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open || typeof document === 'undefined') return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!mounted || !open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full justify-center px-4 pb-6 sm:pb-10">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'relative w-full max-w-xl rounded-t-3xl border border-zinc-800/60 bg-zinc-950/95 shadow-[0_20px_60px_rgba(8,145,178,0.25)] sm:rounded-3xl',
            'max-h-[90vh] overflow-hidden sm:max-h-[85vh] backdrop-blur-lg',
            className
          )}
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            aria-label="Закрыть"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18L18 6" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
          <div className="max-h-[90vh] overflow-y-auto px-5 pb-6 pt-12 sm:px-8 sm:pt-14">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
