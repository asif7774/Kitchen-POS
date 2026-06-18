import { forwardRef, ComponentProps } from "react";

export interface InputProps extends ComponentProps<"input"> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      fullWidth = true,
      className = "",
      id,
      ...rest
    },
    ref,
  ) => {
    const inputId = id ?? (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    
    const baseStyles = "block rounded-md border shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none sm:text-sm";
    const normalStyles = "border-gray-300 focus-visible:border-blue-500 focus-visible:ring-blue-500";
    const errorStyles = "border-red-300 text-red-900 focus-visible:border-red-500 focus-visible:ring-red-500";
    const disabledStyles = "disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none";

    const widthClass = fullWidth ? "w-full" : "";
    const paddingClass = "px-3 py-2";

    const combinedClassName = `${baseStyles} ${error ? errorStyles : normalStyles} ${disabledStyles} ${widthClass} ${paddingClass} ${className}`.trim();

    return (
      <div className={fullWidth ? "w-full" : "inline-block"}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-sm">
          <input
            id={inputId}
            ref={ref}
            className={combinedClassName}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...rest}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600" id={`${inputId}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
