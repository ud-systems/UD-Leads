import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn, getLeadStatusClasses, getStoreTypeClasses } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Theme-aware variants for lead statuses and store types
        "lead-status": "border-2 font-medium",
        "store-type": "border-2 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  status?: string; // For lead status
  storeType?: string; // For store type
  isDark?: boolean; // Theme detection
}

function Badge({ 
  className, 
  variant, 
  status, 
  storeType, 
  isDark = false,
  ...props 
}: BadgeProps) {
  // Apply theme-aware colors for lead status or store type
  const getCustomStyles = () => {
    if (variant === "lead-status" && status) {
      return getLeadStatusClasses(status, isDark);
    }
    if (variant === "store-type" && storeType) {
      return getStoreTypeClasses(storeType, isDark);
    }
    return {};
  };

  const customStyles = getCustomStyles();

  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={customStyles}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
