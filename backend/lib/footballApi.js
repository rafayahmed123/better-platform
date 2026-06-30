const axios = require('axios');

const client = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: { 'x-apisports-key': process.env.FOOTBALL_API_KEY },
});

// In-memory cache — keyed by string, stores { data, ts }
const cache = new Map();
function cached(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) return Promise.resolve(hit.data);
  return fn().then(data => { cache.set(key, { data, ts: Date.now() }); return data; });
}

const TTL = {
  LIVE:       30_000,       // 30s  — live match state
  UPCOMING:   5 * 60_000,   // 5m   — fixture schedule
  FORM:       30 * 60_000,  // 30m  — recent team form
  H2H:        60 * 60_000,  // 1h   — head to head
  PLAYER:     60 * 60_000,  // 1h   — player stats
};

// League IDs that map to our supported sports
const LEAGUES = {
  soccer_epl:            { id: 39,  season: 2025 },
  soccer_fifa_world_cup: { id: 1,   season: 2026 },
};

async function getLiveFixtures(leagueId) {
  return cached(`live:${leagueId}`, TTL.LIVE, async () => {
    const res = await client.get('/fixtures', { params: { live: 'all', league: leagueId } });
    return res.data.response;
  });
}

async function getUpcomingFixtures(leagueId, season) {
  return cached(`upcoming:${leagueId}:${season}`, TTL.UPCOMING, async () => {
    const res = await client.get('/fixtures', { params: { league: leagueId, season, next: 10 } });
    return res.data.response;
  });
}

async function getFixtureEvents(fixtureId) {
  return cached(`events:${fixtureId}`, TTL.LIVE, async () => {
    const res = await client.get('/fixtures/events', { params: { fixture: fixtureId } });
    return res.data.response;
  });
}

async function getFixtureStatistics(fixtureId) {
  return cached(`fixtStats:${fixtureId}`, TTL.LIVE, async () => {
    const res = await client.get('/fixtures/statistics', { params: { fixture: fixtureId } });
    return res.data.response;
  });
}

async function getTeamForm(teamId, leagueId, season) {
  return cached(`form:${teamId}:${leagueId}:${season}`, TTL.FORM, async () => {
    const res = await client.get('/fixtures', {
      params: { team: teamId, league: leagueId, season, last: 5 },
    });
    return res.data.response;
  });
}

async function getH2H(teamAId, teamBId) {
  const key = [teamAId, teamBId].sort().join('-');
  return cached(`h2h:${key}`, TTL.H2H, async () => {
    const res = await client.get('/fixtures/headtohead', {
      params: { h2h: `${teamAId}-${teamBId}`, last: 10 },
    });
    return res.data.response;
  });
}

async function getPlayerStats(playerId, leagueId, season) {
  return cached(`player:${playerId}:${leagueId}:${season}`, TTL.PLAYER, async () => {
    const res = await client.get('/players', {
      params: { id: playerId, league: leagueId, season },
    });
    return res.data.response[0] || null;
  });
}

async function getSquad(teamId) {
  return cached(`squad:${teamId}`, TTL.FORM, async () => {
    const res = await client.get('/players/squads', { params: { team: teamId } });
    return res.data.response[0]?.players || [];
  });
}

module.exports = {
  getLiveFixtures,
  getUpcomingFixtures,
  getFixtureEvents,
  getFixtureStatistics,
  getTeamForm,
  getH2H,
  getPlayerStats,
  getSquad,
  LEAGUES,
};
