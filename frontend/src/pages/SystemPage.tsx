import { Activity, RefreshCw, ShieldCheck, WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { ErrorBanner, Skeleton } from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { useGatewayHealth } from "../api/queries";

export function SystemPage() {
  const health = useGatewayHealth();
  const status = health.data?.status ?? "UNKNOWN";
  return (
    <section>
      <PageHeader
        description="Un signal simple et transparent sur la passerelle HTTP utilisée par l’interface."
        eyebrow="OBSERVABILITÉ · GATEWAY"
        title="Tout commence par une connexion."
        actions={
          <button
            className="button button-quiet"
            disabled={health.isFetching}
            onClick={() => void health.refetch()}
            type="button"
          >
            <RefreshCw size={14} /> Actualiser
          </button>
        }
      />
      {health.isLoading ? (
        <Skeleton rows={2} />
      ) : health.isError ? (
        <ErrorBanner error={health.error} retry={() => void health.refetch()} />
      ) : (
        <div className="system-grid">
          <section aria-label="Santé de la passerelle" className="glass-card system-card">
            <div className="health-state">
              <span className={`health-indicator ${status === "UP" ? "" : "down"}`} />
              <div>
                <h2>{status === "UP" ? "Gateway opérationnelle" : "Gateway indisponible"}</h2>
                <p>GET /actuator/health · {status}</p>
              </div>
            </div>
            <p className="system-note">
              L’indicateur contrôle uniquement l’API Gateway. Les services métier ne sont pas
              exposés par cette route et l’interface ne contacte jamais leurs ports.
            </p>
          </section>
          <section className="glass-card system-card">
            <div className="panel-heading">
              <div>
                <h2>Protocoles du parcours</h2>
                <p>Le navigateur reste côté HTTP/JSON.</p>
              </div>
              <ShieldCheck color="var(--grpc)" size={18} />
            </div>
            <div className="protocol-list">
              <ProtocolRow color="var(--rest)" label="REST · bleu" detail="Le front appelle la Gateway pour les données métier." icon={<Activity size={16} />} />
              <ProtocolRow color="var(--soap)" label="SOAP · orange" detail="La Gateway ne l’expose pas; le backend vérifie les diplômes." icon={<WifiOff size={16} />} />
              <ProtocolRow color="var(--grpc)" label="gRPC · vert" detail="Le backend calcule et classe les candidatures." icon={<Activity size={16} />} />
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function ProtocolRow({
  color,
  label,
  detail,
  icon,
}: {
  color: string;
  label: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="protocol-row">
      <span className="protocol-swatch" style={{ backgroundColor: color }} />
      <span>{icon}</span>
      <div><strong>{label}</strong><span>{detail}</span></div>
    </div>
  );
}
