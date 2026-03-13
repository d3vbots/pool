/**
 * Betting-style odds for fixtures, derived from league results (points per game, draw rate).
 * Uses a simple strength model: stronger team gets lower odds (higher implied probability).
 */

export interface OddsInputEntry {
  playerId: number;
  points: number;
  played: number;
}

export interface MatchOdds {
  oddsPlayerA: number;
  oddsDraw: number;
  oddsPlayerB: number;
  /** Implied probabilities (before margin), for tooltips or debugging */
  impliedProbA: number;
  impliedProbDraw: number;
  impliedProbB: number;
}

/** Default draw probability when league has no completed matches (e.g. 10% for pool). */
const DEFAULT_DRAW_RATE = 0.1;

/** Overround / bookmaker margin (e.g. 1.05 = 5% margin so odds are slightly lower than fair). */
const MARGIN = 1.05;

const MIN_ODDS = 1.01;
const MAX_ODDS = 99.99;

function clampOdds(o: number): number {
  return Math.max(MIN_ODDS, Math.min(MAX_ODDS, Math.round(o * 100) / 100));
}

/**
 * Compute decimal odds for a match (Player A win, Draw, Player B win) using:
 * - Points per game (with pseudo-counts for new players) as strength
 * - League draw rate for the draw probability
 */
export function computeMatchOdds(
  entryA: OddsInputEntry | undefined,
  entryB: OddsInputEntry | undefined,
  leagueDrawRate?: number | null
): MatchOdds {
  const drawRate = leagueDrawRate != null && Number.isFinite(leagueDrawRate) ? leagueDrawRate : DEFAULT_DRAW_RATE;

  // Strength = (points + 1) / (played + 2) so 0 played => 0.5 (evens)
  const strengthA = entryA ? (entryA.points + 1) / (entryA.played + 2) : 0.5;
  const strengthB = entryB ? (entryB.points + 1) / (entryB.played + 2) : 0.5;
  const totalStrength = strengthA + strengthB;
  const probAWinRaw = totalStrength > 0 ? strengthA / totalStrength : 0.5;
  const probBWinRaw = totalStrength > 0 ? strengthB / totalStrength : 0.5;

  // Three-way: draw rate from league, remainder split by relative strength
  const probDraw = Math.max(0, Math.min(1, drawRate));
  const remainder = 1 - probDraw;
  const impliedProbA = remainder * probAWinRaw;
  const impliedProbB = remainder * probBWinRaw;
  const impliedProbDraw = probDraw;

  // Decimal odds with margin: odds = margin / prob
  const oddsPlayerA = impliedProbA > 0 ? clampOdds(MARGIN / impliedProbA) : MAX_ODDS;
  const oddsDraw = impliedProbDraw > 0 ? clampOdds(MARGIN / impliedProbDraw) : MAX_ODDS;
  const oddsPlayerB = impliedProbB > 0 ? clampOdds(MARGIN / impliedProbB) : MAX_ODDS;

  return {
    oddsPlayerA,
    oddsDraw,
    oddsPlayerB,
    impliedProbA,
    impliedProbDraw,
    impliedProbB,
  };
}

/**
 * Compute league draw rate from completed matches: proportion of completed matches that were draws.
 */
export function getLeagueDrawRate(matches: { status: string; playerAScore?: number | null; playerBScore?: number | null }[]): number | null {
  const completed = matches.filter((m) => m.status === 'Completed' && m.playerAScore != null && m.playerBScore != null);
  if (completed.length === 0) return null;
  const draws = completed.filter((m) => m.playerAScore === m.playerBScore);
  return draws.length / completed.length;
}
