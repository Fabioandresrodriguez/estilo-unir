import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-sans font-semibold uppercase tracking-[1px] transition-all select-none",
  {
    variants: {
      variant: {
        default: "bg-[#FFFFFF] text-[#000000] border-[2px] border-[#000000] px-[10px] py-[2px] text-[11px]",
        active: "bg-[#FFFFFF] text-[#008000] border-[2px] border-[#008000] px-[10px] py-[2px] text-[11px]",
        warning: "bg-[#FFFFFF] text-[#FFA500] border-[2px] border-[#FFA500] px-[10px] py-[2px] text-[11px]",
        error: "bg-[#FFFFFF] text-[#FF0000] border-[2px] border-[#FF0000] px-[10px] py-[2px] text-[11px]",
        destructive: "bg-[#FF0000] text-[#FFFFFF] border-[2px] border-[#000000] px-[10px] py-[2px] text-[11px]",
        outline: "bg-[#FFFFFF] text-[#000000] border-[2px] border-[#000000] px-[10px] py-[2px] text-[11px]",
        filter: "bg-[#FFFFFF] text-[#000000] border-[2px] border-[#000000] px-[12px] py-[4px] text-[10px] tracking-[1px] hover:bg-[#000000] hover:text-[#FFFFFF] cursor-pointer",
        filterActive: "bg-[#000000] text-[#FFFFFF] border-[2px] border-[#000000] px-[12px] py-[4px] text-[10px] tracking-[1px] cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
