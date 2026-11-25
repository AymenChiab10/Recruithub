import { useEffect } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  CircleCheck,
  Clock3,
  FileText,
  Users,
} from "lucide-react";
import {
  animate as animateValue,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Link } from "react-router-dom";
import { applicationStatuses } from "../api/types";
import { ErrorBanner, Skeleton } from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useApplications, useCandidates, useGatewayHealth, useOffers } from "../api/queries";
import { formatDate, getStatusCopy, isRetryableStatus } from "../lib/status";

function AnimatedCount({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (current) =>
    Math.round(current).toLocaleString("fr-FR"),
  );

  useEffect(() => {
    const controls = animateValue(count, value, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [count, value]);

  return <motion.span>{rounded}</motion.span>;
}

export function DashboardPage() {
  const candidates = useCandidates();
  const offers = useOffers();
  const applications = useApplications();
  const health = useGatewayHealth();
  const loading = candidates.isLoading || offers.isLoading || applications.isLoading;
  const hasError = candidates.error || offers.error || applications.error;
  const candidateById = new Map((candidates.data ?? []).map((item) => [item.id, item]));
  const offerById = new Map((offers.data ?? []).map((item) => [item.id, item]));
  const applicationList = applications.data ?? [];
  const scored = applicationList.filter((item) => item.score !== null && item.score !== undefined).length;
  const pending = applicationList.filter((item) => isRetryableStatus(item.status)).length;
  const statusCounts = applicationStatuses.map((status) => ({
    status,
    count: applicationList.filter((item) => item.status === status).length,
  }));
  const chartMax = Math.max(1, ...statusCounts.map((item) => item.count));
  const recent = [...applicationList]
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))
    .slice(0, 5);

  function retryAll() {
    void Promise.all([
      candidates.refetch(),
      offers.refetch(),
      applications.refetch(),
      health.refetch(),
    ]);
  }

  return (
    <section>
      <PageHeader
        description="Une lecture nette de votre activité recrutement, du dépôt de candidature au score."
        eyebrow="RECRUITMENT · CONTROL ROOM"
        title="Les bons talents, au bon endroit."
        actions={
          <span className="header-date">
            {new Intl.DateTimeFormat("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date())}
          </span>
        }
      />
      {hasError && (
        <ErrorBanner
          error={candidates.error ?? offers.error ?? applications.error}
          retry={retryAll}
        />
      )}
      {loading ? (
        <Skeleton rows={5} />
      ) : (
        <>
          <div className="metric-grid">
            <MetricCard
              icon={<Users size={16} />}
              label="Candidats"
              note="Profils dans votre vivier"
              value={candidates.data?.length ?? 0}
            />
            <MetricCard
              icon={<BriefcaseBusiness size={16} />}
              label="Offres actives"
              note="Opportunités publiées"
              value={offers.data?.length ?? 0}
            />
            <MetricCard
              icon={<FileText size={16} />}
              label="Candidatures"
              note="Demandes enregistrées"
              value={applicationList.length}
            />
            <MetricCard
              icon={<CircleCheck size={16} />}
              label="Scorées"
              note="Score confirmé par Matching"
              tone="green"
              value={scored}
            />
            <MetricCard
              icon={<Clock3 size={16} />}
              label="En attente"
              note="Reprises automatiques en cours"
              tone="orange"
              value={pending}
            />
          </div>
          <div className="dashboard-grid">
            <section aria-labelledby="status-chart-title" className="glass-card dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h2 id="status-chart-title">Flux des candidatures</h2>
                  <p>Répartition par statut métier</p>
                </div>
                <span className="chip chip-blue">{applicationList.length} au total</span>
              </div>
              {applicationList.length === 0 ? (
                <div className="chart-empty">Les statuts apparaîtront ici après votre première candidature.</div>
              ) : (
                <div className="status-chart">
                  {statusCounts.map(({ status, count }, index) => {
                    const tone = getStatusCopy(status).tone;
                    return (
                      <div className="chart-row" key={status}>
                        <span>{getStatusCopy(status).label}</span>
                        <div
                          aria-label={`${count} candidature(s) ${getStatusCopy(status).label.toLowerCase()}`}
                          className="chart-track"
                          role="img"
                        >
                          <motion.div
                            animate={{ width: `${(count / chartMax) * 100}%` }}
                            className={`chart-bar ${tone === "orange" ? "orange" : tone === "green" ? "green" : index % 2 ? "violet" : ""}`}
                            initial={{ width: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.04 }}
                          />
                        </div>
                        <span className="chart-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            <section aria-labelledby="recent-title" className="glass-card dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h2 id="recent-title">Dernières candidatures</h2>
                  <p>Les dernières entrées du pipeline</p>
                </div>
                <Link className="subtle-link" to="/applications">Tout voir <ArrowUpRight size={12} /></Link>
              </div>
              {recent.length ? (
                <div className="recent-list">
                  {recent.map((application) => {
                    const candidate = candidateById.get(application.candidateId);
                    const offer = offerById.get(application.offerId);
                    const fullName = candidate
                      ? `${candidate.firstName} ${candidate.lastName}`
                      : `Candidature #${application.id}`;
                    return (
                      <div className="recent-row" key={application.id}>
                        <span className="avatar">{initials(fullName)}</span>
                        <div className="recent-copy">
                          <strong>{fullName}</strong>
                          <span>{offer?.title ?? `Offre #${application.offerId}`} · {formatDate(application.submittedAt)}</span>
                        </div>
                        {application.score !== null && application.score !== undefined ? (
                          <span className="recent-score">{Math.round(application.score)}</span>
                        ) : (
                          <StatusBadge status={application.status} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="chart-empty">Aucune candidature pour le moment.</p>
              )}
            </section>
            <section className="glass-card dashboard-panel dashboard-system">
              <div className="panel-heading">
                <div>
                  <h2>État du système</h2>
                  <p>Signal de santé exposé par l’API Gateway</p>
                </div>
                <Activity size={17} className={health.data?.status === "UP" ? "text-grpc" : "text-muted"} />
              </div>
              <Link className="system-mini" to="/system">
                <span className="system-orb"><Activity size={19} /></span>
                <span>
                  <strong>{health.data?.status === "UP" ? "Gateway opérationnelle" : health.isLoading ? "Vérification en cours" : "Gateway indisponible"}</strong>
                  <span>{health.data?.status ? `Actuator · ${health.data.status}` : "Réessayer la sonde de santé"}</span>
                </span>
                <ArrowUpRight className="system-arrow" size={16} />
              </Link>
            </section>
            <section className="glass-card dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h2>Un bon départ</h2>
                  <p>Les actions clés pour alimenter votre pipeline</p>
                </div>
              </div>
              <div className="quick-actions">
                <Link className="button button-quiet" to="/candidates"><Users size={14} /> Ajouter un candidat</Link>
                <Link className="button button-quiet" to="/offers"><BriefcaseBusiness size={14} /> Créer une offre</Link>
                <Link className="button button-primary" to="/applications"><FileText size={14} /> Faire postuler</Link>
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}

function MetricCard({
  icon,
  label,
  note,
  value,
  tone = "blue",
}: {
  icon: ReactNode;
  label: string;
  note: string;
  value: number;
  tone?: "blue" | "green" | "orange";
}) {
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card metric-card metric-${tone}`}
      initial={{ opacity: 0, y: 11 }}
      transition={{ duration: 0.35 }}
    >
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value"><AnimatedCount value={value} /></div>
      <span className="metric-note">{note}</span>
    </motion.article>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
