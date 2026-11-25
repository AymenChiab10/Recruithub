import { ApiError } from "../api/client";

export function getFriendlyError(
  error: unknown,
  context: "candidate" | "application" | "generic" = "generic",
) {
  if (!(error instanceof ApiError)) {
    return "Une erreur inattendue s’est produite. Réessayez.";
  }
  if (error.status === 0) return error.message;
  if (error.status === 400) return "Vérifiez les informations saisies.";
  if (error.status === 404) return "Cet élément est introuvable ou a été supprimé.";
  if (error.status === 409) {
    return context === "candidate"
      ? "E-mail déjà utilisé."
      : context === "application"
        ? "Ce candidat a déjà postulé à cette offre."
        : error.message;
  }
  if (error.status === 502 || error.status === 503) {
    return "Service temporairement indisponible. Réessayez dans quelques instants.";
  }
  return error.message;
}

export function getFieldErrors(error: unknown) {
  return error instanceof ApiError ? error.fieldErrors : {};
}
