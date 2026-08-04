export function parseMonthRange(label) {
  const normalized = label.replace(/[–—]/g, "-");
  const range = normalized.match(/(\d+)\s*-\s*(\d+)/);
  if (range) return [Number(range[1]), Number(range[2])];
  const single = normalized.match(/month\s+(\d+)/i);
  if (single) return [Number(single[1]), Number(single[1])];
  return null;
}

export function findInstruction(plan, cycle) {
  const candidates = plan.steps
    .map(([label, title, detail]) => ({ label, title, detail, range: parseMonthRange(label) }))
    .filter((step) => step.range);
  if (!candidates.length) return null;
  const exact = candidates.find((step) => cycle >= step.range[0] && cycle <= step.range[1]);
  if (exact) return exact;
  const fallback = candidates
    .filter((step) => step.range[0] <= cycle)
    .sort((a, b) => b.range[0] - a.range[0])[0];
  return fallback || null;
}

export function cycleForDate(dateOfStake) {
  if (!dateOfStake) return { cycle: 1, daysSinceStake: 0 };
  const start = new Date(`${dateOfStake}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSinceStake = Math.max(0, Math.round((today - start) / 86400000));
  const cycle = Math.floor(daysSinceStake / 30) + 1;
  return { cycle, daysSinceStake };
}
