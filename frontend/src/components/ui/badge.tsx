import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#A85D4C]/20 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[#A85D4C]/20 bg-[#A85D4C]/10 text-[#A85D4C]",
        secondary: "border-[#E2DDD5] bg-[#EFEBE4] text-[#292B2B]",
        accent: "border-[#7D4036]/30 bg-[#7D4036]/15 text-[#A85D4C]",
        success: "border-[#2E8B57]/30 bg-[#2E8B57]/10 text-[#2E8B57]",
        warning: "border-[#B38A3D]/30 bg-[#B38A3D]/15 text-[#292B2B]",
        destructive: "border-[#D9534F]/30 bg-[#D9534F]/10 text-[#D9534F]",
        danger: "border-[#D9534F]/30 bg-[#D9534F]/10 text-[#D9534F]",
        navy: "border-[#2D3030]/20 bg-[#2D3030]/10 text-[#2D3030]",
        outline: "border-[#E2DDD5] text-[#7A756E]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

