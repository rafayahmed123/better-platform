import React, { useState } from "react";
import { BOOKMAKERS } from "../constants";

interface Props {
  selected: string[];
  onChange: (keys: string[]) => void;
}

const REGIONS = ["US", "UK", "EU"];

export default function BookmakerSelector({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const toggle = (key: string) => {
    onChange(
      selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key]
    );
  };

  const toggleAll = () => {
    onChange(
      selected.length === BOOKMAKERS.length ? [] : BOOKMAKERS.map((b) => b.key)
    );
  };

  return (
    <div className="bookmaker-selector">
      <button className="bm-toggle-btn" onClick={() => setOpen((o) => !o)}>
        <span className="bm-icon">📚</span>
        <span>Bookmakers</span>
        <span className="bm-count">
          {selected.length} / {BOOKMAKERS.length}
        </span>
        <span className="bm-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="bm-panel">
          <div className="bm-panel-header">
            <span style={{ color: "#8892a4", fontSize: 13 }}>
              Select which books to include
            </span>
            <button className="btn btn-ghost btn-sm" onClick={toggleAll}>
              {selected.length === BOOKMAKERS.length
                ? "Deselect all"
                : "Select all"}
            </button>
          </div>

          {REGIONS.map((region) => {
            const books = BOOKMAKERS.filter((b) => b.region === region);
            return (
              <div key={region} className="bm-region">
                <div className="bm-region-label">{region}</div>
                <div className="bm-chips">
                  {books.map((b) => (
                    <button
                      key={b.key}
                      className={`bm-chip ${
                        selected.includes(b.key) ? "active" : ""
                      }`}
                      onClick={() => toggle(b.key)}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
