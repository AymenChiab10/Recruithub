import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { ApiError } from "../api/client";
import type { Candidate, CandidateRequest } from "../api/types";
import { FieldError, FormErrorBanner } from "./Feedback";
import { TagInput } from "./TagInput";
import { getFieldErrors, getFriendlyError } from "../lib/errors";

const candidateSchema = z
  .object({
    firstName: z.string().trim().min(1, "Le prénom est obligatoire."),
    lastName: z.string().trim().min(1, "Le nom est obligatoire."),
    email: z.string().trim().email("Saisissez une adresse e-mail valide."),
    skills: z.array(z.string()),
    experienceYears: z.number().int("Saisissez un nombre entier.").min(0, "Valeur minimale : 0.").optional(),
    diplomaTitle: z.string(),
    diplomaInstitution: z.string(),
    diplomaYear: z.number().int("Saisissez un nombre entier.").min(0, "Valeur minimale : 0.").optional(),
  })
  .superRefine((values, context) => {
    const hasDiplomaDetails =
      values.diplomaTitle.trim() ||
      values.diplomaInstitution.trim() ||
      values.diplomaYear !== undefined;
    if (!hasDiplomaDetails) return;
    if (!values.diplomaTitle.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le titre du diplôme est requis si le groupe est renseigné.",
        path: ["diplomaTitle"],
      });
    }
    if (!values.diplomaInstitution.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L’établissement est requis si le groupe est renseigné.",
        path: ["diplomaInstitution"],
      });
    }
    if (values.diplomaYear === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L’année est requise si le groupe est renseigné.",
        path: ["diplomaYear"],
      });
    }
  });

type CandidateFormValues = z.infer<typeof candidateSchema>;

const emptyValues: CandidateFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  skills: [],
  experienceYears: undefined,
  diplomaTitle: "",
  diplomaInstitution: "",
  diplomaYear: undefined,
};

function toValues(candidate?: Candidate): CandidateFormValues {
  return candidate
    ? {
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        skills: candidate.skills ?? [],
        experienceYears: candidate.experienceYears,
        diplomaTitle: candidate.diplomaTitle ?? "",
        diplomaInstitution: candidate.diplomaInstitution ?? "",
        diplomaYear: candidate.diplomaYear,
      }
    : emptyValues;
}

function toCandidateRequest(values: CandidateFormValues): CandidateRequest {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    ...(values.skills.length ? { skills: values.skills } : {}),
    ...(values.experienceYears !== undefined
      ? { experienceYears: values.experienceYears }
      : {}),
    ...(values.diplomaTitle.trim()
      ? {
          diplomaTitle: values.diplomaTitle.trim(),
          diplomaInstitution: values.diplomaInstitution.trim(),
          diplomaYear: values.diplomaYear,
        }
      : {}),
  };
}

interface CandidateFormProps {
  candidate?: Candidate;
  pending: boolean;
  onSave: (data: CandidateRequest) => Promise<void>;
}

export function CandidateForm({
  candidate,
  pending,
  onSave,
}: CandidateFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: toValues(candidate),
  });
  const [submissionError, setSubmissionError] = useState<unknown>();

  async function submit(values: CandidateFormValues) {
    setSubmissionError(undefined);
    try {
      await onSave(toCandidateRequest(values));
    } catch (error) {
      setSubmissionError(error);
      for (const [field, message] of Object.entries(getFieldErrors(error))) {
        if (field in emptyValues) {
          setError(field as keyof CandidateFormValues, { message });
        }
      }
      setError("root.server", { message: getFriendlyError(error, "candidate") });
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit(submit)} noValidate>
      <div className="form-grid two-columns">
        <div className="field">
          <label htmlFor="candidate-firstName">Prénom <span>*</span></label>
          <input id="candidate-firstName" autoComplete="given-name" {...register("firstName")} />
          <FieldError>{errors.firstName?.message}</FieldError>
        </div>
        <div className="field">
          <label htmlFor="candidate-lastName">Nom <span>*</span></label>
          <input id="candidate-lastName" autoComplete="family-name" {...register("lastName")} />
          <FieldError>{errors.lastName?.message}</FieldError>
        </div>
      </div>
      {!candidate && (
        <button
          className="button button-quiet demo-fill"
          onClick={() =>
            reset({
              ...emptyValues,
              firstName: "Demo",
              lastName: "Candidate",
              email: "demo@example.test",
              diplomaTitle: "Computer Science",
              diplomaInstitution: "IIT",
              diplomaYear: 2024,
            })
          }
          type="button"
        >
          Remplir avec le candidat de démo
        </button>
      )}
      <div className="field">
        <label htmlFor="candidate-email">E-mail <span>*</span></label>
        <input id="candidate-email" autoComplete="email" type="email" {...register("email")} />
        <FieldError>{errors.email?.message}</FieldError>
      </div>
      <Controller
        control={control}
        name="skills"
        render={({ field }) => (
          <TagInput
            id="candidate-skills"
            label="Compétences"
            onChange={field.onChange}
            value={field.value}
          />
        )}
      />
      <div className="field">
        <label htmlFor="candidate-experience">Années d’expérience</label>
        <input
          id="candidate-experience"
          min="0"
          placeholder="Ex. 4"
          type="number"
          {...register("experienceYears", {
            setValueAs: (value: string) => value === "" ? undefined : Number(value),
          })}
        />
        <FieldError>{errors.experienceYears?.message}</FieldError>
      </div>
      <div className="form-section-label">
        <span>Diplôme</span>
        <span>OPTIONNEL</span>
      </div>
      <div className="field">
        <label htmlFor="candidate-diplomaTitle">Titre du diplôme</label>
        <input id="candidate-diplomaTitle" placeholder="Computer Science" {...register("diplomaTitle")} />
        <FieldError>{errors.diplomaTitle?.message}</FieldError>
      </div>
      <div className="form-grid two-columns">
        <div className="field">
          <label htmlFor="candidate-diplomaInstitution">Établissement</label>
          <input id="candidate-diplomaInstitution" placeholder="IIT" {...register("diplomaInstitution")} />
          <FieldError>{errors.diplomaInstitution?.message}</FieldError>
        </div>
        <div className="field">
          <label htmlFor="candidate-diplomaYear">Année</label>
          <input
            id="candidate-diplomaYear"
            min="0"
            placeholder="2024"
            type="number"
            {...register("diplomaYear", {
              setValueAs: (value: string) => value === "" ? undefined : Number(value),
            })}
          />
          <FieldError>{errors.diplomaYear?.message}</FieldError>
        </div>
      </div>
      <p className="field-hint">
        Le registre vérifie le nom complet, le diplôme, l’établissement et l’année.
      </p>
      <FieldError>{errors.root?.server?.message}</FieldError>
      {submissionError instanceof ApiError &&
        [0, 502, 503].includes(submissionError.status) && (
          <FormErrorBanner
            error={submissionError}
            retry={() => void handleSubmit(submit)()}
          />
        )}
      <button className="button button-primary button-wide" disabled={pending} type="submit">
        {pending ? "Enregistrement…" : candidate ? "Enregistrer les modifications" : "Créer le candidat"}
      </button>
    </form>
  );
}
