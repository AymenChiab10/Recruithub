import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  pending = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    cancelRef.current?.focus();
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="confirm-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        aria-labelledby="confirm-title"
        aria-modal="true"
        className="confirm-dialog"
        initial={{ opacity: 0, scale: 0.96 }}
        role="alertdialog"
      >
        <span className="confirm-mark">!</span>
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>
        <div className="button-row">
          <button className="button button-quiet" onClick={onCancel} ref={cancelRef} type="button">Annuler</button>
          <button className="button button-danger" disabled={pending} onClick={onConfirm} type="button">
            {pending ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
