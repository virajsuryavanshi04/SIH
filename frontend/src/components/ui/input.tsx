import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-[#D8E5EC] bg-[#FFFFFF] px-3 py-2 text-sm text-[#123047] placeholder:text-[#7A8C98] focus-visible:outline-none focus-visible:border-[#176B87] focus-visible:ring-2 focus-visible:ring-[#176B87]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
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

