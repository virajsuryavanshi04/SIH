import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176B87]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default: "bg-[#176B87] text-[#FFFFFF] hover:bg-[#123B5D] font-semibold cursor-pointer shadow-xs",
        destructive: "bg-[#D9534F] text-[#FFFFFF] hover:bg-[#D9534F]/90 shadow-xs cursor-pointer",
        outline: "border border-[#D8E5EC] text-[#123047] bg-[#FFFFFF] hover:bg-[#EAF3F7] hover:border-[#176B87] hover:text-[#176B87] font-semibold cursor-pointer",
        secondary: "bg-[#EAF3F7] border border-[#D8E5EC] text-[#123047] hover:bg-[#EAF3F7]/80 hover:border-[#176B87] font-semibold shadow-2xs cursor-pointer",
        accent: "bg-[#35A7A0] text-[#FFFFFF] hover:bg-[#176B87] font-semibold shadow-xs cursor-pointer",
        ghost: "text-[#123047] hover:text-[#176B87] hover:bg-[#EAF3F7] font-semibold cursor-pointer",
        link: "text-[#176B87] underline-offset-4 hover:underline font-semibold cursor-pointer",
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

