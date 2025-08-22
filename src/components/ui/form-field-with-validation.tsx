import { ReactNode } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingLabelInput } from "./floating-label-input";

interface FormFieldWithValidationProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  error?: string;
  success?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function FormFieldWithValidation({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  error,
  success,
  className,
  placeholder,
  disabled,
  ...props
}: FormFieldWithValidationProps) {
  // Only show validation errors when explicitly provided (not auto-validating)
  const finalError = error;

  return (
    <div className={cn("space-y-1", className)}>
      <FloatingLabelInput
        label={label}
        type={type}
        value={value}
        onChange={onChange}
        error={!!finalError}
        success={!!success}
        disabled={disabled}
        {...props}
      />
      
      {(finalError || success) && (
        <div className={cn(
          "flex items-center gap-1.5 text-xs px-1",
          finalError ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
        )}>
          {finalError ? (
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
          ) : (
            <CheckCircle className="h-3 w-3 flex-shrink-0" />
          )}
          <span className="leading-tight">{finalError || success}</span>
        </div>
      )}
    </div>
  );
}

interface SelectFieldWithValidationProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
  error?: string;
  success?: string;
  className?: string;
  placeholder?: string;
  children: ReactNode;
}

export function SelectFieldWithValidation({
  label,
  value,
  onValueChange,
  required = false,
  error,
  success,
  className,
  placeholder,
  children,
}: SelectFieldWithValidationProps) {
  // Only show validation errors when explicitly provided (not auto-validating)
  const finalError = error;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="relative">
        {children}
      </div>
      
      {(finalError || success) && (
        <div className={cn(
          "flex items-center gap-1.5 text-xs px-1",
          finalError ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
        )}>
          {finalError ? (
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
          ) : (
            <CheckCircle className="h-3 w-3 flex-shrink-0" />
          )}
          <span className="leading-tight">{finalError || success}</span>
        </div>
      )}
    </div>
  );
}
