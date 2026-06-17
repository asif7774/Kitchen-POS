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
        className={`relative inline-flex items-center ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${containerClassName}`}
      >
        <div className="relative flex items-center">
          <input
            type="checkbox"
            className="sr-only peer focus:outline-none"
            disabled={disabled}
            ref={ref}
            {...rest}
          />
          {/* 
            Using a permanent transparent outline to guarantee absolutely zero width shifting on focus.
            The outline will simply change color when focused, preventing any browser layout recalculation.
          */}
          <div className="w-11 h-6 shrink-0 bg-gray-200 rounded-full outline outline-2 outline-offset-2 outline-transparent peer-focus-visible:outline-blue-500 peer-checked:bg-blue-600 transition-all"></div>
          
          <div className="absolute left-[2px] top-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform peer-checked:translate-x-[20px] peer-checked:border-white shadow-sm"></div>
        </div>

        {(label ?? description) !== undefined && (label !== '' || description !== '') && (
          <div className="ml-3 flex flex-col">
            {label && (
              <span className="text-sm font-medium text-gray-900">
                {label}
              </span>
            )}
            {description && (
              <span className="text-sm text-gray-500">{description}</span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';
export default Toggle;
