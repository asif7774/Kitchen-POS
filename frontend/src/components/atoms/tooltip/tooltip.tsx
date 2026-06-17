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

export interface TooltipProps {
  content: React.ReactNode;
  children: ReactElement<React.HTMLProps<HTMLElement>>;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  className = "",
  delay = 200,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    // Add scroll offset for absolute portal rendering
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = rect.top + scrollY - tooltipRect.height - 8;
        left = rect.left + scrollX + rect.width / 2 - tooltipRect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + scrollY + 8;
        left = rect.left + scrollX + rect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top = rect.top + scrollY + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left + scrollX - tooltipRect.width - 8;
        break;
      case "right":
        top = rect.top + scrollY + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + scrollX + 8;
        break;
    }

    setCoords({ top, left });
  }, [position]);

  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure tooltip is fully rendered before calculating height
      requestAnimationFrame(updatePosition);
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
    }
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isVisible, position, updatePosition]);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const childRef = (children as unknown as { ref?: React.Ref<HTMLElement> })
    .ref;
  const handleRefMerge = React.useCallback(
    (node: HTMLElement | null) => {
      mergeRefs(triggerRef, childRef)(node);
    },
    [childRef],
  );

  const triggerProps: Record<string, unknown> = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      handleMouseEnter();
      if (children.props.onMouseEnter) {
        children.props.onMouseEnter(e);
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      handleMouseLeave();
      if (children.props.onMouseLeave) {
        children.props.onMouseLeave(e);
      }
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      handleMouseEnter();
      if (children.props.onFocus) {
        children.props.onFocus(e);
      }
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      handleMouseLeave();
      if (children.props.onBlur) {
        children.props.onBlur(e);
      }
    },
    "aria-describedby": isVisible ? "tooltip-content" : undefined,
  };

  const Component = children.type as React.ElementType;
  const triggerElement = (
    <Component {...children.props} {...triggerProps} ref={handleRefMerge} />
  );

  return (
    <>
      {triggerElement}
      {isVisible &&
        createPortal(
          <div
            id="tooltip-content"
            ref={tooltipRef}
            role="tooltip"
            className={`absolute z-[9999] bg-gray-900 text-white text-sm px-3 py-1.5 rounded shadow-lg animate-fade-in pointer-events-none transition-opacity duration-200 ${className}`}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              opacity: coords.top === 0 && coords.left === 0 ? 0 : 1, // Hide until first calculation is done
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
};
