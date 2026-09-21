import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-sans font-bold uppercase tracking-[2px] whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#F0F0F0] disabled:text-[#A3A3A3] disabled:border-[#CCCCCC] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#000000] text-[#FFFFFF] border-[3px] border-[#000000] hover:bg-[#FFFFFF] hover:text-[#000000] active:border-[5px] active:bg-[#000000] active:text-[#FFFFFF]",
        secondary:
          "bg-[#FFFFFF] text-[#000000] border-[3px] border-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF] active:bg-[#FFFFFF] active:text-[#000000]",
        ghost:
          "bg-transparent text-[#000000] border-none underline hover:text-[#0000FF] hover:bg-transparent",
        destructive:
          "bg-[#FF0000] text-[#FFFFFF] border-[3px] border-[#000000] hover:bg-[#000000] hover:text-[#FF0000]",
        link: "text-[#0000FF] underline-offset-4 hover:underline normal-case tracking-normal",
      },
      size: {
        default: "h-[44px] px-[24px] text-[14px]",
        sm: "h-[32px] px-[16px] text-[12px]",
        lg: "h-[56px] px-[40px] text-[18px]",
        icon: "size-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
