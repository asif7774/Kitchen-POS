import React, { forwardRef, ComponentProps, useState, useRef, useEffect, Children, isValidElement } from "react";

export interface SelectProps extends ComponentProps<"select"> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      fullWidth = true,
      className = "",
      id,
      children,
      value,
      onChange,
      disabled,
      ...rest
    },
    ref,
  ) => {
    // Extract options from <option> children
    const options = Children.toArray(children)
      .map((child) => {
        if (isValidElement(child) && child.type === "option") {
          const props = child.props as React.ComponentProps<"option">;
          return {
            value: props.value as string,
            label: props.children,
          };
        }
        return null;
      })
      .filter(Boolean) as { value: string; label: React.ReactNode }[];

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [openUpward, setOpenUpward] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const filteredOptions = options.filter((opt) => {
      if (!searchQuery) { return true; }
      let textLabel = "";
      if (typeof opt.label === "string") {
        textLabel = opt.label;
      } else if (typeof opt.label === "number") {
        textLabel = String(opt.label);
      }
      return textLabel.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleOpen = () => {
      if (disabled) { return; }
      setIsOpen(true);
      setSearchQuery("");
      setHighlightedIndex(0);

      // Viewport boundary check
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
      return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, []);

    // Focus search input when opened
    useEffect(() => {
      if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen]);

    const handleSelect = (val: string) => {
      if (onChange) {
        // Create synthetic event
        const event = {
          target: { value: val },
          currentTarget: { value: val },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(event);
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          handleOpen();
        }
        return;
      }

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
            handleSelect(filteredOptions[highlightedIndex].value);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };

    const selectId =
      id ??
      (label ? `select-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

    // Determine current selected value (controlled or uncontrolled)
    const currentValue = value ?? rest.defaultValue;
    const selectedOption = options.find(
      (opt) => opt.value === String(currentValue)
    );

    return (
      <div className={fullWidth ? "w-full" : "inline-block"}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <div
          ref={containerRef}
          className={`relative ${fullWidth ? "w-full" : ""}`}
          onKeyDown={handleKeyDown}
        >
          {/* Hidden native select for form submission / ref forwarding */}
          <select
            id={selectId}
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="hidden"
            {...rest}
          >
            {children}
          </select>

          {/* Custom Dropdown Trigger */}
          <button
            type="button"
            className={`flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? "border-red-300 ring-red-500" : "border-gray-300"
            } ${
              disabled
                ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                : "cursor-default text-gray-900"
            } ${className}`}
            onClick={() => {
              if (isOpen) {
                setIsOpen(false);
              } else {
                handleOpen();
              }
            }}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${selectId}-error` : undefined}
            disabled={disabled}
          >
            <span className="block truncate">
              {selectedOption ? selectedOption.label : "Select..."}
            </span>
            <span className="pointer-events-none ml-2 flex items-center">
              <svg
                className="h-4 w-4 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </button>

          {/* Dropdown Menu Listbox */}
          {isOpen && (
            <div
              ref={dropdownRef}
              className={`absolute z-50 w-full overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 ${
                openUpward ? "bottom-full mb-1" : "top-full mt-1"
              }`}
            >
              <div className="p-2 border-b border-gray-100">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault();
                      handleKeyDown(e);
                    }
                  }}
                  aria-label="Search options"
                />
              </div>
              <ul
                className="max-h-60 overflow-auto py-1 text-sm focus:outline-none"
                role="listbox"
              >
                {filteredOptions.length === 0 ? (
                  <li className="relative cursor-default select-none px-3 py-2 text-gray-500 text-center">
                    No results found
                  </li>
                ) : (
                  filteredOptions.map((opt, idx) => {
                    const isSelected = opt.value === String(currentValue);
                    const isHighlighted = idx === highlightedIndex;
                    return (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        className={`relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                          isHighlighted
                            ? "bg-blue-600 text-white"
                            : "text-gray-900 hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          handleSelect(opt.value);
                        }}
                        onMouseEnter={() => {
                          setHighlightedIndex(idx);
                        }}
                      >
                        <span
                          className={`block truncate ${
                            isSelected ? "font-semibold" : "font-normal"
                          }`}
                        >
                          {opt.label}
                        </span>
                        {isSelected && (
                          <span
                            className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                              isHighlighted ? "text-white" : "text-blue-600"
                            }`}
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600" id={`${selectId}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
