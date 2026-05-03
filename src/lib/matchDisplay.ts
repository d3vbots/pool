import type { MatchResponse } from '../api/client';

export type MatchScoreFormatOptions = {
  /** When false, omit the compact 🍏 summary from the score string (e.g. when apples are shown beside names). Default true. */
  includeAppleNote?: boolean;
};

/** Score column text for fixtures / standings / player profile. */
export function formatMatchScoreDisplay(m: MatchResponse, options?: MatchScoreFormatOptions): string {
  const includeAppleNote = options?.includeAppleNote !== false;
  if (m.status === 'Abandoned') {
    const g = m.abandonedForfeitGames;
    return g != null ? `Forfeit (each 0–${g})` : 'Forfeit (both)';
  }
  if (m.status === 'Completed' && m.playerAScore != null && m.playerBScore != null) {
    const aApple = m.playerAApples ?? 0;
    const bApple = m.playerBApples ?? 0;
    const appleNote =
      includeAppleNote && (aApple > 0 || bApple > 0)
        ? ` · 🍏 ${aApple}–${bApple}`
        : '';
    return `${m.playerAScore} – ${m.playerBScore}${appleNote}`;
  }
  return '–';
}

/** True when the match is fully recorded (played result or abandoned). */
export function isMatchRecorded(m: MatchResponse): boolean {
  return m.status === 'Completed' || m.status === 'Abandoned';
}
