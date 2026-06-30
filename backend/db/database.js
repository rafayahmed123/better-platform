const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'better.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS paper_bets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT,
    home_team TEXT,
    away_team TEXT,
    outcome TEXT NOT NULL,
    odds REAL NOT NULL,
    stake REAL NOT NULL,
    potential_payout REAL NOT NULL,
    bookmaker TEXT,
    sport TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    settled_at DATETIME
  )
`);

module.exports = db;
