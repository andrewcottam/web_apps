import React, { useState } from "react";

interface Props {
  onSubmit: (siteIds: string[]) => Promise<string | null> | Promise<void>;
  disabled?: boolean;
  url?: string | null;
}

const SiteIdsForm: React.FC<Props> = ({ onSubmit, disabled = false, url }) => {
  const [siteIdsInput, setSiteIdsInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ids = siteIdsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    console.log("Raw input:", siteIdsInput);
    console.log("Parsed IDs:", ids);
    console.log("Number of IDs:", ids.length);
    if (ids.length === 0) {
      alert("Please enter at least one site ID.");
      return;
    }
    try {
      setLoading(true);
      await onSubmit(ids);
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
            value={siteIdsInput}
            onChange={(e) => setSiteIdsInput(e.target.value)}
            placeholder="e.g. 123, 456, 789"
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

export default SiteIdsForm;
