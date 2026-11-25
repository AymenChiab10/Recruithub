const API_PREFIX = "/api/v1";

export const routes = {
  health: "/actuator/health",
  candidates: `${API_PREFIX}/candidates`,
  candidate: (id: number) => `${API_PREFIX}/candidates/${id}`,
  offers: `${API_PREFIX}/offers`,
  offer: (id: number) => `${API_PREFIX}/offers/${id}`,
  ranking: (offerId: number) => `${API_PREFIX}/offers/${offerId}/ranking`,
  applications: `${API_PREFIX}/candidatures`,
  application: (id: number) => `${API_PREFIX}/candidatures/${id}`,
} as const;
