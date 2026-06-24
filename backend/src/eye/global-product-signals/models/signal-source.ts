/** External evidence source for a global product signal. */
export const SIGNAL_SOURCES = [
  "AMAZON",
  "GOOGLE_TRENDS",
  "TIKTOK",
  "PINTEREST",
  "REDDIT",
  "SUPPLIER",
  "MANUAL",
] as const;

export type SignalSource = (typeof SIGNAL_SOURCES)[number];

/** Maps loose source strings to canonical SignalSource values. */
export function parseSignalSource(value: string): SignalSource | null {
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return SIGNAL_SOURCES.includes(normalized as SignalSource) ? (normalized as SignalSource) : null;
}

export const SIGNAL_SOURCE_RELIABILITY: Record<SignalSource, number> = {
  AMAZON: 90,
  GOOGLE_TRENDS: 88,
  TIKTOK: 75,
  PINTEREST: 72,
  REDDIT: 70,
  SUPPLIER: 85,
  MANUAL: 60,
};
