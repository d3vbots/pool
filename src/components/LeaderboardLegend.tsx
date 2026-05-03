/** Shared key for leaderboard colour accents (desktop footer + optional mobile). */
export function LeaderboardLegend({
  totalPlayers,
  className = '',
}: {
  totalPlayers: number;
  className?: string;
}) {
  if (totalPlayers <= 0) return null;
  return (
    <div
      className={`text-[11px] sm:text-xs text-[var(--color-muted)] flex flex-wrap gap-x-5 gap-y-2 ${className}`}
    >
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-1 rounded-full bg-[var(--color-gold)] shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
        Leader
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-1 rounded-full bg-slate-300/80" />
        2nd
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-1 rounded-full bg-amber-700" />
        3rd
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-1 rounded-full bg-emerald-500/70" />
        Top 8
      </span>
      {totalPlayers > 8 && (
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-1 rounded-full bg-amber-400/80" />
          Top 8 / bottom 5 overlap
        </span>
      )}
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-1 rounded-full bg-[var(--color-accent-red)]/80" />
        Bottom 5
      </span>
      {totalPlayers > 8 && (
        <span className="inline-flex items-center gap-2 text-[var(--color-gold)]/90">
          <span className="h-px w-4 border-t border-dashed border-current" />
          Dashed line between 8th and 9th
        </span>
      )}
    </div>
  );
}
