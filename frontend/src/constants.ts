export const ALLOWED_SPORTS = [
  { key: 'soccer_epl', label: 'Soccer — English Premier League' },
  { key: 'soccer_fifa_world_cup', label: 'Soccer — FIFA World Cup' },
  { key: 'americanfootball_nfl', label: 'NFL' },
  { key: 'basketball_nba', label: 'NBA' },
  { key: 'baseball_mlb', label: 'MLB' },
  { key: 'icehockey_nhl', label: 'NHL' },
];

export const ALLOWED_SPORT_KEYS = ALLOWED_SPORTS.map(s => s.key);
export const DEFAULT_SPORT = 'soccer_epl';

export const BOOKMAKERS = [
  // US
  { key: 'draftkings',       label: 'DraftKings',    region: 'US' },
  { key: 'fanduel',          label: 'FanDuel',        region: 'US' },
  { key: 'betmgm',           label: 'BetMGM',         region: 'US' },
  { key: 'caesars',          label: 'Caesars',         region: 'US' },
  { key: 'pointsbet',        label: 'PointsBet',       region: 'US' },
  { key: 'espnbet',          label: 'ESPN Bet',        region: 'US' },
  { key: 'betrivers',        label: 'BetRivers',       region: 'US' },
  // UK / EU
  { key: 'bet365',           label: 'Bet365',          region: 'UK' },
  { key: 'betfair_ex_uk',    label: 'Betfair Exchange',region: 'UK' },
  { key: 'williamhill',      label: 'William Hill',    region: 'UK' },
  { key: 'paddypower',       label: 'Paddy Power',     region: 'UK' },
  { key: 'skybet',           label: 'Sky Bet',         region: 'UK' },
  { key: 'coral',            label: 'Coral',           region: 'UK' },
  { key: 'ladbrokes',        label: 'Ladbrokes',       region: 'UK' },
  { key: 'unibet_uk',        label: 'Unibet',          region: 'UK' },
  { key: 'pinnacle',         label: 'Pinnacle',        region: 'EU' },
  { key: '1xbet',            label: '1xBet',           region: 'EU' },
  { key: 'tipico_de',        label: 'Tipico',          region: 'EU' },
];

export const DEFAULT_BOOKMAKERS = BOOKMAKERS.map(b => b.key);
