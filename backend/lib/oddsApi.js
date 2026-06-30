const axios = require('axios');

const BASE_URL = 'https://api.the-odds-api.com/v4';
const API_KEY = process.env.ODDS_API_KEY;

const client = axios.create({ baseURL: BASE_URL });

async function getSports() {
  const res = await client.get('/sports', { params: { apiKey: API_KEY } });
  return res.data;
}

async function getOdds(sport, { markets = 'h2h', regions = 'us,uk,eu', dateFrom, dateTo, bookmakers } = {}) {
  const params = { apiKey: API_KEY, markets, oddsFormat: 'decimal' };

  // bookmakers param replaces regions when specific books are selected
  if (bookmakers && bookmakers.length > 0) {
    params.bookmakers = bookmakers.join(',');
  } else {
    params.regions = regions;
  }

  const toApiDate = (d) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');
  if (dateFrom) params.commenceTimeFrom = toApiDate(new Date(dateFrom + 'T00:00:00Z'));
  if (dateTo)   params.commenceTimeTo   = toApiDate(new Date(dateTo   + 'T23:59:59Z'));

  const res = await client.get(`/sports/${sport}/odds`, { params });
  return res.data;
}

async function getScores(sport) {
  const res = await client.get(`/sports/${sport}/scores`, {
    params: { apiKey: API_KEY, daysFrom: 1 },
  });
  return res.data;
}

module.exports = { getSports, getOdds, getScores };
