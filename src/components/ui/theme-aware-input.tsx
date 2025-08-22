import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

interface ThemeAwareInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
}

export const ThemeAwareInput = forwardRef<HTMLInputElement, ThemeAwareInputProps>(
  ({ className, error, success, ...props }, ref) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const getBorderColor = () => {
      if (error) {
        return theme === 'dark' ? 'border-red-500' : 'border-red-600';
      }
      if (success) {
        return theme === 'dark' ? 'border-green-500' : 'border-green-600';
      }
      if (isFocused) {
        return theme === 'dark' ? 'border-blue-400' : 'border-blue-500';
      }
      return theme === 'dark' ? 'border-gray-600' : 'border-gray-300';
    };

    const getFocusRingColor = () => {
      if (error) {
        return theme === 'dark' ? 'focus:ring-red-500/20' : 'focus:ring-red-500/20';
      }
      if (success) {
        return theme === 'dark' ? 'focus:ring-green-500/20' : 'focus:ring-green-500/20';
      }
      return theme === 'dark' ? 'focus:ring-blue-500/20' : 'focus:ring-blue-500/20';
    };

    return (
      <input
        className={cn(
          "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
          getBorderColor(),
          getFocusRingColor(),
          className
        )}
        ref={ref}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
    );
  }
);

ThemeAwareInput.displayName = "ThemeAwareInput";
