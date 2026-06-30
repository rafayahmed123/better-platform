import React, { useEffect, useState, useCallback } from "react";
import { getSports, getArbitrage } from "../api";
import DataFreshness from "../components/DataFreshness";
import DateFilter from "../components/DateFilter";
import BookmakerSelector from "../components/BookmakerSelector";
import {
  ALLOWED_SPORT_KEYS,
  DEFAULT_SPORT,
  DEFAULT_BOOKMAKERS,
} from "../constants";

const today = () => new Date().toISOString().slice(0, 10);

export default function Arbitrage() {
  const [sports, setSports] = useState<any[]>([]);
  const [sport, setSport] = useState(DEFAULT_SPORT);
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());
  const [bookmakers, setBookmakers] = useState<string[]>(DEFAULT_BOOKMAKERS);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [minProfit, setMinProfit] = useState(0);
  const [sortBy, setSortBy] = useState<"profit" | "date">("profit");

  useEffect(() => {
    getSports().then((data) =>
      setSports(
        data.filter((s: any) => s.active && ALLOWED_SPORT_KEYS.includes(s.key))
      )
    );
  }, []);

  const scan = useCallback(() => {
    if (bookmakers.length === 0) { setResult(null); return; }
    setLoading(true);
    setError("");
    getArbitrage(sport, dateFrom || undefined, dateTo || undefined, bookmakers)
      .then((data) => { setResult(data); setLastUpdated(new Date()); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sport, dateFrom, dateTo, bookmakers]);

  useEffect(() => { scan(); }, [scan]);

  const opportunities = result?.opportunities ?? [];
  const visible = opportunities
    .filter((o: any) => o.profitMargin >= minProfit)
    .sort((a: any, b: any) =>
      sortBy === "profit"
        ? b.profitMargin - a.profitMargin
        : new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime()
    );

  return (
    <div>
      <h1>Arbitrage Scanner</h1>
      <p className="subtitle">Guaranteed profit opportunities across bookmakers</p>

      {/* ── Row 1: sport + bookmakers ── */}
      <div className="toolbar">
        <select className="sport-select" value={sport} onChange={(e) => setSport(e.target.value)}>
          {sports.map((s: any) => (
            <option key={s.key} value={s.key}>{s.title}</option>
          ))}
        </select>
        <BookmakerSelector selected={bookmakers} onChange={setBookmakers} />
      </div>

      {/* ── Row 2: date range ── */}
      <div className="toolbar">
        <DateFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
        />
      </div>

      {/* ── Row 3: refresh + scan summary ── */}
      <div className="toolbar">
        <DataFreshness lastUpdated={lastUpdated} onRefresh={scan} loading={loading} />
        {result && (
          <span style={{ color: "#8892a4", fontSize: 13 }}>
            Scanned {result.scanned} events ·{" "}
            <span style={{ color: result.found > 0 ? "#34d399" : "#8892a4" }}>
              {result.found} {result.found === 1 ? "opportunity" : "opportunities"} found
            </span>
          </span>
        )}
      </div>

      {loading && <div className="loading">Scanning markets...</div>}
      {error && <div className="error">{error}</div>}

      {/* ── Results controls — only shown when there's something to sort/filter ── */}
      {!loading && opportunities.length > 0 && (
        <div className="results-controls">
          <div className="results-controls-left">
            <span className="results-label">
              {visible.length} of {opportunities.length} shown
            </span>
            <div className="sort-tabs">
              <button
                className={`sort-tab ${sortBy === "profit" ? "active" : ""}`}
                onClick={() => setSortBy("profit")}
              >
                Best profit
              </button>
              <button
                className={`sort-tab ${sortBy === "date" ? "active" : ""}`}
                onClick={() => setSortBy("date")}
              >
                Soonest first
              </button>
            </div>
          </div>
          <div className="results-controls-right">
            <span style={{ color: "#8892a4", fontSize: 12 }}>Min profit</span>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={minProfit}
              onChange={(e) => setMinProfit(parseFloat(e.target.value))}
              style={{ width: 90, accentColor: "#7c6af5" }}
            />
            <span className="profit-value">{minProfit.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {!loading && result && opportunities.length === 0 && (
        <div className="empty">No arbitrage opportunities found for this date range.</div>
      )}
      {!loading && opportunities.length > 0 && visible.length === 0 && (
        <div className="empty">
          No opportunities above {minProfit.toFixed(1)}% — lower the slider to see more.
        </div>
      )}

      {!loading && visible.map((opp: any) => (
        <div key={opp.id} className="card">
          <div className="card-header">
            <div>
              <div className="matchup">{opp.homeTeam} vs {opp.awayTeam}</div>
              <div className="meta">{new Date(opp.commenceTime).toLocaleString()}</div>
            </div>
            <span className="arb-badge">+{opp.profitMargin}% profit</span>
          </div>

          <div className="odds-grid">
            {Object.entries(opp.bestOdds).map(([outcome, data]: [string, any]) => (
              <div key={outcome} className="odds-pill">
                <div className="outcome">{outcome}</div>
                <div className="price">{data.price.toFixed(2)}</div>
                <div className="book">{data.bookmaker}</div>
              </div>
            ))}
          </div>

          <div className="stakes-grid">
            {Object.entries(opp.stakes).map(([outcome, s]: [string, any]) => (
              <div key={outcome} className="stake-item">
                <div className="outcome">{outcome} @ {s.bookmaker}</div>
                <div className="stake-amount">${s.stake} stake</div>
                <div className="payout">Payout: ${s.payout}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
