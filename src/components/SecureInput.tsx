import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface SecureInputProps extends React.ComponentProps<typeof Input> {
  isApiKey?: boolean
  onValidate?: (value: string) => boolean
  validationMessage?: string
}

export const SecureInput = React.forwardRef<HTMLInputElement, SecureInputProps>(
  ({ className, type = "password", isApiKey = false, onValidate, validationMessage, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isValid, setIsValid] = React.useState<boolean | null>(null)
    const [inputValue, setInputValue] = React.useState("")

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInputValue(value)
      
      if (onValidate && value.length > 0) {
        const valid = onValidate(value)
        setIsValid(valid)
      } else {
        setIsValid(null)
      }
      
      props.onChange?.(e)
    }

    const maskedValue = React.useMemo(() => {
      if (!isApiKey || showPassword || inputValue.length === 0) return inputValue
      return "•".repeat(Math.min(inputValue.length, 16))
    }, [inputValue, isApiKey, showPassword])

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={showPassword ? "text" : type}
          className={cn(
            "pr-20",
            isValid === false && "border-destructive",
            isValid === true && "border-green-500",
            className
          )}
          value={maskedValue}
          onChange={handleValueChange}
          {...props}
        />
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
          {isApiKey && (
            <Shield className={cn(
              "h-4 w-4",
              isValid === true ? "text-green-500" : isValid === false ? "text-destructive" : "text-muted-foreground"
            )} />
          )}
          {(type === "password" || isApiKey) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        {validationMessage && isValid === false && (
          <p className="text-sm text-destructive mt-1">{validationMessage}</p>
        )}
      </div>
    )
  }
)

SecureInput.displayName = "SecureInput"