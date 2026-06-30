import React, { useEffect, useState, useCallback } from "react";
import { getValueBets } from "../api";

export default function ValueBets() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    getValueBets()
      .then((d) => { setData(d); setLastUpdated(new Date()); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const results = data?.results ?? [];

  return (
    <div>
      <h1>Value Bets</h1>
      <p className="subtitle">
        Data-driven edges — where our model disagrees with the bookmaker
      </p>

      <div className="toolbar">
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          {loading ? "Scanning…" : "Refresh"}
        </button>
        {lastUpdated && (
          <span style={{ color: "#8892a4", fontSize: 13 }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        {data && (
          <span style={{ color: "#8892a4", fontSize: 13 }}>
            {results.length} fixtures · {results.filter((r: any) => r.isLive).length} live ·{" "}
            <span style={{ color: "#34d399" }}>
              {results.reduce((n: number, r: any) => n + r.valueBets.length, 0)} value signals
            </span>
          </span>
        )}
      </div>

      {loading && <div className="loading">Analysing fixtures…</div>}
      {error && <div className="error">{error}</div>}

      {!loading && results.length === 0 && !error && (
        <div className="empty">
          <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No fixtures right now</div>
          <div style={{ color: "#8892a4", fontSize: 13, maxWidth: 360, margin: "0 auto" }}>
            EPL season runs August–May. World Cup fixtures will appear here when scheduled.
            Check back when matches are live for real-time value signals.
          </div>
        </div>
      )}

      {!loading && results.map((fixture: any) => (
        <div key={fixture.fixtureId} className="card vb-card">
          {/* Header */}
          <div className="vb-header">
            <div className="vb-league">{fixture.league.name}</div>
            {fixture.isLive ? (
              <div className="vb-live-badge">
                <span className="live-dot" /> LIVE {fixture.context.elapsed}'
              </div>
            ) : (
              <div className="vb-time">
                {new Date(fixture.commenceTime).toLocaleDateString(undefined, {
                  weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </div>
            )}
          </div>

          {/* Teams + score */}
          <div className="vb-matchup">
            <div className="vb-team">
              {fixture.homeTeam.logo && <img src={fixture.homeTeam.logo} alt="" className="team-logo" />}
              <span>{fixture.homeTeam.name}</span>
            </div>
            {fixture.isLive ? (
              <div className="vb-score">
                {fixture.context.score.home} – {fixture.context.score.away}
              </div>
            ) : (
              <div className="vb-vs">vs</div>
            )}
            <div className="vb-team vb-team-away">
              <span>{fixture.awayTeam.name}</span>
              {fixture.awayTeam.logo && <img src={fixture.awayTeam.logo} alt="" className="team-logo" />}
            </div>
          </div>

          {/* Live context row */}
          {fixture.isLive && (
            <div className="vb-context">
              {fixture.context.homeReds > 0 && <span className="context-tag red">🟥 {fixture.homeTeam.name} {fixture.context.homeReds} red</span>}
              {fixture.context.awayReds > 0 && <span className="context-tag red">🟥 {fixture.awayTeam.name} {fixture.context.awayReds} red</span>}
              {fixture.context.homeShotsOnTarget !== null && (
                <span className="context-tag">⚽ Shots on target: {fixture.context.homeShotsOnTarget} – {fixture.context.awayShotsOnTarget}</span>
              )}
              {fixture.context.homePossession && (
                <span className="context-tag">🔵 Poss: {fixture.context.homePossession} – {fixture.context.awayPossession}</span>
              )}
              <span className="context-tag">{fixture.context.timeRemaining}' remaining</span>
            </div>
          )}

          {/* Our probability model */}
          <div className="vb-probs">
            <div className="prob-bar-group">
              <div className="prob-label">{fixture.homeTeam.name.split(" ").slice(-1)[0]}</div>
              <div className="prob-bar">
                <div className="prob-fill home" style={{ width: `${fixture.probabilities.home}%` }} />
              </div>
              <div className="prob-pct">{fixture.probabilities.home}%</div>
            </div>
            <div className="prob-bar-group">
              <div className="prob-label">Draw</div>
              <div className="prob-bar">
                <div className="prob-fill draw" style={{ width: `${fixture.probabilities.draw}%` }} />
              </div>
              <div className="prob-pct">{fixture.probabilities.draw}%</div>
            </div>
            <div className="prob-bar-group">
              <div className="prob-label">{fixture.awayTeam.name.split(" ").slice(-1)[0]}</div>
              <div className="prob-bar">
                <div className="prob-fill away" style={{ width: `${fixture.probabilities.away}%` }} />
              </div>
              <div className="prob-pct">{fixture.probabilities.away}%</div>
            </div>
          </div>

          {/* Form */}
          {(fixture.form.home || fixture.form.away) && (
            <div className="vb-form-row">
              <div className="form-group">
                <span className="form-label">Home form</span>
                {fixture.form.home ? (
                  <span className="form-string">
                    {fixture.form.home.form.split("").map((c: string, i: number) => (
                      <span key={i} className={`form-char form-${c}`}>{c}</span>
                    ))}
                  </span>
                ) : <span className="form-na">—</span>}
              </div>
              {fixture.form.h2h && (
                <div className="form-group">
                  <span className="form-label">H2H (last {fixture.form.h2h.played})</span>
                  <span style={{ fontSize: 12, color: "#e2e8f0" }}>
                    {fixture.form.h2h.wins}W {fixture.form.h2h.draws}D {fixture.form.h2h.losses}L
                  </span>
                </div>
              )}
              <div className="form-group">
                <span className="form-label">Away form</span>
                {fixture.form.away ? (
                  <span className="form-string">
                    {fixture.form.away.form.split("").map((c: string, i: number) => (
                      <span key={i} className={`form-char form-${c}`}>{c}</span>
                    ))}
                  </span>
                ) : <span className="form-na">—</span>}
              </div>
            </div>
          )}

          {/* Value bets */}
          {fixture.valueBets.length > 0 ? (
            <div className="vb-signals">
              <div className="signals-label">Value signals</div>
              {fixture.valueBets.map((vb: any, i: number) => (
                <div key={i} className={`signal-card signal-${vb.strength}`}>
                  <div className="signal-left">
                    <span className={`signal-badge ${vb.strength}`}>
                      {vb.strength === "strong" ? "⚡ Strong" : "◎ Marginal"}
                    </span>
                    <span className="signal-outcome">{vb.outcome}</span>
                    <span className="signal-book">@ {vb.bookmaker}</span>
                  </div>
                  <div className="signal-right">
                    <div className="signal-odds">{vb.odds.toFixed(2)}</div>
                    <div className="signal-probs">
                      <span style={{ color: "#8892a4" }}>Book {vb.impliedProb}%</span>
                      <span style={{ color: "#34d399" }}>Our model {vb.trueProb}%</span>
                    </div>
                    <div className="signal-edge">+{vb.edge}% edge</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-signal">
              {fixture.oddsAvailable
                ? "No value detected at current odds"
                : "Odds not available for this fixture"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
