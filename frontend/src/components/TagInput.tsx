import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  id: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  hint?: string;
}

export function TagInput({
  id,
  label,
  value,
  onChange,
  hint = "Entrée ou virgule pour ajouter",
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addTag(rawValue: string) {
    const tag = rawValue.trim();
    if (tag && !value.some((current) => current.toLowerCase() === tag.toLowerCase())) {
      onChange([...value, tag]);
    }
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
    }
    if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="tagbox">
        {value.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
            <button
              aria-label={`Retirer ${tag}`}
              className="tag-remove"
              onClick={() => onChange(value.filter((current) => current !== tag))}
              type="button"
            >
              <X size={13} />
            </button>
          </span>
        ))}
        <input
          autoComplete="off"
          id={id}
          onBlur={() => draft && addTag(draft)}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length ? "Ajouter…" : "Ex. Java, React"}
          value={draft}
        />
      </div>
      <span className="field-hint">{hint}</span>
    </div>
  );
}
