import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A8C]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default: "bg-[#1F7A8C] text-[#FFFFFF] hover:bg-[#1F7A8C]/90 font-semibold cursor-pointer shadow-xs",
        destructive: "bg-[#0B2545] text-[#FFFFFF] hover:bg-[#0B2545]/90 shadow-xs cursor-pointer",
        outline: "border border-[#2B2D42]/20 text-[#2B2D42] bg-[#FFFFFF] hover:bg-[#F4F6F9] hover:border-[#1F7A8C] hover:text-[#1F7A8C] font-medium cursor-pointer",
        secondary: "bg-[#FFFFFF] border border-[#1F7A8C] text-[#1F7A8C] hover:bg-[#1F7A8C] hover:text-[#FFFFFF] font-medium shadow-xs cursor-pointer",
        accent: "bg-[#D4AF37] text-[#0B2545] hover:bg-[#D4AF37]/90 font-bold shadow-xs cursor-pointer",
        ghost: "text-[#2B2D42] hover:text-[#1F7A8C] hover:bg-[#F4F6F9] font-medium cursor-pointer",
        link: "text-[#1F7A8C] underline-offset-4 hover:underline font-medium cursor-pointer",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
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
