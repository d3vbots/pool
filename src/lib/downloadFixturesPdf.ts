import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MatchResponse } from '../api/client';

/** Format week date range from league start (e.g. "Jan 1 – Jan 7"). */
function getWeekDateRange(startDateIso: string, weekNumber: number, endDateIso?: string): string {
  const start = new Date(startDateIso);
  const weekStart = new Date(start);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);
  let weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  if (endDateIso) {
    const end = new Date(endDateIso);
    if (weekEnd > end) weekEnd = end;
  }
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}

export type FixturesPdfOptions = {
  leagueName: string;
  matches: MatchResponse[];
  startDate?: string;
  endDate?: string;
};

/**
 * Build a PDF of league fixtures (grouped by week or leg) and trigger download.
 */
export function downloadFixturesPdf({ leagueName, matches, startDate, endDate }: FixturesPdfOptions): void {
  if (matches.length === 0) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 18;

  // Title
  doc.setFontSize(18);
  doc.text(leagueName, 14, y);
  y += 10;

  doc.setFontSize(11);
  doc.text('Fixtures & results', 14, y);
  y += 12;

  const useWeeks = matches.some((m) => m.weekNumber != null);
  const groups: { label: string; list: MatchResponse[] }[] = useWeeks
    ? (() => {
        const byWeek = matches.reduce<Record<number, MatchResponse[]>>((acc, m) => {
          const w = m.weekNumber ?? 0;
          (acc[w] = acc[w] ?? []).push(m);
          return acc;
        }, {});
        return Object.entries(byWeek)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([week, list]) => ({
            label: startDate
              ? `Week ${week} (${getWeekDateRange(startDate, Number(week), endDate)})`
              : `Week ${week}`,
            list,
          }));
      })()
    : (() => {
        const byLeg = matches.reduce<Record<number, MatchResponse[]>>((acc, m) => {
          (acc[m.leg] = acc[m.leg] ?? []).push(m);
          return acc;
        }, {});
        return Object.entries(byLeg)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([leg, list]) => ({ label: `Leg ${leg}`, list }));
      })();

  for (const { label, list } of groups) {
    // Section heading
    if (y > 250) {
      doc.addPage();
      y = 18;
    }
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(label, 14, y);
    y += 8;

    const head = [['Player A', 'Score', 'Player B', 'Status']];
    const body = list.map((m) => [
      m.playerAName,
      m.status === 'Completed' && m.playerAScore != null && m.playerBScore != null
        ? `${m.playerAScore} – ${m.playerBScore}`
        : '–',
      m.playerBName,
      m.status,
    ]);

    autoTable(doc, {
      startY: y,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
      tableWidth: 'auto',
    });

    const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    y = (lastTable?.finalY ?? y + 30) + 14;
    doc.setTextColor(0, 0, 0);
  }

  const filename = `${leagueName.replace(/[^a-z0-9]+/gi, '-')}-fixtures.pdf`;
  doc.save(filename);
}
