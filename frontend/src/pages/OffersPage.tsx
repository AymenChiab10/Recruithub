import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Clock3,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import type { Offer, OfferRequest } from "../api/types";
import { useOffers, invalidateRecruitmentData } from "../api/queries";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState, ErrorBanner, Skeleton } from "../components/Feedback";
import { OfferForm } from "../components/OfferForm";
import { PageHeader } from "../components/PageHeader";
import { SidePanel } from "../components/SidePanel";
import { useToast } from "../hooks/useToast";
import { getFriendlyError } from "../lib/errors";

export function OffersPage() {
  const queryClient = useQueryClient();
  const offers = useOffers();
  const { notify } = useToast();
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Offer>();
  const [deleteTarget, setDeleteTarget] = useState<Offer>();
  const save = useMutation({
    mutationFn: ({ id, data }: { id?: number; data: OfferRequest }) =>
      id ? api.updateOffer(id, data) : api.createOffer(data),
    onSuccess: async (offer) => {
      notify("success", editing ? "Offre modifiée" : "Offre créée", offer.title);
      setPanelOpen(false);
      setEditing(undefined);
      await invalidateRecruitmentData(queryClient);
    },
    onError: (error) => notify("error", "Enregistrement impossible", getFriendlyError(error)),
  });
  const remove = useMutation({
    mutationFn: api.deleteOffer,
    onSuccess: async () => {
      notify("success", "Offre supprimée");
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
    return (offers.data ?? []).filter((offer) =>
      [offer.title, offer.description ?? "", ...(offer.requiredSkills ?? [])]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(needle),
    );
  }, [offers.data, search]);

  function openCreate() {
    setEditing(undefined);
    setPanelOpen(true);
  }

  function openEdit(offer: Offer) {
    setEditing(offer);
    setPanelOpen(true);
  }

  async function saveOffer(data: OfferRequest) {
    await save.mutateAsync({ id: editing?.id, data });
  }

  return (
    <section>
      <PageHeader
        actions={<button className="button button-primary" onClick={openCreate} type="button"><Plus size={15} /> Nouvelle offre</button>}
        description="Définissez les besoins avec précision pour faire émerger les bons matchs."
        eyebrow="OPPORTUNITÉS · REST"
        title="Des rôles qui donnent envie."
      />
      {offers.isError && <ErrorBanner error={offers.error} retry={() => void offers.refetch()} />}
      <div className="toolbar">
        <div className="toolbar-group">
          <label className="search-wrap">
            <Search aria-hidden="true" size={15} />
            <span className="sr-only">Rechercher une offre</span>
            <input onChange={(event) => setSearch(event.target.value)} placeholder="Titre, description, compétence…" type="search" value={search} />
          </label>
          <span className="result-count">{filtered.length} offre{filtered.length === 1 ? "" : "s"}</span>
        </div>
      </div>
      {offers.isLoading ? (
        <Skeleton rows={5} />
      ) : filtered.length ? (
        <motion.div
          animate="visible"
          className="card-grid"
          initial="hidden"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.045 } } }}
        >
          {filtered.map((offer) => (
            <OfferCard key={offer.id} offer={offer} onDelete={() => setDeleteTarget(offer)} onEdit={() => openEdit(offer)} />
          ))}
        </motion.div>
      ) : (
        <EmptyState
          action={<button className="button button-primary" onClick={openCreate} type="button"><Plus size={14} /> Créer la première offre</button>}
          description={search ? "Aucune offre ne correspond à cette recherche." : "Créez une opportunité pour commencer à recevoir des candidatures."}
          title={search ? "Aucun résultat" : "À vous d’ouvrir le jeu"}
        />
      )}
      <SidePanel
        description="Le titre est obligatoire; les autres champs suivent le contrat REST."
        onClose={closePanel}
        open={panelOpen}
        title={editing ? "Modifier l’offre" : "Nouvelle offre"}
      >
        <OfferForm offer={editing} onSave={saveOffer} pending={save.isPending} />
      </SidePanel>
      <ConfirmDialog
        description={`Cette action supprimera l’offre « ${deleteTarget?.title ?? ""} » et ne pourra pas être annulée.`}
        onCancel={() => setDeleteTarget(undefined)}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget.id)}
        open={Boolean(deleteTarget)}
        pending={remove.isPending}
        title="Supprimer cette offre ?"
      />
    </section>
  );
}

function OfferCard({
  offer,
  onEdit,
  onDelete,
}: {
  offer: Offer;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.article
      className="glass-card entity-card"
      layout
      variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: -3, rotateX: 1.2, rotateY: -0.5 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className="entity-card-head">
        <span className="avatar offer-avatar"><BriefcaseBusiness size={17} /></span>
        <div className="entity-title">
          <h3>{offer.title}</h3>
          <p>Offre #{offer.id}</p>
        </div>
        <div className="entity-actions">
          <button aria-label={`Modifier ${offer.title}`} className="icon-action" onClick={onEdit} type="button"><Pencil size={14} /></button>
          <button aria-label={`Supprimer ${offer.title}`} className="icon-action danger" onClick={onDelete} type="button"><Trash2 size={14} /></button>
        </div>
      </div>
      <p className="entity-description">{offer.description || "Aucune description renseignée."}</p>
      <div className="entity-meta">
        {offer.requiredSkills?.length ? offer.requiredSkills.slice(0, 5).map((skill) => (
          <span className="chip chip-green" key={skill}>{skill}</span>
        )) : <span className="chip">Compétences non précisées</span>}
        {(offer.requiredSkills?.length ?? 0) > 5 && <span className="chip">+{(offer.requiredSkills?.length ?? 0) - 5}</span>}
      </div>
      <div className="entity-foot">
        <span><Clock3 size={12} /> Expérience</span>
        <strong>{offer.requiredExperienceYears ?? 0} an{offer.requiredExperienceYears === 1 ? "" : "s"}</strong>
        <span><Users size={12} /> Identifiant</span>
        <strong>#{offer.id}</strong>
      </div>
    </motion.article>
  );
}
