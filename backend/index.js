require('dotenv').config();
const express = require('express');
const cors = require('cors');

const oddsRoutes = require('./routes/odds');
const arbitrageRoutes = require('./routes/arbitrage');
const paperBetsRoutes = require('./routes/paperBets');
const valueBetsRoutes = require('./routes/valueBets');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/odds', oddsRoutes);
app.use('/api/arbitrage', arbitrageRoutes);
app.use('/api/paper-bets', paperBetsRoutes);
app.use('/api/value-bets', valueBetsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
