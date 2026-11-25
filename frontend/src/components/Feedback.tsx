import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ApiError } from "../api/client";
import { getFriendlyError } from "../lib/errors";

export function ErrorBanner({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const unavailable =
    error instanceof ApiError &&
    (error.status === 0 || error.status === 502 || error.status === 503);
  return (
    <div className="error-banner" role="alert">
      <AlertTriangle size={18} />
      <div>
        <strong>{unavailable ? "Service temporairement indisponible" : "Un problème est survenu"}</strong>
        <p>{getFriendlyError(error)}</p>
      </div>
      <button className="button button-quiet" onClick={retry} type="button">
        <RefreshCw size={15} /> Réessayer
      </button>
    </div>
  );
}

export function FormErrorBanner({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div className="form-error-banner" role="alert">
      <div>
        <strong>Service temporairement indisponible</strong>
        <p>{getFriendlyError(error)}</p>
      </div>
      <button className="button button-quiet" onClick={retry} type="button">
        <RefreshCw size={14} /> Réessayer
      </button>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="empty-state"
      initial={{ opacity: 0, y: 8 }}
    >
      <span className="empty-icon"><Inbox size={22} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </motion.div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-label="Chargement en cours" className="skeleton-list" role="status">
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-row" key={index}>
          <span className="skeleton skeleton-avatar" />
          <span className="skeleton skeleton-copy" />
          <span className="skeleton skeleton-pill" />
        </div>
      ))}
    </div>
  );
}

export function FieldError({ children }: { children?: string }) {
  return children ? <span className="field-error" role="alert">{children}</span> : null;
}
