import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CircleAlert, X } from "lucide-react";
import { ToastContext, type ToastTone } from "../lib/toastContext";

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

function ToastItem({
  toast,
  dismiss,
}: {
  toast: Toast;
  dismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), 5_000);
    return () => window.clearTimeout(timer);
  }, [dismiss, toast.id]);

  const Icon = toast.tone === "success" ? Check : CircleAlert;
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className={`toast toast-${toast.tone}`}
      exit={{ opacity: 0, x: 24 }}
      initial={{ opacity: 0, x: 24 }}
      role={toast.tone === "error" ? "alert" : "status"}
    >
      <span className="toast-icon"><Icon size={17} /></span>
      <div>
        <strong>{toast.title}</strong>
        {toast.description && <p>{toast.description}</p>}
      </div>
      <button
        aria-label="Fermer la notification"
        className="toast-close"
        onClick={() => dismiss(toast.id)}
        type="button"
      >
        <X size={15} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback(
    (tone: ToastTone, title: string, description?: string) => {
      setToasts((current) => [
        ...current,
        { id: Date.now() + Math.random(), tone, title, description },
      ]);
    },
    [],
  );
  const dismiss = useCallback(
    (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)),
    [],
  );
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="toast-stack">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem dismiss={dismiss} key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
