// ─── Team form helpers ───────────────────────────────────────────────────────

function parseTeamForm(fixtures, teamId) {
  if (!fixtures.length) return null;
  let goalsFor = 0, goalsAgainst = 0, wins = 0, draws = 0, losses = 0;

  for (const f of fixtures) {
    const isHome = f.teams.home.id === teamId;
    const gf = isHome ? (f.goals.home ?? 0) : (f.goals.away ?? 0);
    const ga = isHome ? (f.goals.away ?? 0) : (f.goals.home ?? 0);
    const winner = f.teams.home.winner ? f.teams.home.id
                 : f.teams.away.winner ? f.teams.away.id : null;

    goalsFor     += gf;
    goalsAgainst += ga;
    if (winner === teamId)   wins++;
    else if (winner === null) draws++;
    else                     losses++;
  }

  const n = fixtures.length;
  return {
    played: n,
    wins, draws, losses,
    winRate:  wins  / n,
    drawRate: draws / n,
    lossRate: losses / n,
    avgGoalsFor:     goalsFor     / n,
    avgGoalsAgainst: goalsAgainst / n,
    // Last 5 form string e.g. "WWDLW"
    form: fixtures.slice().reverse().map(f => {
      const isHome = f.teams.home.id === teamId;
      const winner = f.teams.home.winner ? f.teams.home.id
                   : f.teams.away.winner ? f.teams.away.id : null;
      return winner === teamId ? 'W' : winner === null ? 'D' : 'L';
    }).join(''),
  };
}

function parseH2H(fixtures, homeTeamId) {
  if (!fixtures.length) return null;
  let wins = 0, draws = 0, losses = 0;

  for (const f of fixtures) {
    const winner = f.teams.home.winner ? f.teams.home.id
                 : f.teams.away.winner ? f.teams.away.id : null;
    if (winner === homeTeamId)   wins++;
    else if (winner === null)     draws++;
    else                          losses++;
  }

  const n = fixtures.length;
  return { played: n, wins, draws, losses,
           winRate: wins / n, drawRate: draws / n, lossRate: losses / n };
}

// ─── Base probability model ───────────────────────────────────────────────────
// Simple weighted model — form (50%), attack/defence ratio (30%), H2H (20%)

function computeBaseProbs(homeForm, awayForm, h2h) {
  const defaultProb = { home: 0.45, draw: 0.27, away: 0.28 }; // historical soccer average

  if (!homeForm || !awayForm) return defaultProb;

  const totalGoals = homeForm.avgGoalsFor + awayForm.avgGoalsFor;
  const homeAttackShare = totalGoals > 0 ? homeForm.avgGoalsFor / totalGoals : 0.5;

  let homeWin = homeForm.winRate * 0.5 + homeAttackShare * 0.3;
  let awayWin = awayForm.winRate * 0.5 + (1 - homeAttackShare) * 0.3;

  if (h2h && h2h.played >= 3) {
    homeWin = homeWin * 0.8 + h2h.winRate  * 0.2;
    awayWin = awayWin * 0.8 + h2h.lossRate * 0.2;
  }

  // Home advantage bump (~3-5% historically in soccer)
  homeWin = Math.min(homeWin + 0.04, 0.85);

  const drawProb = Math.max(0.12, 1 - homeWin - awayWin);
  const total = homeWin + awayWin + drawProb;

  return {
    home: homeWin  / total,
    draw: drawProb / total,
    away: awayWin  / total,
  };
}

// ─── Live match state adjustment ─────────────────────────────────────────────
// As time runs out, current score dominates over pre-match form

function applyLiveAdjustment(probs, fixture) {
  const status = fixture.fixture.status.short;
  const isLive = ['1H', 'HT', '2H', 'ET', 'P'].includes(status);
  if (!isLive) return probs;

  const elapsed  = fixture.fixture.status.elapsed || 0;
  const fullTime = status === 'ET' ? 120 : 90;
  const remaining = Math.max(0, fullTime - elapsed);
  const timeWeight = remaining / fullTime; // 1.0 at kickoff → 0.0 at final whistle

  const scoreDiff = (fixture.goals.home ?? 0) - (fixture.goals.away ?? 0);

  // Score-based "in-running" probabilities
  let scoreHome, scoreDraw, scoreAway;
  if (scoreDiff > 1)       { scoreHome = 0.92; scoreDraw = 0.05; scoreAway = 0.03; }
  else if (scoreDiff === 1){ scoreHome = 0.75; scoreDraw = 0.15; scoreAway = 0.10; }
  else if (scoreDiff === 0){ scoreHome = 0.37; scoreDraw = 0.26; scoreAway = 0.37; }
  else if (scoreDiff === -1){ scoreHome = 0.10; scoreDraw = 0.15; scoreAway = 0.75; }
  else                      { scoreHome = 0.03; scoreDraw = 0.05; scoreAway = 0.92; }

  // Blend: as time runs out, shift weight toward score-based probabilities
  const blendWeight = 1 - timeWeight; // 0 at kickoff → 1 at final whistle
  const home = probs.home * timeWeight + scoreHome * blendWeight;
  const draw = probs.draw * timeWeight + scoreDraw * blendWeight;
  const away = probs.away * timeWeight + scoreAway * blendWeight;
  const total = home + draw + away;

  return { home: home / total, draw: draw / total, away: away / total };
}

// ─── Live context signals ─────────────────────────────────────────────────────

function extractMatchContext(fixture, events, statistics) {
  const elapsed  = fixture.fixture.status.elapsed || 0;
  const score    = { home: fixture.goals.home ?? 0, away: fixture.goals.away ?? 0 };
  const status   = fixture.fixture.status.short;
  const isLive   = ['1H', 'HT', '2H', 'ET'].includes(status);

  // Red cards from events
  const homeReds = (events || []).filter(e => e.type === 'Card' && e.detail === 'Red Card' && e.team.id === fixture.teams.home.id).length;
  const awayReds = (events || []).filter(e => e.type === 'Card' && e.detail === 'Red Card' && e.team.id === fixture.teams.away.id).length;

  // Shots on target from statistics
  const getStat = (teamIdx, name) => {
    const team = (statistics || [])[teamIdx];
    if (!team) return null;
    const stat = team.statistics.find(s => s.type === name);
    return stat?.value ?? null;
  };

  return {
    elapsed, score, status, isLive,
    timeRemaining: Math.max(0, 90 - elapsed),
    homeReds, awayReds,
    homeShotsOnTarget:  getStat(0, 'Shots on Goal'),
    awayShotsOnTarget:  getStat(1, 'Shots on Goal'),
    homePossession:     getStat(0, 'Ball Possession'),
    awayPossession:     getStat(1, 'Ball Possession'),
  };
}

// ─── Value bet detection ──────────────────────────────────────────────────────

function findValueBets(fixture, adjustedProbs, oddsEvent) {
  if (!oddsEvent?.bestOdds) return [];
  const homeName = fixture.teams.home.name.toLowerCase();
  const awayName = fixture.teams.away.name.toLowerCase();

  const results = [];

  for (const [outcome, data] of Object.entries(oddsEvent.bestOdds)) {
    const ol = outcome.toLowerCase();
    let trueProb = null;

    if (ol === 'draw' || ol === 'tie') {
      trueProb = adjustedProbs.draw;
    } else if (
      ol.includes(homeName.split(' ')[0]) ||
      homeName.includes(ol.split(' ')[0])
    ) {
      trueProb = adjustedProbs.home;
    } else if (
      ol.includes(awayName.split(' ')[0]) ||
      awayName.includes(ol.split(' ')[0])
    ) {
      trueProb = adjustedProbs.away;
    }

    if (trueProb === null) continue;

    const impliedProb = 1 / data.price;
    const edge = trueProb - impliedProb;

    if (edge > 0.03) {
      results.push({
        outcome,
        bookmaker:        data.bookmaker,
        odds:             data.price,
        impliedProb:      parseFloat((impliedProb * 100).toFixed(1)),
        trueProb:         parseFloat((trueProb    * 100).toFixed(1)),
        edge:             parseFloat((edge        * 100).toFixed(1)),
        strength:         edge >= 0.10 ? 'strong' : 'marginal',
      });
    }
  }

  return results.sort((a, b) => b.edge - a.edge);
}

module.exports = {
  parseTeamForm,
  parseH2H,
  computeBaseProbs,
  applyLiveAdjustment,
  extractMatchContext,
  findValueBets,
};
