function findBestOdds(event, allowedBookmakers) {
  const outcomes = {};

  for (const bookmaker of event.bookmakers) {
    // Skip bookmakers not in the allowed list (when a filter is active)
    if (allowedBookmakers && !allowedBookmakers.includes(bookmaker.key)) continue;

    for (const market of bookmaker.markets) {
      if (market.key !== 'h2h') continue;
      for (const outcome of market.outcomes) {
        const name = outcome.name;
        if (!outcomes[name] || outcome.price > outcomes[name].price) {
          outcomes[name] = { price: outcome.price, bookmaker: bookmaker.title };
        }
      }
    }
  }

  return outcomes;
}

function detectArbitrage(events, allowedBookmakers) {
  const opportunities = [];

  for (const event of events) {
    if (!event.bookmakers || event.bookmakers.length === 0) continue;

    const bestOdds = findBestOdds(event, allowedBookmakers);
    const outcomeNames = Object.keys(bestOdds);
    if (outcomeNames.length < 2) continue;

    const impliedSum = outcomeNames.reduce((sum, name) => {
      return sum + 1 / bestOdds[name].price;
    }, 0);

    const profitMargin = 1 - impliedSum;

    if (profitMargin > 0) {
      opportunities.push({
        id: event.id,
        sport: event.sport_key,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        commenceTime: event.commence_time,
        profitMargin: parseFloat((profitMargin * 100).toFixed(3)),
        impliedSum: parseFloat(impliedSum.toFixed(4)),
        bestOdds,
        stakes: calculateStakes(bestOdds, 100),
      });
    }
  }

  return opportunities.sort((a, b) => b.profitMargin - a.profitMargin);
}

function calculateStakes(bestOdds, totalStake) {
  const outcomes = Object.keys(bestOdds);
  const impliedSum = outcomes.reduce((s, n) => s + 1 / bestOdds[n].price, 0);

  return outcomes.reduce((acc, name) => {
    const stake = (totalStake / bestOdds[name].price) / impliedSum;
    acc[name] = {
      stake: parseFloat(stake.toFixed(2)),
      bookmaker: bestOdds[name].bookmaker,
      odds: bestOdds[name].price,
      payout: parseFloat((stake * bestOdds[name].price).toFixed(2)),
    };
    return acc;
  }, {});
}

function getBestOddsPerEvent(events, allowedBookmakers) {
  return events.map(event => {
    const filteredBookmakers = allowedBookmakers
      ? event.bookmakers.filter(b => allowedBookmakers.includes(b.key))
      : event.bookmakers;

    return {
      id: event.id,
      sport: event.sport_key,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      commenceTime: event.commence_time,
      bestOdds: findBestOdds(event, allowedBookmakers),
      bookmakerCount: filteredBookmakers.length,
    };
  });
}

module.exports = { detectArbitrage, getBestOddsPerEvent };
