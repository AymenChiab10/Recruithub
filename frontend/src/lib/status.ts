import type { ApplicationStatus } from "../api/types";

const statusCopy: Record<
  ApplicationStatus,
  { label: string; description: string; tone: string }
> = {
  RECEIVED: {
    label: "Reçue",
    description: "La candidature est enregistrée et va être traitée.",
    tone: "blue",
  },
  DIPLOMA_VERIFIED: {
    label: "Diplôme vérifié",
    description: "Le registre a confirmé les informations du diplôme.",
    tone: "green",
  },
  DIPLOMA_NOT_FOUND: {
    label: "Diplôme non vérifié",
    description: "Le diplôme n’a pas été confirmé; le calcul du score est terminé.",
    tone: "orange",
  },
  DIPLOMA_PENDING_VERIFICATION: {
    label: "Diplôme en attente",
    description: "En attente du registre; une nouvelle vérification sera tentée.",
    tone: "orange",
  },
  SCORING_PENDING: {
    label: "Score en attente",
    description: "En attente du calcul; une nouvelle tentative sera effectuée.",
    tone: "green",
  },
  SCORED: {
    label: "Scorée",
    description: "Le diplôme est vérifié et le score est confirmé.",
    tone: "green",
  },
  ACCEPTED: {
    label: "Acceptée",
    description: "La candidature a été acceptée.",
    tone: "neutral",
  },
  REJECTED: {
    label: "Refusée",
    description: "La candidature a été refusée.",
    tone: "neutral",
  },
  PENDING: {
    label: "En attente",
    description: "Statut en attente non traité par le scheduler actuel.",
    tone: "neutral",
  },
};

export function getStatusCopy(status: string) {
  return statusCopy[status as ApplicationStatus] ?? {
    label: status.replaceAll("_", " "),
    description: "Statut transmis par l’API.",
    tone: "neutral",
  };
}

export function isRetryableStatus(status: string) {
  return (
    status === "DIPLOMA_PENDING_VERIFICATION" || status === "SCORING_PENDING"
  );
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
