import React, { useEffect, useState, useCallback } from "react";
import { getSports, getOdds } from "../api";
import DataFreshness from "../components/DataFreshness";
import DateFilter from "../components/DateFilter";
import BookmakerSelector from "../components/BookmakerSelector";
import {
  ALLOWED_SPORT_KEYS,
  DEFAULT_SPORT,
  DEFAULT_BOOKMAKERS,
} from "../constants";

const today = () => new Date().toISOString().slice(0, 10);

export default function LiveOdds() {
  const [sports, setSports] = useState<any[]>([]);
  const [sport, setSport] = useState(DEFAULT_SPORT);
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());
  const [bookmakers, setBookmakers] = useState<string[]>(DEFAULT_BOOKMAKERS);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    getSports().then((data) =>
      setSports(
        data.filter((s: any) => s.active && ALLOWED_SPORT_KEYS.includes(s.key))
      )
    );
  }, []);

  const load = useCallback(() => {
    if (bookmakers.length === 0) {
      setEvents([]);
      return;
    }
    setLoading(true);
    setError("");
    getOdds(sport, dateFrom || undefined, dateTo || undefined, bookmakers)
      .then((data) => {
        setEvents(data);
        setLastUpdated(new Date());
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sport, dateFrom, dateTo, bookmakers]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1>Live Odds</h1>
      <p className="subtitle">Best available odds across selected bookmakers</p>

      <div className="toolbar">
        <select
          className="sport-select"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
        >
          {sports.map((s: any) => (
            <option key={s.key} value={s.key}>
              {s.title}
            </option>
          ))}
        </select>
        <BookmakerSelector selected={bookmakers} onChange={setBookmakers} />
      </div>

      <div className="toolbar">
        <DateFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={(f, t) => {
            setDateFrom(f);
            setDateTo(t);
          }}
        />
      </div>

      <div className="toolbar">
        <DataFreshness
          lastUpdated={lastUpdated}
          onRefresh={load}
          loading={loading}
        />
      </div>

      {loading && <div className="loading">Loading odds...</div>}
      {error && <div className="error">{error}</div>}

      {!loading &&
        events.map((event) => (
          <div key={event.id} className="card">
            <div className="card-header">
              <div>
                <div className="matchup">
                  {event.homeTeam} vs {event.awayTeam}
                </div>
                <div className="meta">
                  {new Date(event.commenceTime).toLocaleString()} ·{" "}
                  {event.bookmakerCount} bookmakers
                </div>
              </div>
            </div>
            <div className="odds-grid">
              {Object.entries(event.bestOdds).map(
                ([outcome, data]: [string, any]) => (
                  <div key={outcome} className="odds-pill">
                    <div className="outcome">{outcome}</div>
                    <div className="price">{data.price.toFixed(2)}</div>
                    <div className="book">{data.bookmaker}</div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}

      {!loading && events.length === 0 && !error && (
        <div className="empty">
          No events found for this sport and date range.
        </div>
      )}
    </div>
  );
}
