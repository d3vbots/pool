/** Visual zones for leaderboard rows (cut lines, podium, relegation-style bottom five). */

export function shouldShowTop8CutLine(rank: number, totalPlayers: number): boolean {
  return totalPlayers > 8 && rank === 9;
}

/** Last five ranks when more than five players (whole league isn’t “relegation”). */
export function isBottomFiveZone(rank: number, totalPlayers: number): boolean {
  if (totalPlayers <= 5) return false;
  return rank > totalPlayers - 5;
}

export function isTopEight(rank: number): boolean {
  return rank >= 1 && rank <= 8;
}

function isOverlapTop8AndBottomFive(rank: number, totalPlayers: number): boolean {
  return isTopEight(rank) && isBottomFiveZone(rank, totalPlayers);
}

/** Table row: left accent + background by zone. */
export function leaderboardTableRowClass(rank: number, totalPlayers: number): string {
  if (rank === 1) {
    return [
      'relative border-l-[3px] border-l-[var(--color-gold)]',
      'bg-gradient-to-r from-[var(--color-gold)]/[0.14] via-[var(--color-gold)]/[0.05] to-transparent',
      'shadow-[inset_6px_0_20px_rgba(212,175,55,0.08)]',
    ].join(' ');
  }
  if (rank === 2) {
    return 'border-l-[3px] border-l-slate-300/75 bg-gradient-to-r from-slate-400/10 to-transparent';
  }
  if (rank === 3) {
    return 'border-l-[3px] border-l-amber-700/85 bg-gradient-to-r from-amber-700/12 to-transparent';
  }
  if (isOverlapTop8AndBottomFive(rank, totalPlayers)) {
    return [
      'border-l-[3px] border-l-amber-400/70',
      'bg-gradient-to-r from-amber-500/[0.08] via-red-950/15 to-transparent',
    ].join(' ');
  }
  if (isTopEight(rank)) {
    return 'border-l-[3px] border-l-emerald-500/45 bg-emerald-500/[0.05]';
  }
  if (isBottomFiveZone(rank, totalPlayers)) {
    return 'border-l-[3px] border-l-[var(--color-accent-red)]/75 bg-red-950/25';
  }
  return 'border-l-[3px] border-l-white/5 hover:bg-white/[0.03]';
}

/** Mobile / card shell — matches table row logic. */
export function leaderboardCardClass(rank: number, totalPlayers: number): string {
  const base = 'card-felt p-4 overflow-hidden';
  return `${base} ${leaderboardTableRowClass(rank, totalPlayers)}`;
}
