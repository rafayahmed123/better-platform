import React from "react";

interface Props {
  dateFrom: string;
  dateTo: string;
  onChange: (dateFrom: string, dateTo: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const offset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export default function DateFilter({ dateFrom, dateTo, onChange }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <input
        type="date"
        className="sport-select"
        style={{ minWidth: 140 }}
        value={dateFrom}
        onChange={(e) => onChange(e.target.value, dateTo)}
      />
      <span style={{ color: "#8892a4", fontSize: 13 }}>to</span>
      <input
        type="date"
        className="sport-select"
        style={{ minWidth: 140 }}
        value={dateTo}
        onChange={(e) => onChange(dateFrom, e.target.value)}
      />
      <div style={{ display: "flex", gap: 4 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onChange(today(), today())}
        >
          Today
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onChange(today(), offset(3))}
        >
          +3 days
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onChange(today(), offset(7))}
        >
          +7 days
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onChange("", "")}
        >
          All
        </button>
      </div>
    </div>
  );
}
