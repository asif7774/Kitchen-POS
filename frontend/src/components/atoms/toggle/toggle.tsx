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
      <label className={`relative inline-flex ${description ? "items-start" : "items-center"} gap-3 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${containerClassName}`}>
        <div className={`relative block h-8 w-14 shrink-0 rounded-full bg-gray-300 transition-colors [-webkit-tap-highlight-color:transparent] has-[:checked]:bg-blue-600 ${description ? "mt-1" : ""}`}>
          <input type="checkbox" className="peer sr-only" disabled={disabled} ref={ref} {...rest} />
          <span className="absolute inset-y-0 start-0 m-1 size-6 rounded-full bg-white transition-[inset-inline-start] peer-checked:start-6 shadow-sm"></span>
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
