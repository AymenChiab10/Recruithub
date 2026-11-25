import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownWideNarrow, Trophy } from "lucide-react";
import { useApplications, useCandidates, useOffers, useRanking } from "../api/queries";
import { ErrorBanner, EmptyState, Skeleton } from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { ScoreRing } from "../components/ScoreRing";

export function RankingPage() {
  const offers = useOffers();
  const candidates = useCandidates();
  const applications = useApplications();
  const [offerId, setOfferId] = useState<number>();
  const ranking = useRanking(offerId);

  useEffect(() => {
    if (offerId === undefined && offers.data?.length) {
      setOfferId(offers.data[0].id);
    }
  }, [offerId, offers.data]);

  const candidateById = new Map((candidates.data ?? []).map((candidate) => [candidate.id, candidate]));
  const applicationById = new Map((applications.data ?? []).map((application) => [application.id, application]));
  const rows = useMemo(
    () => [...(ranking.data ?? [])].sort((left, right) => left.rank - right.rank),
    [ranking.data],
  );
  const isLoading = offers.isLoading || ranking.isLoading;
  const queryError = offers.error ?? ranking.error ?? applications.error ?? candidates.error;
  const podium = [...rows.slice(0, 3)].sort((left, right) => podiumPosition(left.rank) - podiumPosition(right.rank));

  return (
    <section>
      <PageHeader
        description="Les scores confirmés, classés du meilleur match au suivant."
        eyebrow="MATCHING · gRPC"
        title="Un classement lisible, sans bruit."
        actions={<span className="chip chip-green"><Trophy size={13} /> Score / 100</span>}
      />
      {queryError && (
        <ErrorBanner
          error={queryError}
          retry={() => {
            void Promise.all([offers.refetch(), ranking.refetch(), applications.refetch(), candidates.refetch()]);
          }}
        />
      )}
      <div className="ranking-toolbar">
        <label htmlFor="ranking-offer">Classement de l’offre</label>
        <select
          className="filter-select"
          disabled={!offers.data?.length}
          id="ranking-offer"
          onChange={(event) => setOfferId(Number(event.target.value))}
          value={offerId ?? ""}
        >
          {!offers.data?.length && <option value="">Aucune offre</option>}
          {(offers.data ?? []).map((offer) => (
            <option key={offer.id} value={offer.id}>{offer.title} · #{offer.id}</option>
          ))}
        </select>
        <span className="result-count">{rows.length} profil{rows.length === 1 ? "" : "s"} classé{rows.length === 1 ? "" : "s"}</span>
      </div>
      {isLoading ? (
        <Skeleton rows={4} />
      ) : !offers.data?.length ? (
        <EmptyState title="Aucune offre à classer" description="Créez une offre puis envoyez des candidatures scorées." />
      ) : !rows.length ? (
        <EmptyState title="Le podium attend ses premiers scores" description="Seules les candidatures dont le score est confirmé apparaissent dans le classement." />
      ) : (
        <>
          <div className="podium">
            {podium.map((entry) => {
              const application = applicationById.get(entry.applicationId);
              const candidate = application ? candidateById.get(application.candidateId) : undefined;
              const name = candidate ? `${candidate.firstName} ${candidate.lastName}` : `Candidature #${entry.applicationId}`;
              return (
                <motion.article
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-card podium-card ${entry.rank === 1 ? "first" : entry.rank === 2 ? "second" : "third"}`}
                  initial={{ opacity: 0, y: 22 }}
                  key={entry.applicationId}
                  layout
                  transition={{ type: "spring", stiffness: 120, damping: 16 }}
                >
                  <span className="podium-rank">{entry.rank}</span>
                  <strong title={name}>{name}</strong>
                  <span>{candidate?.email ?? `Profil ${entry.applicationId}`}</span>
                  <span className="podium-score">{entry.score.toFixed(1)}</span>
                </motion.article>
              );
            })}
          </div>
          <section aria-label="Classement complet" className="glass-card ranking-table">
            {rows.map((entry) => {
              const application = applicationById.get(entry.applicationId);
              const candidate = application ? candidateById.get(application.candidateId) : undefined;
              const name = candidate ? `${candidate.firstName} ${candidate.lastName}` : `Candidature #${entry.applicationId}`;
              return (
                <motion.div
                  className="ranking-row"
                  key={entry.applicationId}
                  layout
                  transition={{ type: "spring", stiffness: 180, damping: 24 }}
                >
                  <span className={`rank-number ${entry.rank <= 3 ? "top-rank" : ""}`}>#{entry.rank}</span>
                  <span className="rank-person">
                    <span className="avatar">{name.split(" ").map((part) => part[0] ?? "").slice(0, 2).join("").toUpperCase()}</span>
                    <strong>{name}</strong>
                  </span>
                  <span aria-label={`Score ${entry.score} sur 100`} className="rank-bar">
                    <motion.span
                      animate={{ width: `${Math.min(100, Math.max(0, entry.score))}%` }}
                      className="rank-bar-fill"
                      initial={{ width: 0 }}
                      transition={{ duration: 0.75, delay: Math.min(entry.rank, 7) * 0.045 }}
                    />
                  </span>
                  <span className="rank-score"><ScoreRing score={entry.score} /></span>
                </motion.div>
              );
            })}
          </section>
          <p className="ranking-footnote"><ArrowDownWideNarrow size={13} /> Classement gRPC · Les candidatures en attente ne sont pas incluses.</p>
        </>
      )}
    </section>
  );
}

function podiumPosition(rank: number) {
  return rank === 1 ? 0 : rank === 2 ? 1 : 2;
}
