import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { ApiError } from "../api/client";
import type { Offer, OfferRequest } from "../api/types";
import { FieldError, FormErrorBanner } from "./Feedback";
import { TagInput } from "./TagInput";
import { getFieldErrors, getFriendlyError } from "../lib/errors";

const offerSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire."),
  description: z.string(),
  requiredSkills: z.array(z.string()),
  requiredExperienceYears: z.number().int("Saisissez un nombre entier.").min(0, "Valeur minimale : 0.").optional(),
});
type OfferFormValues = z.infer<typeof offerSchema>;

interface OfferFormProps {
  offer?: Offer;
  pending: boolean;
  onSave: (data: OfferRequest) => Promise<void>;
}

export function OfferForm({
  offer,
  pending,
  onSave,
}: OfferFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      title: offer?.title ?? "",
      description: offer?.description ?? "",
      requiredSkills: offer?.requiredSkills ?? [],
      requiredExperienceYears: offer?.requiredExperienceYears,
    },
  });
  const [submissionError, setSubmissionError] = useState<unknown>();

  async function submit(values: OfferFormValues) {
    setSubmissionError(undefined);
    try {
      await onSave({
        title: values.title.trim(),
        ...(values.description.trim() ? { description: values.description.trim() } : {}),
        ...(values.requiredSkills.length
          ? { requiredSkills: values.requiredSkills }
          : {}),
        ...(values.requiredExperienceYears !== undefined
          ? { requiredExperienceYears: values.requiredExperienceYears }
          : {}),
      });
    } catch (error) {
      setSubmissionError(error);
      for (const [field, message] of Object.entries(getFieldErrors(error))) {
        if (field in values) {
          setError(field as keyof OfferFormValues, { message });
        }
      }
      setError("root.server", { message: getFriendlyError(error) });
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit(submit)} noValidate>
      <div className="field">
        <label htmlFor="offer-title">Titre <span>*</span></label>
        <input id="offer-title" placeholder="Développeur·euse backend" {...register("title")} />
        <FieldError>{errors.title?.message}</FieldError>
      </div>
      <div className="field">
        <label htmlFor="offer-description">Description</label>
        <textarea id="offer-description" placeholder="Présentez le rôle et son impact…" rows={5} {...register("description")} />
        <FieldError>{errors.description?.message}</FieldError>
      </div>
      <Controller
        control={control}
        name="requiredSkills"
        render={({ field }) => (
          <TagInput
            id="offer-skills"
            label="Compétences requises"
            onChange={field.onChange}
            value={field.value}
          />
        )}
      />
      <div className="field">
        <label htmlFor="offer-experience">Expérience requise (années)</label>
        <input
          id="offer-experience"
          min="0"
          placeholder="Ex. 3"
          type="number"
          {...register("requiredExperienceYears", {
            setValueAs: (value: string) => value === "" ? undefined : Number(value),
          })}
        />
        <FieldError>{errors.requiredExperienceYears?.message}</FieldError>
      </div>
      <FieldError>{errors.root?.server?.message}</FieldError>
      {submissionError instanceof ApiError &&
        [0, 502, 503].includes(submissionError.status) && (
          <FormErrorBanner
            error={submissionError}
            retry={() => void handleSubmit(submit)()}
          />
        )}
      <button className="button button-primary button-wide" disabled={pending} type="submit">
        {pending ? "Enregistrement…" : offer ? "Enregistrer les modifications" : "Créer l’offre"}
      </button>
    </form>
  );
}
