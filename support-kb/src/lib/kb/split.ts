// Splits a merged ticket into the problems its reports really are. Pages explain it; this file is what runs.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

// `parser` and `hint` come from causes.ts. `shift` is a report whose date moved by one day instead
// of flipping: the desk read these by hand (desk-notes.json, `oneDayMove`). It is a different bug,
// but the desk counts a report where causes.ts files it, so a `shift` report stays in its cause's
// count too and the `shift` row is footnoted, as CauseTable does.
export type Problem = 'parser' | 'hint' | 'shift' | 'unplaced';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // Reports intake tagged with something other than this problem.
  mistagged: number;
  // For `shift`: the cause these reports are also counted under.
  alsoIn: Problem[];
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  shiftIds: readonly string[],
): { merged: number; groups: ProblemGroup[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const byProblem = new Map<Problem, Report[]>();
  const add = (p: Problem, r: Report) => byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  for (const r of merged) {
    add(causeOf(r, tenantOf(r)) ?? 'unplaced', r);
    if (shiftIds.includes(r.id)) add('shift', r);
  }
  const groups = [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        mistagged: rs.filter((r) => r.meta.intakeTag !== problem).length,
        alsoIn: problem === 'shift' ? [...new Set(rs.map((r) => causeOf(r, tenantOf(r)) ?? 'unplaced'))] : [],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { merged: merged.length, groups };
}
