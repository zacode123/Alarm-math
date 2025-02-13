
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all placeholder:text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 peer",
            className
          )}
          placeholder={label}
          ref={ref}
          {...props}
        />
        {label && (
          <span className="absolute left-3 top-2.5 text-sm text-muted-foreground transition-all peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-2 peer-[:not(:placeholder-shown)]:text-xs bg-background px-1">
            {label}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
