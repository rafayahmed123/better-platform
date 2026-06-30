const express = require('express');
const router = express.Router();
const { getOdds } = require('../lib/oddsApi');
const { detectArbitrage } = require('../lib/arbitrage');

router.get('/:sport', async (req, res) => {
  try {
    const { dateFrom, dateTo, bookmakers } = req.query;
    const bmList = bookmakers ? bookmakers.split(',').filter(Boolean) : undefined;
    const events = await getOdds(req.params.sport, { dateFrom, dateTo, bookmakers: bmList });
    const opportunities = detectArbitrage(events, bmList);
    res.json({
      sport: req.params.sport,
      scanned: events.length,
      found: opportunities.length,
      opportunities,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
