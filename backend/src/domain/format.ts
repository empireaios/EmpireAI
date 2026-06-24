export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(2)}M`;
  }
  if (dollars >= 1_000) {
    return `$${Math.round(dollars / 1_000)}K`;
  }
  return `$${dollars.toFixed(2)}`;
}

export function formatMargin(marginPct: number | null): string {
  if (marginPct == null) return "—";
  return `${marginPct.toFixed(1)}%`;
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}
