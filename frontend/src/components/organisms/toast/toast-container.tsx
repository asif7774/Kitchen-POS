import React from "react";
import { useToast } from "hooks/useToast";

import { Toast } from "./toast";

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div
      aria-live="polite"
      className="fixed inset-0 flex px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50 justify-end"
    >
      <div className="w-full flex flex-col items-end space-y-4">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
};
