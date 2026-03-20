import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, onCheckedChange, checked, ...props }, ref) => {
        return (
            <label className="relative inline-flex items-center cursor-pointer group">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    ref={ref}
                    checked={checked}
                    onChange={(e) => onCheckedChange?.(e.target.checked)}
                    {...props}
                />
                <div className={cn(
                    "w-9 h-5 bg-[#E9E9EB] rounded-full transition-all duration-300 peer peer-checked:bg-primary peer-focus:outline-none",
                    "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm peer-checked:after:translate-x-4",
                    className
                )} />
            </label>
        )
    }
)
Switch.displayName = "Switch"

export { Switch }
