import React, { useState } from "react";

interface Props {
  onSubmit: (organisation: string) => Promise<string | null> | Promise<void>;
  disabled?: boolean;
  url?: string | null;
}

const OrganisationForm: React.FC<Props> = ({ onSubmit, disabled = false, url }) => {
  const [organisation, setOrganisation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisation.trim()) {
      alert("Please enter an organisation name.");
      return;
    }
    try {
      setLoading(true);
      await onSubmit(organisation);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = disabled || loading;

  return (
    <>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}
      >
        <label>
          <input
            type="text"
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
            placeholder="e.g. APE Malaysia"
            style={{ width: "80%" }}
            disabled={isDisabled}
          />
        </label>
        <button type="submit" disabled={isDisabled}>
          {loading ? "Submitting…" : "Submit"}
        </button>
      </form>

      {url && (
        <div style={{ marginTop: "0.75rem" }}>
          <a href={url} target="_blank" rel="noreferrer">Open generated sheet</a>
        </div>
      )}
    </>
  );
};

export default OrganisationForm;
