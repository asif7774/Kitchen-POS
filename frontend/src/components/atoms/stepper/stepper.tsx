import React, { useState } from 'react';

export interface StepperProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

const Stepper: React.FC<StepperProps> = ({
  value,
  defaultValue = 0,
  onChange,
  min = 0,
  max = 999,
  disabled = false,
  className = '',
}) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = isControlled ? value : internalValue;

  const handleDecrement = () => {
    if (disabled || currentValue <= min) { return; }
    const nextValue = currentValue - 1;
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    if (onChange) {
      onChange(nextValue);
    }
  };

  const handleIncrement = () => {
    if (disabled || currentValue >= max) { return; }
    const nextValue = currentValue + 1;
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    if (onChange) {
      onChange(nextValue);
    }
  };

  return (
    <div
      className={`inline-flex items-center border border-gray-300 rounded-md bg-white overflow-hidden ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || currentValue <= min}
        className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:bg-gray-100 transition-colors flex items-center justify-center"
        aria-label="Decrease quantity"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <div className="border-x border-gray-300 min-w-[3rem] px-2 py-1.5 flex items-center justify-center text-center font-bold text-gray-900 select-none">
        {currentValue}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || currentValue >= max}
        className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:bg-gray-100 transition-colors flex items-center justify-center"
        aria-label="Increase quantity"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
};

export default Stepper;
