import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import type { Candidate, CandidateRequest } from "../api/types";
import { useCandidates, invalidateRecruitmentData } from "../api/queries";
import { CandidateForm } from "../components/CandidateForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState, ErrorBanner, Skeleton } from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { SidePanel } from "../components/SidePanel";
import { useToast } from "../hooks/useToast";
import { getFriendlyError } from "../lib/errors";

export function CandidatesPage() {
  const queryClient = useQueryClient();
  const candidates = useCandidates();
  const { notify } = useToast();
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Candidate>();
  const [deleteTarget, setDeleteTarget] = useState<Candidate>();
  const save = useMutation({
    mutationFn: ({ id, data }: { id?: number; data: CandidateRequest }) =>
      id ? api.updateCandidate(id, data) : api.createCandidate(data),
    onSuccess: async (candidate) => {
      notify("success", editing ? "Candidat modifié" : "Candidat créé", `${candidate.firstName} ${candidate.lastName}`);
      setPanelOpen(false);
      setEditing(undefined);
      await invalidateRecruitmentData(queryClient);
    },
    onError: (error) => notify("error", "Enregistrement impossible", getFriendlyError(error, "candidate")),
  });
  const remove = useMutation({
    mutationFn: api.deleteCandidate,
    onSuccess: async () => {
      notify("success", "Candidat supprimé");
      setDeleteTarget(undefined);
      await invalidateRecruitmentData(queryClient);
    },
    onError: (error) => notify("error", "Suppression impossible", getFriendlyError(error)),
  });
  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setEditing(undefined);
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("fr");
    return (candidates.data ?? []).filter((candidate) =>
      [
        candidate.firstName,
        candidate.lastName,
        candidate.email,
        ...(candidate.skills ?? []),
        candidate.diplomaTitle ?? "",
        candidate.diplomaInstitution ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(needle),
    );
  }, [candidates.data, search]);

  function openCreate() {
    setEditing(undefined);
    setPanelOpen(true);
  }

  function openEdit(candidate: Candidate) {
    setEditing(candidate);
    setPanelOpen(true);
  }

  async function saveCandidate(data: CandidateRequest) {
    await save.mutateAsync({ id: editing?.id, data });
  }

  return (
    <section>
      <PageHeader
        actions={
          <button className="button button-primary" onClick={openCreate} type="button">
            <Plus size={15} /> Nouveau candidat
          </button>
        }
        description="Construisez votre vivier et gardez les compétences au premier plan."
        eyebrow="TALENT POOL · REST"
        title="Les personnes avant les profils."
      />
      {candidates.isError && (
        <ErrorBanner error={candidates.error} retry={() => void candidates.refetch()} />
      )}
      <div className="toolbar">
        <div className="toolbar-group">
          <label className="search-wrap">
            <Search aria-hidden="true" size={15} />
            <span className="sr-only">Rechercher un candidat</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, e-mail, compétence…"
              type="search"
              value={search}
            />
          </label>
          <span className="result-count">{filtered.length} profil{filtered.length === 1 ? "" : "s"}</span>
        </div>
      </div>
      {candidates.isLoading ? (
        <Skeleton rows={5} />
      ) : filtered.length ? (
        <motion.div
          animate="visible"
          className="card-grid"
          initial="hidden"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.045 } },
          }}
        >
          {filtered.map((candidate) => (
            <CandidateCard
              candidate={candidate}
              key={candidate.id}
              onDelete={() => setDeleteTarget(candidate)}
              onEdit={() => openEdit(candidate)}
            />
          ))}
        </motion.div>
      ) : (
        <EmptyState
          action={
            <button className="button button-primary" onClick={openCreate} type="button">
              <Plus size={14} /> Ajouter le premier candidat
            </button>
          }
          description={
            search
              ? "Aucun profil ne correspond à cette recherche."
              : "Les profils créés via l’API apparaîtront ici."
          }
          title={search ? "Aucun résultat" : "Votre vivier commence ici"}
        />
      )}
      <SidePanel
        description="Les champs suivent le contrat REST; le groupe diplôme est facultatif."
        onClose={closePanel}
        open={panelOpen}
        title={editing ? "Modifier le candidat" : "Nouveau candidat"}
      >
        <CandidateForm
          candidate={editing}
          onSave={saveCandidate}
          pending={save.isPending}
        />
      </SidePanel>
      <ConfirmDialog
        description={`Cette action supprimera ${deleteTarget?.firstName ?? "ce"} ${deleteTarget?.lastName ?? "profil"} et ne pourra pas être annulée.`}
        onCancel={() => setDeleteTarget(undefined)}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget.id)}
        open={Boolean(deleteTarget)}
        pending={remove.isPending}
        title="Supprimer ce candidat ?"
      />
    </section>
  );
}

function CandidateCard({
  candidate,
  onEdit,
  onDelete,
}: {
  candidate: Candidate;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const name = `${candidate.firstName} ${candidate.lastName}`;
  const initials = `${candidate.firstName[0] ?? ""}${candidate.lastName[0] ?? ""}`.toUpperCase();
  return (
    <motion.article
      className="glass-card entity-card"
      layout
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -3, rotateX: 1.2, rotateY: -0.5 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className="entity-card-head">
        <span className="avatar">{initials}</span>
        <div className="entity-title">
          <h3>{name}</h3>
          <p><Mail aria-hidden="true" size={11} /> {candidate.email}</p>
        </div>
        <div className="entity-actions">
          <button aria-label={`Modifier ${name}`} className="icon-action" onClick={onEdit} type="button"><Pencil size={14} /></button>
          <button aria-label={`Supprimer ${name}`} className="icon-action danger" onClick={onDelete} type="button"><Trash2 size={14} /></button>
        </div>
      </div>
      <div className="entity-meta">
        {candidate.skills?.length ? candidate.skills.slice(0, 4).map((skill) => (
          <span className="chip chip-blue" key={skill}>{skill}</span>
        )) : <span className="chip">Compétences non renseignées</span>}
        {(candidate.skills?.length ?? 0) > 4 && <span className="chip">+{(candidate.skills?.length ?? 0) - 4}</span>}
      </div>
      <p className="entity-description">
        {candidate.diplomaTitle
          ? `${candidate.diplomaTitle}${candidate.diplomaInstitution ? ` · ${candidate.diplomaInstitution}` : ""}${candidate.diplomaYear ? ` · ${candidate.diplomaYear}` : ""}`
          : "Aucun renseignement de diplôme."}
      </p>
      <div className="entity-foot">
        <span><UserRound size={12} /> Expérience</span>
        <strong>{candidate.experienceYears ?? 0} an{candidate.experienceYears === 1 ? "" : "s"}</strong>
        <span><GraduationCap size={12} /> Diplôme</span>
        <strong>{candidate.diplomaTitle ? "Renseigné" : "Optionnel"}</strong>
      </div>
      <span className="sr-only">Profil {name}, identifiant {candidate.id}</span>
    </motion.article>
  );
}
