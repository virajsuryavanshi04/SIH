import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D4C]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default: "bg-[#A85D4C] text-[#FFFDF9] hover:bg-[#7D4036] font-semibold cursor-pointer shadow-xs",
        destructive: "bg-[#D9534F] text-[#FFFDF9] hover:bg-[#D9534F]/90 shadow-xs cursor-pointer",
        outline: "border border-[#E2DDD5] text-[#292B2B] bg-[#FFFDF9] hover:bg-[#F7F4EE] hover:border-[#A85D4C] hover:text-[#7D4036] font-semibold cursor-pointer shadow-[0_1px_2px_rgba(45,48,48,0.02)]",
        secondary: "bg-[#EFEBE4] border border-[#E2DDD5] text-[#292B2B] hover:bg-[#FFFDF9] hover:border-[#A85D4C] font-semibold shadow-2xs cursor-pointer",
        accent: "bg-[#7D4036] text-[#FFFDF9] hover:bg-[#A85D4C] font-semibold shadow-xs cursor-pointer",
        ghost: "text-[#292B2B] hover:text-[#7D4036] hover:bg-[#EFEBE4] font-semibold cursor-pointer",
        link: "text-[#A85D4C] underline-offset-4 hover:underline font-semibold cursor-pointer",
      },
      size: {
        default: "h-9.5 px-4 py-2 text-sm",
        sm: "h-8.5 rounded-lg px-3 text-xs sm:text-sm",
        lg: "h-11 rounded-xl px-6 text-base",
        icon: "h-9 w-9 rounded-lg",
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

