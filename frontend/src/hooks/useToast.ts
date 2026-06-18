import { useContext } from "react";
import { ToastContext, ToastMessage } from "../contexts/ToastContext";

interface UseToastReturn {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  hideToast: (id: string) => void;
}

export const useToast = (): UseToastReturn => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
