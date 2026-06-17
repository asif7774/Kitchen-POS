import { useContext } from "react";
import { ModalContext } from "../contexts/ModalContext";

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
