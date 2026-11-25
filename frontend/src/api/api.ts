import { jsonBody, request } from "./client";
import { routes } from "./routes";
import type {
  Application,
  ApplicationRequest,
  Candidate,
  CandidateRequest,
  HealthResponse,
  Offer,
  OfferRequest,
  RankedApplication,
} from "./types";

export const api = {
  health: () => request<HealthResponse>(routes.health),
  candidates: () => request<Candidate[]>(routes.candidates),
  candidate: (id: number) => request<Candidate>(routes.candidate(id)),
  createCandidate: (data: CandidateRequest) =>
    request<Candidate>(routes.candidates, {
      method: "POST",
      body: jsonBody(data),
    }),
  updateCandidate: (id: number, data: CandidateRequest) =>
    request<Candidate>(routes.candidate(id), {
      method: "PUT",
      body: jsonBody(data),
    }),
  deleteCandidate: (id: number) =>
    request<void>(routes.candidate(id), { method: "DELETE" }),
  offers: () => request<Offer[]>(routes.offers),
  offer: (id: number) => request<Offer>(routes.offer(id)),
  createOffer: (data: OfferRequest) =>
    request<Offer>(routes.offers, {
      method: "POST",
      body: jsonBody(data),
    }),
  updateOffer: (id: number, data: OfferRequest) =>
    request<Offer>(routes.offer(id), {
      method: "PUT",
      body: jsonBody(data),
    }),
  deleteOffer: (id: number) =>
    request<void>(routes.offer(id), { method: "DELETE" }),
  applications: () => request<Application[]>(routes.applications),
  application: (id: number) => request<Application>(routes.application(id)),
  createApplication: (data: ApplicationRequest) =>
    request<Application>(routes.applications, {
      method: "POST",
      body: jsonBody(data),
    }),
  deleteApplication: (id: number) =>
    request<void>(routes.application(id), { method: "DELETE" }),
  ranking: (offerId: number) =>
    request<RankedApplication[]>(routes.ranking(offerId)),
};
