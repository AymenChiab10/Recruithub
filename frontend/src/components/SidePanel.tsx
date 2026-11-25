import { useEffect, useRef, type ReactNode, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface SidePanelProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export function SidePanel({
  open,
  title,
  description,
  onClose,
  children,
}: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    panelRef.current?.querySelector<HTMLElement>("input, button, select")?.focus();
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  function keepTabInside(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="panel-backdrop"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            animate={{ x: 0 }}
            aria-describedby={description ? "panel-description" : undefined}
            aria-labelledby="panel-title"
            aria-modal="true"
            className="side-panel"
            initial={{ x: 48 }}
            onKeyDown={keepTabInside}
            ref={panelRef}
            role="dialog"
          >
            <header className="panel-header">
              <div>
                <p className="eyebrow">ESPACE DE GESTION</p>
                <h2 id="panel-title">{title}</h2>
                {description && <p id="panel-description">{description}</p>}
              </div>
              <button
                aria-label="Fermer le panneau"
                className="icon-button"
                onClick={onClose}
                type="button"
              >
                <X size={18} />
              </button>
            </header>
            <div className="panel-content">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
