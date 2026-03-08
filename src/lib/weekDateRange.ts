/** Format week date range from league start (e.g. "Jan 1 – Jan 7"). */
export function getWeekDateRange(
  startDateIso: string,
  weekNumber: number,
  endDateIso?: string
): string {
  const start = new Date(startDateIso);
  const weekStart = new Date(start);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);
  let weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  if (endDateIso) {
    const end = new Date(endDateIso);
    if (weekEnd > end) weekEnd = end;
  }
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}
