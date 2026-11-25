import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import { FileText, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import { ApiError } from "../api/client";
import { queryKeys, useApplication, useApplications, useCandidates, useOffers, invalidateRecruitmentData } from "../api/queries";
import { applicationStatuses, type Application, type ApplicationRequest } from "../api/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState, ErrorBanner, FieldError, FormErrorBanner, Skeleton } from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { Pipeline } from "../components/Pipeline";
import { ScoreRing } from "../components/ScoreRing";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../hooks/useToast";
import { getFriendlyError } from "../lib/errors";
import { formatDate, getStatusCopy, isRetryableStatus } from "../lib/status";

const applicationSchema = z.object({
  candidateId: z.number().int().positive("Choisissez un candidat."),
  offerId: z.number().int().positive("Choisissez une offre."),
});
type ApplicationFormValues = z.infer<typeof applicationSchema>;

export function ApplicationsPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const candidates = useCandidates();
  const offers = useOffers();
  const applications = useApplications();
  const [filter, setFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<number>();
  const [deleteTarget, setDeleteTarget] = useState<Application>();
  const selected = useApplication(selectedId);
  const candidateById = new Map((candidates.data ?? []).map((candidate) => [candidate.id, candidate]));
  const offerById = new Map((offers.data ?? []).map((offer) => [offer.id, offer]));
  const submitApplication = useMutation({
    mutationFn: (data: ApplicationRequest) => api.createApplication(data),
    onSuccess: async (application) => {
      queryClient.setQueryData(queryKeys.application(application.id), application);
      setSelectedId(application.id);
      notify("success", "Candidature envoyée", `Candidature #${application.id} · ${getStatusCopy(application.status).label}`);
      await invalidateRecruitmentData(queryClient);
    },
    onError: (error) => notify("error", "Envoi impossible", getFriendlyError(error, "application")),
  });
  const remove = useMutation({
    mutationFn: api.deleteApplication,
    onSuccess: async () => {
      notify("success", "Candidature supprimée");
      setDeleteTarget(undefined);
      if (selectedId === deleteTarget?.id) setSelectedId(undefined);
      await invalidateRecruitmentData(queryClient);
    },
    onError: (error) => notify("error", "Suppression impossible", getFriendlyError(error)),
  });
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { candidateId: 0, offerId: 0 },
  });

  const filtered = useMemo(
    () =>
      (applications.data ?? [])
        .filter((application) => filter === "ALL" || application.status === filter)
        .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt)),
    [applications.data, filter],
  );
  const selectedApplication = selected.data;

  async function submit(values: ApplicationFormValues) {
    try {
      await submitApplication.mutateAsync(values);
      form.reset({ candidateId: 0, offerId: 0 });
    } catch {
      form.setError("root.server", {
        message: "Vérifiez les sélecteurs ou réessayez quand le service sera disponible.",
      });
    }
  }

  return (
    <section>
      <PageHeader
        description="Un seul envoi déclenche la vérification du diplôme et le calcul du score côté backend."
        eyebrow="PIPELINE · REST → SOAP → gRPC"
        title="Chaque candidature a son parcours."
        actions={<span className="chip chip-green"><span className="legend-dot grpc-dot" /> Reprise automatique · 30 s</span>}
      />
      {applications.isError && <ErrorBanner error={applications.error} retry={() => void applications.refetch()} />}
      <div className="applications-layout">
        <section className="glass-card form-card">
          <div className="panel-heading">
            <div>
              <h2>Postuler</h2>
              <p>Sélectionnez un candidat et une offre.</p>
            </div>
            <span className="metric-icon"><Plus size={16} /></span>
          </div>
          <form className="form-stack" onSubmit={form.handleSubmit(submit)} noValidate>
            <div className="field">
              <label htmlFor="application-candidate">Candidat <span>*</span></label>
              <select id="application-candidate" {...form.register("candidateId", { setValueAs: Number })}>
                <option value={0}>Choisir un profil…</option>
                {(candidates.data ?? []).map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.firstName} {candidate.lastName} · #{candidate.id}
                  </option>
                ))}
              </select>
              <FieldError>{form.formState.errors.candidateId?.message}</FieldError>
            </div>
            <div className="field">
              <label htmlFor="application-offer">Offre <span>*</span></label>
              <select id="application-offer" {...form.register("offerId", { setValueAs: Number })}>
                <option value={0}>Choisir une offre…</option>
                {(offers.data ?? []).map((offer) => (
                  <option key={offer.id} value={offer.id}>{offer.title} · #{offer.id}</option>
                ))}
              </select>
              <FieldError>{form.formState.errors.offerId?.message}</FieldError>
            </div>
            <FieldError>{form.formState.errors.root?.server?.message}</FieldError>
            {submitApplication.error instanceof ApiError &&
              [0, 502, 503].includes(submitApplication.error.status) && (
              <FormErrorBanner
                error={submitApplication.error}
                retry={() => {
                  void form.handleSubmit(submit)();
                }}
              />
            )}
            <button
              className="button button-primary button-wide"
              disabled={submitApplication.isPending || !candidates.data?.length || !offers.data?.length}
              type="submit"
            >
              <FileText size={15} /> {submitApplication.isPending ? "Traitement en cours…" : "Envoyer la candidature"}
            </button>
            {(!candidates.data?.length || !offers.data?.length) && !candidates.isLoading && !offers.isLoading && (
              <p className="field-hint">Créez au moins un candidat et une offre avant de postuler.</p>
            )}
          </form>
        </section>
        <section aria-labelledby="applications-list-title">
          {selectedApplication && (
            <ApplicationResult
              application={selectedApplication}
              candidateName={candidateLabel(candidateById.get(selectedApplication.candidateId), selectedApplication.candidateId)}
              offerTitle={offerById.get(selectedApplication.offerId)?.title ?? `Offre #${selectedApplication.offerId}`}
              onRetry={() => void selected.refetch()}
            />
          )}
          {selected.isError && selected.error && (
            <ErrorBanner error={selected.error} retry={() => void selected.refetch()} />
          )}
          <div className="toolbar">
            <div>
              <h2 className="section-title" id="applications-list-title">Candidatures récentes</h2>
              <span className="result-count">{filtered.length} résultat{filtered.length === 1 ? "" : "s"}</span>
            </div>
            <select
              aria-label="Filtrer par statut"
              className="filter-select"
              onChange={(event) => setFilter(event.target.value)}
              value={filter}
            >
              <option value="ALL">Tous les statuts</option>
              {applicationStatuses.map((status) => (
                <option key={status} value={status}>{getStatusCopy(status).label}</option>
              ))}
            </select>
          </div>
          {applications.isLoading ? (
            <Skeleton rows={4} />
          ) : filtered.length ? (
            <div className="application-list">
              {filtered.map((application) => (
                <ApplicationCard
                  application={application}
                  candidateName={candidateLabel(candidateById.get(application.candidateId), application.candidateId)}
                  key={application.id}
                  offerTitle={offerById.get(application.offerId)?.title ?? `Offre #${application.offerId}`}
                  onDelete={() => setDeleteTarget(application)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              description={filter === "ALL" ? "Envoyez une candidature pour démarrer la vérification SOAP et le calcul gRPC." : "Aucune candidature ne porte ce statut."}
              title={filter === "ALL" ? "Le pipeline est prêt" : "Rien dans ce filtre"}
            />
          )}
        </section>
      </div>
      <ConfirmDialog
        description={`La candidature #${deleteTarget?.id ?? ""} sera supprimée.`}
        onCancel={() => setDeleteTarget(undefined)}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget.id)}
        open={Boolean(deleteTarget)}
        pending={remove.isPending}
        title="Supprimer cette candidature ?"
      />
    </section>
  );
}

function ApplicationResult({
  application,
  candidateName,
  offerTitle,
  onRetry,
}: {
  application: Application;
  candidateName: string;
  offerTitle: string;
  onRetry: () => void;
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="glass-card recent-created"
      initial={{ opacity: 0, y: 8 }}
      aria-live="polite"
    >
      <div className="recent-created-head">
        <div>
          <p className="eyebrow">RÉPONSE API · #{application.id}</p>
          <h3>{candidateName} → {offerTitle}</h3>
        </div>
        <StatusBadge status={application.status} />
      </div>
      <Pipeline application={application} />
      <div className="application-card-meta">
        <span className="application-date">{isRetryableStatus(application.status) ? "Le backend réessaie automatiquement." : formatDate(application.submittedAt)}</span>
        <div className="result-score">
          <span>Score</span>
          <ScoreRing score={application.score} />
        </div>
        {isRetryableStatus(application.status) && (
          <button className="icon-button" aria-label="Actualiser le statut" onClick={onRetry} type="button"><RefreshCw size={15} /></button>
        )}
      </div>
    </motion.section>
  );
}

function ApplicationCard({
  application,
  candidateName,
  offerTitle,
  onDelete,
}: {
  application: Application;
  candidateName: string;
  offerTitle: string;
  onDelete: () => void;
}) {
  return (
    <motion.article className="glass-card application-card" layout>
      <div className="application-card-head">
        <span className="avatar">{candidateName.split(" ").map((part) => part[0] ?? "").slice(0, 2).join("").toUpperCase()}</span>
        <div className="application-card-copy">
          <h3>{candidateName}</h3>
          <p>{offerTitle} · Candidature #{application.id}</p>
        </div>
        <span className="application-date">{formatDate(application.submittedAt)}</span>
        <button aria-label={`Supprimer la candidature ${application.id}`} className="icon-action danger" onClick={onDelete} type="button"><Trash2 size={14} /></button>
      </div>
      <div className="application-card-meta">
        <StatusBadge status={application.status} />
        <span className="result-score"><span>Score</span><ScoreRing score={application.score} /></span>
      </div>
      <Pipeline application={application} />
    </motion.article>
  );
}

function candidateLabel(
  candidate: { firstName: string; lastName: string } | undefined,
  id: number,
) {
  return candidate ? `${candidate.firstName} ${candidate.lastName}` : `Candidat #${id}`;
}
