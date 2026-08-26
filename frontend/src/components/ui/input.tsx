import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[#2B2D42]/20 bg-[#FFFFFF] px-3 py-2 text-sm text-[#2B2D42] placeholder:text-[#2B2D42]/50 focus-visible:outline-none focus-visible:border-[#1F7A8C] focus-visible:ring-2 focus-visible:ring-[#1F7A8C]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
