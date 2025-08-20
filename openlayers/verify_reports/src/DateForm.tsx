// DateForm.tsx
import React, { useMemo, useState, useEffect } from "react";

interface Props {
  onSubmit: (startDate: string, endDate: string) => Promise<string | null> | Promise<void>;
  disabled?: boolean;
  /** Optional defaults. If not provided, uses [today-7d, today] in local time. */
  defaultStart?: string; // "YYYY-MM-DD"
  defaultEnd?: string;   // "YYYY-MM-DD"
}

// Format a Date to "YYYY-MM-DD" in **local** time (avoids UTC shift issues)
function toLocalDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DateForm: React.FC<Props> = ({ onSubmit, disabled = false, defaultStart, defaultEnd }) => {
  // Compute sensible defaults once
  const { startDefault, endDefault } = useMemo(() => {
    const end = defaultEnd ?? toLocalDateInputValue(new Date());
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const start = defaultStart ?? toLocalDateInputValue(startDate);
    return { startDefault: start, endDefault: end };
  }, [defaultStart, defaultEnd]);

  const [start, setStart] = useState(startDefault);
  const [end, setEnd] = useState(endDefault);
  const [loading, setLoading] = useState(false);

  // If the default props change (unlikely), sync state
  useEffect(() => setStart(startDefault), [startDefault]);
  useEffect(() => setEnd(endDefault), [endDefault]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmit(start, end);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = disabled || loading;

  return (
    <form
      onSubmit={handle}
      style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 300, width: "100%" }}
    >
      <label>
        Start Date:
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          disabled={isDisabled}
        />
      </label>
      <label>
        End Date:
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          disabled={isDisabled}
        />
      </label>
      <button type="submit" disabled={isDisabled}>
        {loading ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
};

export default DateForm;
