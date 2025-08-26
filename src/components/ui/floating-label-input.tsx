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
    const { isDark } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value && value.toString().length > 0;

    const getBorderColor = () => {
      if (error) {
        return isDark ? 'border-red-400' : 'border-red-500';
      }
      if (success) {
        return isDark ? 'border-green-400' : 'border-green-500';
      }
      if (isFocused) {
        return isDark ? 'border-blue-400' : 'border-blue-600';
      }
      return isDark ? 'border-gray-700' : 'border-gray-300';
    };

    const getFocusRingColor = () => {
      if (error) {
        return isDark ? 'focus-visible:ring-red-400/30' : 'focus-visible:ring-red-500/30';
      }
      if (success) {
        return isDark ? 'focus-visible:ring-green-400/30' : 'focus-visible:ring-green-500/30';
      }
      return isDark ? 'focus-visible:ring-blue-400/30' : 'focus-visible:ring-blue-600/30';
    };

    return (
      <div className="relative">
        <input
          className={cn(
            "flex min-h-[56px] sm:min-h-[48px] w-full rounded-md border bg-background px-3 pt-7 sm:pt-6 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 leading-6",
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
            "absolute left-3 transition-all duration-200 pointer-events-none leading-6",
            isFocused || hasValue
              ? "top-1.5 sm:top-1 text-xs text-muted-foreground"
              : "top-3 sm:top-4 text-sm text-muted-foreground"
          )}
        >
          {label}
        </label>
      </div>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";
