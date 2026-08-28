import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#176B87]/20 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[#176B87]/20 bg-[#176B87]/10 text-[#176B87]",
        secondary: "border-[#D8E5EC] bg-[#EAF3F7] text-[#123047]",
        accent: "border-[#35A7A0]/30 bg-[#35A7A0]/15 text-[#176B87]",
        success: "border-[#2E8B57]/30 bg-[#2E8B57]/10 text-[#2E8B57]",
        warning: "border-[#D49A2A]/30 bg-[#D49A2A]/15 text-[#123047]",
        destructive: "border-[#D9534F]/30 bg-[#D9534F]/10 text-[#D9534F]",
        danger: "border-[#D9534F]/30 bg-[#D9534F]/10 text-[#D9534F]",
        navy: "border-[#123B5D]/20 bg-[#123B5D]/10 text-[#123B5D]",
        outline: "border-[#D8E5EC] text-[#5D7180]",
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

