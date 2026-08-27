import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A8C]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default: "bg-[#1F7A8C] text-[#FFFFFF] hover:bg-[#1F7A8C]/90 font-semibold cursor-pointer shadow-xs",
        destructive: "bg-[#0B2545] text-[#FFFFFF] hover:bg-[#0B2545]/90 shadow-xs cursor-pointer",
        outline: "border border-[#DCE5EA] text-[#102A43] bg-[#FFFFFF] hover:bg-[#EEF5F7] hover:border-[#1F7A8C] hover:text-[#1F7A8C] font-semibold cursor-pointer",
        secondary: "bg-[#EEF5F7] border border-[#DCE5EA] text-[#102A43] hover:bg-[#EEF5F7]/80 hover:border-[#1F7A8C] font-semibold shadow-2xs cursor-pointer",
        accent: "bg-[#D4AF37] text-[#0B2545] hover:bg-[#D4AF37]/90 font-bold shadow-xs cursor-pointer",
        ghost: "text-[#102A43] hover:text-[#1F7A8C] hover:bg-[#EEF5F7] font-semibold cursor-pointer",
        link: "text-[#1F7A8C] underline-offset-4 hover:underline font-semibold cursor-pointer",
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
