import type { ApplicationStatus } from "../api/types";
import { getStatusCopy } from "../lib/status";

export function StatusBadge({ status }: { status: ApplicationStatus | string }) {
  const copy = getStatusCopy(status);
  return (
    <span
      aria-label={`Statut ${copy.label}. ${copy.description}`}
      className={`status-badge tone-${copy.tone}`}
      title={copy.description}
    >
      <span aria-hidden="true" className="status-dot" />
      {copy.label}
    </span>
  );
}
