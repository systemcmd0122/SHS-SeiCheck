import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-border placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30 aria-invalid:ring-destructive/30 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-20 w-full rounded-xl border-2 bg-card px-4 py-3 text-base shadow-sm transition-all outline-none focus-visible:ring-[4px] disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50 md:text-sm font-medium',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
