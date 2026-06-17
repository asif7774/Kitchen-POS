import React, { useState, useRef, useEffect, ReactElement } from "react";
import { createPortal } from "react-dom";

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (value: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref !== null && ref !== undefined) {
        (ref as unknown as { current: T | null }).current = value;
      }
    });
  };
}

export interface DropdownItem {
  id: string;
  label: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

export interface DropdownProps {
  items: DropdownItem[];
  children: ReactElement<React.HTMLProps<HTMLElement>>;
  className?: string;
  align?: "left" | "right";
}

export const Dropdown: React.FC<DropdownProps> = ({
  items,
  children,
  className = "",
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };
  const closeMenu = () => {
    setIsOpen(false);
  };

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !dropdownRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();

    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Default open downwards
    let top = triggerRect.bottom + scrollY + 4;
    let left = triggerRect.left + scrollX;
    let isUpwards = false;

    if (align === "right") {
      left = triggerRect.right + scrollX - dropdownRect.width;
    }

    // Edge detection: If opening downwards bleeds off the bottom of the screen
    if (triggerRect.bottom + dropdownRect.height + 12 > window.innerHeight) {
      // Flip upwards
      top = triggerRect.top + scrollY - dropdownRect.height - 4;
      isUpwards = true;
    }

    setCoords({ top, left });
    setOpenUpwards(isUpwards);
  }, [align]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(updatePosition);
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
    }
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, align, items.length, updatePosition]);

  // Click outside to dismiss
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Merge refs for the trigger element
  const childRef = (children as unknown as { ref?: React.Ref<HTMLElement> })
    .ref;
  const assignNode = React.useCallback(
    (node: HTMLElement | null) => {
      mergeRefs(triggerRef, childRef)(node);
    },
    [childRef],
  );

  const triggerProps: Record<string, unknown> = {
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      toggleOpen();
      if (children.props.onClick) {
        children.props.onClick(e);
      }
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => itemRefs.current[0]?.focus(), 10);
      }
      if (children.props.onKeyDown) {
        children.props.onKeyDown(e);
      }
    },
    "aria-haspopup": "menu" as const,
    "aria-expanded": isOpen,
  };
  triggerProps.ref = assignNode;
  const Component = children.type as React.ElementType;
  const triggerElement = (
    <Component {...children.props} {...triggerProps} ref={assignNode} />
  );

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      itemRefs.current[(index + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      itemRefs.current[(index - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
    }
  };

  return (
    <>
      {triggerElement}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            role="menu"
            className={`absolute z-[9999] bg-white rounded-lg shadow-xl border border-gray-100 min-w-[200px] flex flex-col overflow-hidden transition-opacity duration-150 ${className}`}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              opacity: coords.top === 0 && coords.left === 0 ? 0 : 1, // Hide until positioned
              transformOrigin: openUpwards ? "bottom" : "top",
            }}
          >
            {items.map((item, index) => (
              <button
                key={item.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                role="menuitem"
                tabIndex={0}
                className={`
                w-full text-left px-4 py-3 text-sm font-medium transition-colors outline-none focus:bg-blue-50 focus:text-blue-700
                ${
                  item.danger
                    ? "text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
                    : "text-gray-700 hover:bg-gray-50"
                }
                ${index !== items.length - 1 ? "border-b border-gray-100" : ""}
              `}
                onClick={() => {
                  item.onClick();
                  closeMenu();
                  triggerRef.current?.focus();
                }}
                onKeyDown={(e) => {
                  handleKeyDown(e, index);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};
