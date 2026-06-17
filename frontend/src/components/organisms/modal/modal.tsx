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
  full: "max-w-full m-4",
};

export const Modal: React.FC<ModalProps> = ({ modal }) => {
  const { hideModal } = useModal();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    // Add event listener for close event (when user hits Esc or custom logic triggers close)
    const handleClose = () => {
      hideModal();
    };

    if (dialog) {
      dialog.addEventListener("close", handleClose);
      if (
        !(
          "closedBy" in
          (HTMLDialogElement.prototype as unknown as Record<string, unknown>)
        )
      ) {
        dialog.addEventListener("click", (event) => {
          if (event.target !== dialog) {
            return;
          }
          const rect = dialog.getBoundingClientRect();
          const isDialogContent =
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width;
          if (isDialogContent) {
            return;
          }
          dialog.close();
        });
      }
    }

    return () => {
      if (dialog) {
        dialog.removeEventListener("close", handleClose);
      }
    };
  }, [hideModal]);

  const handleManualClose = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...{ closedby: "any" }}
      aria-labelledby={modal.title ? "modal-title" : undefined}
      className={`m-auto fixed inset-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm p-0 rounded-xl shadow-2xl bg-white w-full ${sizeClasses[modal.size ?? "md"]} outline-none transition-all`}
    >
      <div className="flex flex-col max-h-[90vh]">
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
                className="ml-auto text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
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
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end space-x-3 rounded-b-xl">
            {modal.actions}
          </div>
        )}
      </div>
    </dialog>
  );
};
