import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-[#E2DDD5] bg-[#FFFDF9] px-3.5 py-2 text-sm text-[#292B2B] placeholder:text-[#8C857B] focus-visible:outline-none focus-visible:border-[#A85D4C] focus-visible:ring-2 focus-visible:ring-[#A85D4C]/25 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-out shadow-[0_1px_2px_rgba(45,48,48,0.02)]",
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

