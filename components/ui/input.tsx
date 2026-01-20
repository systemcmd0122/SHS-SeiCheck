import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-on-primary border-border h-11 w-full min-w-0 rounded-xl border-2 bg-card px-4 py-2.5 text-base shadow-sm transition-all outline-none file:inline-flex file:h-8 file:border-0 file:bg-primary file:text-on-primary file:rounded-lg file:text-sm file:font-semibold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50 md:text-sm',
        'focus-visible:border-primary focus-visible:ring-primary/30 focus-visible:ring-[4px]',
        'aria-invalid:ring-destructive/30 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
