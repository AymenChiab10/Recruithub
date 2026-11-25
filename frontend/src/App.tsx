import { lazy } from "react";
import { MotionConfig } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/Layout";
import { ToastProvider } from "./components/ToastProvider";

const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })),
);
const CandidatesPage = lazy(() =>
  import("./pages/CandidatesPage").then((module) => ({ default: module.CandidatesPage })),
);
const OffersPage = lazy(() =>
  import("./pages/OffersPage").then((module) => ({ default: module.OffersPage })),
);
const ApplicationsPage = lazy(() =>
  import("./pages/ApplicationsPage").then((module) => ({ default: module.ApplicationsPage })),
);
const RankingPage = lazy(() =>
  import("./pages/RankingPage").then((module) => ({ default: module.RankingPage })),
);
const SystemPage = lazy(() =>
  import("./pages/SystemPage").then((module) => ({ default: module.SystemPage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      refetchOnWindowFocus: true,
    },
  },
});

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route element={<DashboardPage />} index />
                <Route element={<CandidatesPage />} path="candidates" />
                <Route element={<OffersPage />} path="offers" />
                <Route element={<ApplicationsPage />} path="applications" />
                <Route element={<RankingPage />} path="ranking" />
                <Route element={<SystemPage />} path="system" />
                <Route element={<NotFoundPage />} path="*" />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}
