export function myanmarDateBoundary(date: string, nextDay = false): string {
  const instant = new Date(`${date}T00:00:00+06:30`);
  if (nextDay) instant.setUTCDate(instant.getUTCDate() + 1);
  return instant.toISOString().slice(0, 19).replace("T", " ");
}

export function verifiedActivityDetails(details: Record<string, unknown> | null) {
  if (!details) return null;
  const before = details.quantity_before;
  const after = details.quantity_after;
  const added = details.added_units;
  if (typeof before === "number" && typeof after === "number" && typeof added === "number" && before + added !== after) {
    const { quantity_before: _before, quantity_after: _after, ...rest } = details;
    return { ...rest, quantity_warning: "Historical stock totals are inconsistent and cannot be verified." };
  }
  return details;
}
