import React, { forwardRef } from 'react';

export interface ToggleProps extends Omit<React.ComponentProps<"input">, "type" | "className"> {
  label?: string;
  description?: string;
  containerClassName?: string;
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      label,
      description,
      containerClassName = "",
      disabled,
      ...rest
    },
    ref
  ) => {
    return (
      <label
        className={`relative inline-flex ${
          description ? "items-start" : "items-center"
        } gap-3 ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${containerClassName}`}
      >
        <div className={`relative shrink-0 flex items-center justify-center ${description ? "mt-0.5" : ""}`}>
          <input
            type="checkbox"
            className="peer sr-only"
            disabled={disabled}
            ref={ref}
            {...rest}
          />
          {/* Track */}
          <div className="h-6 w-11 rounded-full bg-gray-200 shadow-inner transition-colors duration-200 ease-in-out peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2" />
          
          {/* Thumb */}
          <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow border border-gray-100 transition-transform duration-200 ease-in-out peer-checked:translate-x-5 peer-checked:border-blue-100" />
        </div>

        {(label ?? description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-gray-900 select-none">
                {label}
              </span>
            )}
            {description && (
              <span className="text-sm text-gray-500 select-none mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';
export default Toggle;
