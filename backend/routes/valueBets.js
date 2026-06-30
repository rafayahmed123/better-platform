const express = require('express');
const router = express.Router();

const {
  getLiveFixtures,
  getUpcomingFixtures,
  getFixtureEvents,
  getFixtureStatistics,
  getTeamForm,
  getH2H,
  LEAGUES,
} = require('../lib/footballApi');

const { getOdds } = require('../lib/oddsApi');
const { getBestOddsPerEvent } = require('../lib/arbitrage');
const {
  parseTeamForm,
  parseH2H,
  computeBaseProbs,
  applyLiveAdjustment,
  extractMatchContext,
  findValueBets,
} = require('../lib/valueBets');

// Fuzzy match a fixture to an odds event by team name
function matchOddsEvent(fixture, oddsEvents) {
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const h = normalize(fixture.teams.home.name);
  const a = normalize(fixture.teams.away.name);

  return oddsEvents.find(e => {
    const eh = normalize(e.homeTeam);
    const ea = normalize(e.awayTeam);
    return (h.includes(eh.slice(0, 5)) || eh.includes(h.slice(0, 5))) &&
           (a.includes(ea.slice(0, 5)) || ea.includes(a.slice(0, 5)));
  }) || null;
}

router.get('/', async (req, res) => {
  try {
    const output = [];

    for (const [sportKey, { id: leagueId, season }] of Object.entries(LEAGUES)) {
      // Fetch live + upcoming fixtures in parallel
      const [liveFixtures, upcomingFixtures] = await Promise.all([
        getLiveFixtures(leagueId),
        getUpcomingFixtures(leagueId, season),
      ]);

      // Live first, then upcoming — cap at 8 per league to protect API quota
      const fixtures = [
        ...liveFixtures,
        ...upcomingFixtures.filter(f => !liveFixtures.find(l => l.fixture.id === f.fixture.id)),
      ].slice(0, 8);

      if (fixtures.length === 0) continue;

      // Fetch odds for this sport (fail gracefully)
      let oddsEvents = [];
      try {
        const raw = await getOdds(sportKey, { regions: 'us,uk,eu' });
        oddsEvents = getBestOddsPerEvent(raw);
      } catch (_) {}

      for (const fixture of fixtures) {
        const homeId = fixture.teams.home.id;
        const awayId = fixture.teams.away.id;
        const isLive = ['1H', 'HT', '2H', 'ET', 'P'].includes(fixture.fixture.status.short);

        // Fetch form, H2H, and (if live) events + stats in parallel
        const [homeForm, awayForm, h2h, events, statistics] = await Promise.all([
          getTeamForm(homeId, leagueId, season),
          getTeamForm(awayId, leagueId, season),
          getH2H(homeId, awayId),
          isLive ? getFixtureEvents(fixture.fixture.id)     : Promise.resolve([]),
          isLive ? getFixtureStatistics(fixture.fixture.id) : Promise.resolve([]),
        ]);

        const homeStats = parseTeamForm(homeForm, homeId);
        const awayStats = parseTeamForm(awayForm, awayId);
        const h2hStats  = parseH2H(h2h, homeId);
        const context   = extractMatchContext(fixture, events, statistics);

        const baseProbs     = computeBaseProbs(homeStats, awayStats, h2hStats);
        const adjustedProbs = applyLiveAdjustment(baseProbs, fixture);

        const oddsEvent  = matchOddsEvent(fixture, oddsEvents);
        const valueBets  = findValueBets(fixture, adjustedProbs, oddsEvent);

        output.push({
          fixtureId:   fixture.fixture.id,
          league:      { id: leagueId, sportKey, name: sportKey === 'soccer_epl' ? 'EPL' : 'FIFA World Cup' },
          homeTeam:    { name: fixture.teams.home.name, logo: fixture.teams.home.logo },
          awayTeam:    { name: fixture.teams.away.name, logo: fixture.teams.away.logo },
          commenceTime: fixture.fixture.date,
          isLive,
          context,
          form: {
            home: homeStats,
            away: awayStats,
            h2h:  h2hStats,
          },
          probabilities: {
            home: parseFloat((adjustedProbs.home * 100).toFixed(1)),
            draw: parseFloat((adjustedProbs.draw * 100).toFixed(1)),
            away: parseFloat((adjustedProbs.away * 100).toFixed(1)),
          },
          oddsAvailable: !!oddsEvent,
          valueBets,
        });
      }
    }

    // Sort: live first, then by most value bets, then by time
    output.sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      if (b.valueBets.length !== a.valueBets.length) return b.valueBets.length - a.valueBets.length;
      return new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime();
    });

    res.json({ count: output.length, results: output });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
