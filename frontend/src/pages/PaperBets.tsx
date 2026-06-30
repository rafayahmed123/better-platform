import React, { useEffect, useState } from "react";
import {
  getPaperBets,
  getPaperBetStats,
  placePaperBet,
  settlePaperBet,
  deletePaperBet,
} from "../api";

const empty = {
  homeTeam: "",
  awayTeam: "",
  outcome: "",
  odds: "",
  stake: "",
  bookmaker: "",
  sport: "",
};

export default function PaperBets() {
  const [bets, setBets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  const reload = () => {
    getPaperBets().then(setBets);
    getPaperBetStats().then(setStats);
  };

  useEffect(() => {
    reload();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await placePaperBet({
        ...form,
        odds: parseFloat(form.odds),
        stake: parseFloat(form.stake),
        eventId: `${form.homeTeam}-${form.awayTeam}`,
      });
      setForm(empty);
      reload();
    } finally {
      setLoading(false);
    }
  };

  const settle = async (id: number, status: string) => {
    await settlePaperBet(id, status);
    reload();
  };

  const remove = async (id: number) => {
    await deletePaperBet(id);
    reload();
  };

  const net = stats ? stats.totalProfit - stats.totalLoss : 0;

  return (
    <div>
      <h1>Paper Bets</h1>
      <p className="subtitle">
        Track virtual bets to test your edge without real money
      </p>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="label">Total Bets</div>
            <div className="value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="label">Pending</div>
            <div className="value" style={{ color: "#93c5fd" }}>
              {stats.pending}
            </div>
          </div>
          <div className="stat-card">
            <div className="label">Won</div>
            <div className="value green">{stats.wins}</div>
          </div>
          <div className="stat-card">
            <div className="label">Lost</div>
            <div className="value red">{stats.losses}</div>
          </div>
          <div className="stat-card">
            <div className="label">Total Staked</div>
            <div className="value">${(stats.totalStaked || 0).toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="label">Net P&L</div>
            <div className={`value ${net >= 0 ? "green" : "red"}`}>
              {net >= 0 ? "+" : ""}${net.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      <div className="bet-form">
        <h2>Place a Paper Bet</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label>Home Team</label>
              <input
                value={form.homeTeam}
                onChange={(e) => setForm({ ...form, homeTeam: e.target.value })}
                placeholder="Arsenal"
              />
            </div>
            <div className="form-group">
              <label>Away Team</label>
              <input
                value={form.awayTeam}
                onChange={(e) => setForm({ ...form, awayTeam: e.target.value })}
                placeholder="Chelsea"
              />
            </div>
            <div className="form-group">
              <label>Your Pick</label>
              <input
                value={form.outcome}
                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                placeholder="Arsenal"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Odds (decimal)</label>
              <input
                type="number"
                step="0.01"
                value={form.odds}
                onChange={(e) => setForm({ ...form, odds: e.target.value })}
                placeholder="1.85"
                required
              />
            </div>
            <div className="form-group">
              <label>Stake ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.stake}
                onChange={(e) => setForm({ ...form, stake: e.target.value })}
                placeholder="100"
                required
              />
            </div>
            <div className="form-group">
              <label>Bookmaker</label>
              <input
                value={form.bookmaker}
                onChange={(e) =>
                  setForm({ ...form, bookmaker: e.target.value })
                }
                placeholder="Bet365"
              />
            </div>
            <div className="form-group">
              <label>Sport</label>
              <input
                value={form.sport}
                onChange={(e) => setForm({ ...form, sport: e.target.value })}
                placeholder="soccer_epl"
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Placing..." : "Place Bet"}
          </button>
        </form>
      </div>

      {bets.length === 0 ? (
        <div className="empty">No paper bets yet. Place one above.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="bets-table">
            <thead>
              <tr>
                <th>Match</th>
                <th>Pick</th>
                <th>Odds</th>
                <th>Stake</th>
                <th>Payout</th>
                <th>Book</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bets.map((bet: any) => (
                <tr key={bet.id}>
                  <td>
                    {bet.home_team} vs {bet.away_team}
                  </td>
                  <td>{bet.outcome}</td>
                  <td>{bet.odds}</td>
                  <td>${bet.stake}</td>
                  <td>${bet.potential_payout}</td>
                  <td>{bet.bookmaker || "—"}</td>
                  <td>
                    <span className={`status-badge status-${bet.status}`}>
                      {bet.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {bet.status === "pending" && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => settle(bet.id, "won")}
                          >
                            Won
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => settle(bet.id, "lost")}
                          >
                            Lost
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => settle(bet.id, "void")}
                          >
                            Void
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => remove(bet.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
