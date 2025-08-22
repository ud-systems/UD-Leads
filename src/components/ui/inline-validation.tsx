import { ReactNode } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineValidationProps {
  error?: string;
  success?: string;
  children: ReactNode;
  className?: string;
}

export function InlineValidation({ error, success, children, className }: InlineValidationProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
      {(error || success) && (
        <div className={cn(
          "flex items-center gap-2 text-sm",
          error ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
        )}>
          {error ? (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span>{error || success}</span>
        </div>
      )}
    </div>
  );
}

interface ValidationFieldProps {
  error?: string;
  success?: string;
  children: ReactNode;
  className?: string;
}

export function ValidationField({ error, success, children, className }: ValidationFieldProps) {
  return (
    <InlineValidation error={error} success={success} className={className}>
      {children}
    </InlineValidation>
  );
}
