import type { MatchResponse } from '../api/client';

/** Score column text for fixtures / standings / player profile. */
export function formatMatchScoreDisplay(m: MatchResponse): string {
  if (m.status === 'Abandoned') {
    const g = m.abandonedForfeitGames;
    return g != null ? `Forfeit (each 0–${g})` : 'Forfeit (both)';
  }
  if (m.status === 'Completed' && m.playerAScore != null && m.playerBScore != null) {
    return `${m.playerAScore} – ${m.playerBScore}`;
  }
  return '–';
}

/** True when the match is fully recorded (played result or abandoned). */
export function isMatchRecorded(m: MatchResponse): boolean {
  return m.status === 'Completed' || m.status === 'Abandoned';
}
