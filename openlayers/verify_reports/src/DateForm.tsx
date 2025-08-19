import React, { useState } from 'react';

export interface DateFormProps {
  onSubmit: (startDate: string, endDate: string) => Promise<string | null>;
}

const formatDate = (date: Date): string =>
  date.toISOString().slice(0, 10); // "YYYY-MM-DD"

const DateForm: React.FC<DateFormProps> = ({ onSubmit }) => {
  const today = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 7);

  const [startDate, setStartDate] = useState(formatDate(oneWeekAgo));
  const [endDate, setEndDate] = useState(formatDate(today));
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!startDate || !endDate) {
      alert('Please enter both dates');
      return;
    }

    setLoading(true);
    const url = await onSubmit(startDate, endDate);
    setResultUrl(url);
    setLoading(false);
  };

  return (
    <div
      style={{
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <h2>Select Dates</h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxWidth: '300px',
          width: '100%',
        }}
      >
        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <button onClick={handleClick} disabled={loading}>
          {loading ? 'Submitting…' : 'Submit'}
        </button>

        {resultUrl && (
          <div style={{ marginTop: '1rem', wordBreak: 'break-all' }}>
            Sheet created: <br />
            <a href={resultUrl} target="_blank" rel="noopener noreferrer">
              {resultUrl}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateForm;
