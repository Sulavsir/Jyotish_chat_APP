import * as React from "react"
import { cn } from "./utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  }

  return (
    <div
      role="status"
      className={cn("inline-block", className)}
      {...props}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-solid border-purple-500 border-t-transparent",
          sizeClasses[size]
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}


