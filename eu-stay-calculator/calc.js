// Pure Schengen 90/180 logic. Dates are ISO strings (YYYY-MM-DD), handled as UTC days.
export const LIMIT = 90;
export const WINDOW = 180;
const DAY = 86400000;

export const toDay = iso => Math.floor(Date.parse(iso + 'T00:00:00Z') / DAY);
export const toIso = day => new Date(day * DAY).toISOString().slice(0, 10);
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// stays: [{start, end}] inclusive ISO dates -> Set of day numbers
export function presenceSet(stays) {
  const s = new Set();
  for (const { start, end } of stays) {
    const a = toDay(start), b = toDay(end);
    for (let d = Math.min(a, b); d <= Math.max(a, b); d++) s.add(d);
  }
  return s;
}

// Days present in the 180 days ending on (and including) `day`
export function usedInWindow(set, day) {
  let n = 0;
  for (let d = day - WINDOW + 1; d <= day; d++) if (set.has(d)) n++;
  return n;
}

// Starting from `startIso`, how many consecutive days can be stayed without
// exceeding 90 in any 180-day window. Days already present are skipped over
// (they are already counted); the result is the number of ADDITIONAL days.
export function maxStayFrom(set, startIso, cap = 365) {
  const start = toDay(startIso);
  const work = new Set(set);
  let d = start;
  while (work.has(d)) d++; // already present - continue after the booked block
  const first = d;
  let added = 0;
  while (d - first < cap) {
    const wasPresent = work.has(d);
    work.add(d);
    if (usedInWindow(work, d) > LIMIT) { if (!wasPresent) work.delete(d); break; }
    if (!wasPresent) added++;
    d++;
  }
  // days = additional days not already booked; lastDay = end of the permitted span
  return { first: toIso(first), days: added, lastDay: d > first ? toIso(d - 1) : null };
}

// Days within the entered stays that breach the rule (present with >90 in window)
export function overstayDays(set) {
  const bad = new Set();
  for (const d of set) if (usedInWindow(set, d) > LIMIT) bad.add(d);
  return bad;
}
