"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AspectRatioProps = {
  ratio?: number
  children: React.ReactNode
  className?: string
}

export function AspectRatio({ ratio = 1, className, children, ...props }: AspectRatioProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative w-full", className)} {...props}>
      <div className="pt-[100%]" style={{ paddingTop: `${100 / ratio}%` }} />
      <div className="absolute inset-0">{children}</div>
    </div>
  )
}
