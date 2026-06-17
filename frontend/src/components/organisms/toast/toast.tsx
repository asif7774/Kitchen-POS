import React, { useEffect, useState } from "react";
import { SvgIcon } from "components/atoms/svg-sprite-loader";
import { useToast } from "hooks/useToast";
import { ToastMessage } from "contexts/ToastContext";

interface ToastProps {
  toast: ToastMessage;
}

const variantStyles = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconNames = {
  success: "check-circle",
  error: "warning",
  warning: "warning",
  info: "info",
};

const iconColors = {
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
};

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  const { hideToast } = useToast();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      hideToast(toast.id);
    }, 300); // Wait for transition
  }, [hideToast, toast.id]);

  useEffect(() => {
    const duration = toast.duration ?? 3000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [toast.duration, toast.id, handleClose]);

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm rounded-lg shadow-lg border p-4 transition-all duration-300 transform ${
        isClosing
          ? "opacity-0 translate-x-full scale-95"
          : "opacity-100 translate-x-0 scale-100"
      } ${variantStyles[toast.variant]}`}
      role={
        toast.variant === "error" || toast.variant === "warning"
          ? "alert"
          : "status"
      }
    >
      <div className="flex-shrink-0 mr-3">
        <SvgIcon
          name={iconNames[toast.variant]}
          width="24"
          height="24"
          className={iconColors[toast.variant]}
          aria-hidden={true}
        />
      </div>
      <div className="flex-1 w-0">
        {toast.title && (
          <p className="text-sm font-semibold mb-1">{toast.title}</p>
        )}
        <p className="text-sm">{toast.message}</p>
      </div>
      <div className="ml-4 flex-shrink-0 flex items-start">
        <button
          className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md p-1 transition-colors"
          onClick={handleClose}
        >
          <span className="sr-only">Close</span>
          <SvgIcon name="close" width="16" height="16" aria-hidden={true} />
        </button>
      </div>
    </div>
  );
};
