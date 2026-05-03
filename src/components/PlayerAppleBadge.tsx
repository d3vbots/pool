/** Inline green-apple badge next to a player name on results / fixtures. */
export function PlayerAppleBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex items-center shrink-0 gap-0.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-1.5 py-0.5 text-[0.65rem] font-semibold text-emerald-200/95 tabular-nums shadow-[0_0_12px_rgba(52,211,153,0.12)]"
      title={`${count} green apple${count === 1 ? '' : 's'} (break-and-finish)`}
    >
      <span className="text-[0.95rem] leading-none" aria-hidden>
        🍏
      </span>
      {count > 1 ? <span className="leading-none">×{count}</span> : null}
    </span>
  );
}
