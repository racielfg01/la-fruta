export function advanceStoryIndex(current: number, total: number): number | null {
  if (total <= 0) return null;
  const next = current + 1;
  if (next >= total) return null;
  return next;
}

export function retreatStoryIndex(current: number, total: number): number {
  if (total <= 0) return 0;
  if (current <= 0) return 0;
  return Math.min(current - 1, total - 1);
}
