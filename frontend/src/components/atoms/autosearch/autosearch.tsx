import React, { forwardRef, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { SvgIcon } from "../svg-sprite-loader";

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
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(rest.defaultValue ? String(rest.defaultValue) : "");
    const currentValue = isControlled ? value : internalValue;

    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);
    const fallbackId = React.useId();
    const inputId = id ?? (label ? `autosearch-${label.replace(/\\s+/g, "-").toLowerCase()}` : fallbackId);

    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
      if (containerRef.current) {
        setPortalTarget(containerRef.current.closest("dialog") ?? document.body);
      }
    }, []);

    const filteredOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(currentValue.toLowerCase())
    );

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dropdownHeight = dropdownRef.current?.offsetHeight ?? 250;
        const spaceBelow = window.innerHeight - rect.bottom;

        let upward = false;
        if (spaceBelow < dropdownHeight && rect.top > spaceBelow) {
          upward = true;
        }

        setDropdownStyle({
          position: "fixed",
          top: upward ? "auto" : rect.bottom + 4,
          bottom: upward ? window.innerHeight - rect.top + 4 : "auto",
          left: rect.left,
          width: rect.width,
          zIndex: 999999,
        });
      }
    };

    const handleOpen = () => {
      if (disabled) { return; }
      setIsOpen(true);
      setTimeout(updatePosition, 0);
    };

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          containerRef.current && !containerRef.current.contains(target) &&
          (!dropdownRef.current?.contains(target))
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // Update position on scroll/resize
    useEffect(() => {
      if (!isOpen) {
        return;
      }
      const handleScrollOrResize = () => {
        updatePosition();
      };
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }, [isOpen]);

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

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!isControlled) {
        setInternalValue("");
      }
      if (onChange) {
        onChange("");
      }
      if (onSelectOption) {
        // Option to reset externally if they rely on onSelectOption
        onSelectOption({ label: "", value: "" });
      }
      setIsOpen(false);
      
      // Focus back on the input
      const inputEl = document.getElementById(inputId);
      if (inputEl) {
        inputEl.focus();
      }
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
      "block rounded-md border shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none sm:text-sm bg-white text-gray-900";
    const normalStyles = "border-gray-300 focus-visible:border-blue-500 focus-visible:ring-emerald-500";
    const errorStyles = "border-red-300 text-red-900 focus-visible:border-red-500 focus-visible:ring-red-500";
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
          
          {/* Magnifying Glass / Clear Icon inside Input */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {currentValue ? (
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
                onClick={handleClear}
                aria-label="Clear search"
              >
                <SvgIcon name="close" className="h-4 w-4" />
              </button>
            ) : (
              <span className="pointer-events-none text-gray-400">
                <SvgIcon name="search" className="h-4 w-4" />
              </span>
            )}
          </div>

          {isOpen && filteredOptions.length > 0 && portalTarget && createPortal(
            <div
              ref={dropdownRef}
              style={dropdownStyle}
              className={`z-[999999] overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5`}
            >
              <ul ref={listboxRef} className="max-h-60 overflow-auto py-1 text-sm focus-visible:outline-none" role="listbox">
                {filteredOptions.map((opt, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isHighlighted}
                      className={`relative cursor-pointer select-none py-2 px-3 transition-colors ${
                        isHighlighted ? "bg-emerald-500 text-white" : "text-gray-900 hover:bg-gray-100"
                      }`}
                      onClick={() => { handleSelect(opt); }}
                      onMouseEnter={() => { setHighlightedIndex(idx); }}
                    >
                      <span className="block truncate">{opt.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>,
            portalTarget
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
