import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  success?: boolean;
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, label, error, success, value, ...props }, ref) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value && value.toString().length > 0;

    const getBorderColor = () => {
      if (error) {
        return theme === 'dark' ? 'border-red-400' : 'border-red-500';
      }
      if (success) {
        return theme === 'dark' ? 'border-green-400' : 'border-green-500';
      }
      if (isFocused) {
        return theme === 'dark' ? 'border-blue-400' : 'border-blue-600';
      }
      return theme === 'dark' ? 'border-gray-700' : 'border-gray-300';
    };

    const getFocusRingColor = () => {
      if (error) {
        return theme === 'dark' ? 'focus-visible:ring-red-400/30' : 'focus-visible:ring-red-500/30';
      }
      if (success) {
        return theme === 'dark' ? 'focus-visible:ring-green-400/30' : 'focus-visible:ring-green-500/30';
      }
      return theme === 'dark' ? 'focus-visible:ring-blue-400/30' : 'focus-visible:ring-blue-600/30';
    };

    return (
      <div className="relative">
        <input
          className={cn(
            "flex h-12 w-full rounded-md border bg-background px-3 pt-6 pb-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            getBorderColor(),
            getFocusRingColor(),
            className
          )}
          ref={ref}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={label}
          {...props}
        />
        <label
          className={cn(
            "absolute left-3 transition-all duration-200 pointer-events-none text-sm",
            isFocused || hasValue
              ? "top-1 text-xs text-muted-foreground"
              : "top-4 text-sm text-muted-foreground"
          )}
        >
          {label}
        </label>
      </div>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";
