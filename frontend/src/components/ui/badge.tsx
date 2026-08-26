import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#1F7A8C]/20 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[#1F7A8C]/20 bg-[#1F7A8C]/10 text-[#1F7A8C]",
        secondary: "border-[#2B2D42]/15 bg-[#F4F6F9] text-[#2B2D42]",
        accent: "border-[#D4AF37]/30 bg-[#D4AF37]/15 text-[#D4AF37]",
        success: "border-[#2E7D32]/30 bg-[#2E7D32]/10 text-[#2E7D32]",
        warning: "border-[#D4AF37]/30 bg-[#D4AF37]/15 text-[#D4AF37]",
        destructive: "border-[#D4AF37]/30 bg-[#D4AF37]/15 text-[#D4AF37]",
        danger: "border-[#D4AF37]/30 bg-[#D4AF37]/15 text-[#D4AF37]",
        navy: "border-[#0B2545]/20 bg-[#0B2545]/10 text-[#0B2545]",
        outline: "border-[#2B2D42]/20 text-[#2B2D42]",
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
