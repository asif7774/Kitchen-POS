import React from "react";
import { useModal } from "hooks/useModal";

import { Modal } from "./modal";

export const ModalContainer: React.FC = () => {
  const { activeModal } = useModal();

  if (!activeModal) {
    return null;
  }

  return <Modal key={activeModal.id} modal={activeModal} />;
};
