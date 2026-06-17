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
        <input type="checkbox" className="sr-only peer" disabled={disabled} ref={ref} {...rest} />
        <div className={`relative w-11 h-6 bg-gray-200 peer-focus-visible:outline-none rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner shrink-0 ${description ? "mt-1" : ""}`}></div>

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
