import React, { useEffect, useRef } from "react";
import { SvgIcon } from "components/atoms/svg-sprite-loader";
import { useModal } from "hooks/useModal";
import { ModalConfig } from "contexts/ModalContext";

interface ModalProps {
  modal: ModalConfig;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-full m-4",
};

export const Modal: React.FC<ModalProps> = ({ modal }) => {
  const { hideModal } = useModal();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hideModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hideModal]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !modal.hideCloseButton) {
      hideModal();
    }
  };

  const handleManualClose = () => {
    hideModal();
  };

  return (
    <div
      aria-labelledby={modal.title ? "modal-title" : undefined}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      
      {/* Modal Dialog */}
      <div
        ref={contentRef}
        className={`relative flex flex-col bg-white rounded-xl shadow-2xl w-full ${sizeClasses[modal.size ?? "md"]} max-h-[90vh] outline-none`}
      >
        {/* Header */}
        {(Boolean(modal.title) || !modal.hideCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            {modal.title ? (
              <h2
                id="modal-title"
                className="text-xl font-semibold text-gray-900"
              >
                {modal.title}
              </h2>
            ) : (
              <div></div>
            )}
            {!modal.hideCloseButton && (
              <button
                type="button"
                onClick={handleManualClose}
                className="ml-auto text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md p-1"
                aria-label="Close dialog"
              >
                <SvgIcon
                  name="close"
                  width="20"
                  height="20"
                  aria-hidden={true}
                />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto">{modal.content}</div>

        {/* Actions/Footer */}
        {modal.actions && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end space-x-3 rounded-b-xl shrink-0">
            {modal.actions}
          </div>
        )}
      </div>
    </div>
  );
};
