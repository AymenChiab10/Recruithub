import {
  useQuery,
  type QueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api } from "./api";
import type {
  Application,
  Candidate,
  HealthResponse,
  Offer,
  RankedApplication,
} from "./types";

export const queryKeys = {
  candidates: ["candidates"] as const,
  candidate: (id: number) => ["candidate", id] as const,
  offers: ["offers"] as const,
  offer: (id: number) => ["offer", id] as const,
  applications: ["applications"] as const,
  application: (id: number) => ["application", id] as const,
  ranking: (offerId: number) => ["ranking", offerId] as const,
  health: ["gateway-health"] as const,
};

const isRetryable = (application: Application) =>
  application.status === "DIPLOMA_PENDING_VERIFICATION" ||
  application.status === "SCORING_PENDING";

export function useCandidates(): UseQueryResult<Candidate[], Error> {
  return useQuery({
    queryKey: queryKeys.candidates,
    queryFn: api.candidates,
  });
}

export function useOffers(): UseQueryResult<Offer[], Error> {
  return useQuery({
    queryKey: queryKeys.offers,
    queryFn: api.offers,
  });
}

export function useApplications(): UseQueryResult<Application[], Error> {
  return useQuery({
    queryKey: queryKeys.applications,
    queryFn: api.applications,
    refetchInterval: (query) =>
      query.state.data?.some(isRetryable) ? 5_000 : false,
    refetchIntervalInBackground: true,
  });
}

export function useApplication(
  id: number | undefined,
): UseQueryResult<Application, Error> {
  return useQuery({
    queryKey: id === undefined ? ["application", "none"] : queryKeys.application(id),
    queryFn: () => api.application(id ?? 0),
    enabled: id !== undefined,
    refetchInterval: (query) =>
      query.state.data && isRetryable(query.state.data) ? 5_000 : false,
    refetchIntervalInBackground: true,
  });
}

export function useRanking(
  offerId: number | undefined,
): UseQueryResult<RankedApplication[], Error> {
  return useQuery({
    queryKey:
      offerId === undefined ? ["ranking", "none"] : queryKeys.ranking(offerId),
    queryFn: () => api.ranking(offerId ?? 0),
    enabled: offerId !== undefined,
  });
}

export function useGatewayHealth(): UseQueryResult<HealthResponse, Error> {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: api.health,
    refetchInterval: 15_000,
    retry: 1,
  });
}

export function invalidateRecruitmentData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.candidates }),
    queryClient.invalidateQueries({ queryKey: queryKeys.offers }),
    queryClient.invalidateQueries({ queryKey: queryKeys.applications }),
    queryClient.invalidateQueries({ queryKey: ["ranking"] }),
  ]);
}
