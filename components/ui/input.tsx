import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-[44px] w-full min-w-0 bg-[#F0F0F0] px-[12px] py-[10px] text-[15px] font-mono text-black border-[3px] border-black outline-none placeholder:text-gray-500 hover:bg-[#E8E8E8] focus:border-[5px] focus:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#F5F5F5] disabled:border-[#CCCCCC] disabled:text-[#A3A3A3] aria-invalid:border-[#FF0000] transition-all",
        className
      )}
      {...props}
    />
  )
}

export { Input }
