import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all overflow-hidden shadow-sm',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary/20 text-primary [a&]:hover:bg-primary/30 font-bold',
        secondary:
          'border-transparent bg-secondary/20 text-secondary [a&]:hover:bg-secondary/30',
        destructive:
          'border-transparent bg-destructive/20 text-destructive [a&]:hover:bg-destructive/30 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        outline:
          'text-foreground border-border [a&]:hover:bg-primary/10 [a&]:hover:text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
