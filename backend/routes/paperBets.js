const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  const bets = db.prepare('SELECT * FROM paper_bets ORDER BY created_at DESC').all();
  res.json(bets);
});

router.post('/', (req, res) => {
  const { eventId, homeTeam, awayTeam, outcome, odds, stake, bookmaker, sport } = req.body;
  if (!outcome || !odds || !stake) {
    return res.status(400).json({ error: 'outcome, odds, and stake are required' });
  }
  const stmt = db.prepare(`
    INSERT INTO paper_bets (event_id, home_team, away_team, outcome, odds, stake, potential_payout, bookmaker, sport, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);
  const result = stmt.run(eventId, homeTeam, awayTeam, outcome, odds, stake, +(stake * odds).toFixed(2), bookmaker, sport);
  res.json({ id: result.lastInsertRowid, message: 'Bet placed' });
});

router.patch('/:id/result', (req, res) => {
  const { status } = req.body; // 'won' | 'lost' | 'void'
  if (!['won', 'lost', 'void'].includes(status)) {
    return res.status(400).json({ error: 'status must be won, lost, or void' });
  }
  db.prepare('UPDATE paper_bets SET status = ?, settled_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, req.params.id);
  res.json({ message: 'Bet settled' });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM paper_bets WHERE id = ?').run(req.params.id);
  res.json({ message: 'Bet deleted' });
});

router.get('/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(stake) as totalStaked,
      SUM(CASE WHEN status = 'won' THEN potential_payout - stake ELSE 0 END) as totalProfit,
      SUM(CASE WHEN status = 'lost' THEN stake ELSE 0 END) as totalLoss,
      SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM paper_bets
  `).get();
  res.json(stats);
});

module.exports = router;
