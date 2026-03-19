import React from "react";
import { Modal } from "./index";
import Button from "../button/Button";
import { AlertIcon, TrashBinIcon } from "../../../icons";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  const variantIcons = {
    danger: <TrashBinIcon className="w-6 h-6 text-error-500" />,
    warning: <AlertIcon className="w-6 h-6 text-warning-500" />,
    info: <AlertIcon className="w-6 h-6 text-blue-500" />,
  };

  const variantBgs = {
    danger: "bg-error-50 dark:bg-error-500/10",
    warning: "bg-warning-50 dark:bg-warning-500/10",
    info: "bg-blue-50 dark:bg-blue-500/10",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-xl">
        <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${variantBgs[variant]}`}>
          {variantIcons[variant]}
        </div>

        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h3>
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>

        <div className="flex w-full items-center gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            className={`w-full ${variant === 'danger' ? 'bg-error-600 hover:bg-error-700' : ''}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
