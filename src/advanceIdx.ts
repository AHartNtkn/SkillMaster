export function advanceIdx(current: number | undefined, total: number): number {
  if (total <= 0) throw new Error('total must be > 0');
  const idx = current ?? -1;
  return (idx + 1) % total;
}
