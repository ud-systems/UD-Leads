import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-button text-primary-foreground hover:bg-gradient-button-hover border border-primary/10 transition-all duration-200",
        destructive:
          "bg-gradient-error text-destructive-foreground hover:bg-destructive/90 border border-destructive/20 transition-all duration-200",
        outline:
          "bg-background border border-border/50 hover:bg-accent hover:text-accent-foreground transition-all duration-200",
        secondary:
          "bg-gradient-accent text-secondary-foreground hover:bg-secondary/80 border border-border/50 transition-all duration-200",
        ghost: "hover:bg-accent hover:text-accent-foreground transition-all duration-200",
        link: "text-gradient-primary underline-offset-4 hover:underline",
        back: "bg-neutral-900 text-white hover:bg-neutral-800 border-0 transition-all duration-200 [&_svg]:text-white",
      },
      size: {
        default: "min-h-10 px-4 py-4",
        sm: "min-h-9 px-3 py-3 rounded-md",
        lg: "min-h-11 px-5 py-5 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
