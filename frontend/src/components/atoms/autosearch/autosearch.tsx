import React, { forwardRef, useState, useRef, useEffect } from "react";

export interface AutosearchOption {
  value: string;
  label: string;
}

export interface AutosearchProps extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "onSelect"> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  options: AutosearchOption[];
  value?: string;
  onChange?: (value: string) => void;
  onSelectOption?: (option: AutosearchOption) => void;
}

const Autosearch = forwardRef<HTMLInputElement, AutosearchProps>(
  (
    {
      label,
      error,
      fullWidth = true,
      className = "",
      id,
      options,
      value,
      onChange,
      onSelectOption,
      disabled,
      placeholder = "Search...",
      ...rest
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [openUpward, setOpenUpward] = useState(false);

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(rest.defaultValue ? String(rest.defaultValue) : "");
    const currentValue = isControlled ? value : internalValue;

    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);
    const fallbackId = React.useId();
    const inputId = id ?? (label ? `autosearch-${label.replace(/\\s+/g, "-").toLowerCase()}` : fallbackId);

    const filteredOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(currentValue.toLowerCase())
    );

    const handleOpen = () => {
      if (disabled) { return; }
      setIsOpen(true);

      setTimeout(() => {
        if (containerRef.current && dropdownRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const dropdownHeight = dropdownRef.current.offsetHeight || 250;
          const spaceBelow = window.innerHeight - rect.bottom;

          if (spaceBelow < dropdownHeight && rect.top > spaceBelow) {
            setOpenUpward(true);
          } else {
            setOpenUpward(false);
          }
        }
      }, 0);
    };

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // Scroll active item into view
    useEffect(() => {
      if (isOpen && listboxRef.current) {
        const activeItem = listboxRef.current.children[highlightedIndex] as HTMLElement | undefined;
        if (activeItem) {
          activeItem.scrollIntoView({ block: "nearest" });
        }
      }
    }, [highlightedIndex, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value);
      }
      if (onChange) {
        onChange(e.target.value);
      }
      setHighlightedIndex(-1);
      if (!isOpen) {
        handleOpen();
      }
    };

    const handleSelect = (opt: AutosearchOption) => {
      if (!isControlled) {
        setInternalValue(opt.label);
      }
      if (onChange) {
        onChange(opt.label);
      }
      if (onSelectOption) {
        onSelectOption(opt);
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen && filteredOptions.length > 0) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          handleOpen();
          return;
        }
      }

      if (!isOpen) { return; }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            Math.min(prev + 1, filteredOptions.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex]);
          } else if (filteredOptions.length === 1) {
            // Auto-select if only one option
            handleSelect(filteredOptions[0]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };

    const baseStyles =
      "block rounded-md border shadow-sm transition-colors focus:ring-2 focus:outline-none sm:text-sm bg-white text-gray-900";
    const normalStyles = "border-gray-300 focus:border-blue-500 focus:ring-blue-500";
    const errorStyles = "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500";
    const disabledStyles =
      "disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none cursor-not-allowed";

    const widthClass = fullWidth ? "w-full" : "";
    const paddingClass = "px-3 py-2";

    const combinedClassName = `${baseStyles} ${error ? errorStyles : normalStyles} ${
      disabled ? disabledStyles : ""
    } ${widthClass} ${paddingClass} ${className}`.trim();

    return (
      <div className={fullWidth ? "w-full" : "inline-block"} ref={containerRef}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type="text"
            className={combinedClassName}
            value={currentValue}
            onChange={handleChange}
            onFocus={() => {
              if (filteredOptions.length > 0) {
                handleOpen();
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${inputId}-error` : undefined}
            role="combobox"
            autoComplete="off"
            {...rest}
          />
          
          {/* Magnifying Glass Icon inside Input */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {isOpen && filteredOptions.length > 0 && (
            <div
              ref={dropdownRef}
              className={`absolute z-50 w-full overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 ${
                openUpward ? "bottom-full mb-1" : "top-full mt-1"
              }`}
            >
              <ul ref={listboxRef} className="max-h-60 overflow-auto py-1 text-sm focus:outline-none" role="listbox">
                {filteredOptions.map((opt, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isHighlighted}
                      className={`relative cursor-pointer select-none py-2 px-3 transition-colors ${
                        isHighlighted ? "bg-blue-600 text-white" : "text-gray-900 hover:bg-gray-100"
                      }`}
                      onClick={() => { handleSelect(opt); }}
                      onMouseEnter={() => { setHighlightedIndex(idx); }}
                    >
                      <span className="block truncate">{opt.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600" id={`${inputId}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Autosearch.displayName = "Autosearch";

export default Autosearch;
