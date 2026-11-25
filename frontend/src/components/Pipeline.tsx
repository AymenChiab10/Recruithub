import { Check, Circle, LoaderCircle, TriangleAlert } from "lucide-react";
import { motion } from "framer-motion";
import type { Application } from "../api/types";
import { getStatusCopy, isRetryableStatus } from "../lib/status";

type StepState = "complete" | "pending" | "warning" | "idle";

function StepIcon({ state }: { state: StepState }) {
  if (state === "complete") return <Check aria-hidden="true" size={15} />;
  if (state === "warning") return <TriangleAlert aria-hidden="true" size={15} />;
  if (state === "pending") return <LoaderCircle aria-hidden="true" size={15} />;
  return <Circle aria-hidden="true" size={12} />;
}

export function Pipeline({ application }: { application: Application }) {
  const scoreAvailable = application.score !== null && application.score !== undefined;
  const knownPipelineStatus = [
    "RECEIVED",
    "DIPLOMA_PENDING_VERIFICATION",
    "SCORING_PENDING",
    "DIPLOMA_NOT_FOUND",
    "SCORED",
  ].includes(application.status);

  const receipt: StepState =
    application.status === "RECEIVED" ? "complete" : "complete";
  const diploma: StepState =
    application.status === "DIPLOMA_PENDING_VERIFICATION"
      ? "pending"
      : application.status === "DIPLOMA_NOT_FOUND" ||
          (application.status === "SCORING_PENDING" && !application.diplomaVerified)
        ? "warning"
        : application.diplomaVerified
          ? "complete"
          : application.status === "RECEIVED"
            ? "pending"
            : "idle";
  const score: StepState = scoreAvailable
    ? "complete"
    : application.status === "SCORING_PENDING" || application.status === "RECEIVED"
      ? "pending"
      : "idle";
  const steps = [
    { key: "received", label: "Reçue", protocol: "REST", state: receipt, color: "rest" },
    {
      key: "diploma",
      label: "Diplôme",
      protocol: "SOAP",
      state: diploma,
      color: "soap",
    },
    { key: "score", label: "Score", protocol: "gRPC", state: score, color: "grpc" },
  ] as const;
  const statusDescription = getStatusCopy(application.status).description;

  return (
    <div
      aria-label={`Pipeline de la candidature ${application.id}. ${statusDescription}`}
      className={`pipeline ${knownPipelineStatus ? "" : "pipeline-neutral"}`}
      title={statusDescription}
    >
      {steps.map((step, index) => (
        <div className={`pipeline-step ${step.state} ${step.color}`} key={step.key}>
          <span className="pipeline-node">
            <StepIcon state={step.state} />
          </span>
          <span className="pipeline-label">{step.label}</span>
          <span className="pipeline-protocol">{step.protocol}</span>
          {index < steps.length - 1 && (
            <motion.span
              animate={{ scaleX: step.state === "complete" ? 1 : 0.35 }}
              className={`pipeline-link link-${step.color}`}
              initial={{ scaleX: 0.15 }}
              style={{ transformOrigin: "left" }}
            />
          )}
        </div>
      ))}
      {application.status === "DIPLOMA_PENDING_VERIFICATION" && (
        <span className="pipeline-note tone-orange">En attente du registre</span>
      )}
      {application.status === "SCORING_PENDING" && (
        <span className="pipeline-note tone-green">En attente du calcul</span>
      )}
      {application.status === "DIPLOMA_NOT_FOUND" && (
        <span className="pipeline-note tone-orange">Diplôme non vérifié</span>
      )}
      {!knownPipelineStatus && (
        <span className="pipeline-note tone-neutral">
          Statut supplémentaire : {application.status}
        </span>
      )}
      {isRetryableStatus(application.status) && (
        <span className="polling-note">Actualisation automatique · 5 s</span>
      )}
    </div>
  );
}
