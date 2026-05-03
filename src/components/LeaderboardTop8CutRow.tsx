/** Single horizontal cut between rank 8 and 9 — no extra row background on players. */
export function LeaderboardTop8CutRow({ colSpan = 11 }: { colSpan?: number }) {
  return (
    <tr aria-hidden className="pointer-events-none">
      <td colSpan={colSpan} className="p-0 border-0 bg-transparent">
        <div className="mx-3 sm:mx-4 border-t border-dashed border-[var(--color-gold)]/65" />
      </td>
    </tr>
  );
}
