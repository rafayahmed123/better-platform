import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });

export const getSports = () => api.get('/odds/sports').then(r => r.data);

export const getOdds = (sport: string, dateFrom?: string, dateTo?: string, bookmakers?: string[]) =>
  api.get(`/odds/${sport}`, {
    params: { dateFrom, dateTo, bookmakers: bookmakers?.join(',') },
  }).then(r => r.data);

export const getArbitrage = (sport: string, dateFrom?: string, dateTo?: string, bookmakers?: string[]) =>
  api.get(`/arbitrage/${sport}`, {
    params: { dateFrom, dateTo, bookmakers: bookmakers?.join(',') },
  }).then(r => r.data);

export const getValueBets = () => api.get('/value-bets').then(r => r.data);

export const getPaperBets = () => api.get('/paper-bets').then(r => r.data);
export const getPaperBetStats = () => api.get('/paper-bets/stats').then(r => r.data);
export const placePaperBet = (bet: any) => api.post('/paper-bets', bet).then(r => r.data);
export const settlePaperBet = (id: number, status: string) => api.patch(`/paper-bets/${id}/result`, { status }).then(r => r.data);
export const deletePaperBet = (id: number) => api.delete(`/paper-bets/${id}`).then(r => r.data);
