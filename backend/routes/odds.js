const express = require('express');
const router = express.Router();
const { getSports, getOdds } = require('../lib/oddsApi');
const { getBestOddsPerEvent } = require('../lib/arbitrage');

router.get('/sports', async (req, res) => {
  try {
    const sports = await getSports();
    res.json(sports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:sport', async (req, res) => {
  try {
    const { dateFrom, dateTo, bookmakers } = req.query;
    const bmList = bookmakers ? bookmakers.split(',').filter(Boolean) : undefined;
    const events = await getOdds(req.params.sport, { dateFrom, dateTo, bookmakers: bmList });
    const best = getBestOddsPerEvent(events, bmList);
    res.json(best);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
