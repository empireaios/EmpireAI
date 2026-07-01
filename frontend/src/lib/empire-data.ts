/** Shared data helpers for EmpireAI frontend — no business logic duplication. */

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asString(value: unknown, fallback = "—"): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

export function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatCurrencyFromDollars(dollars: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export function greetingForHour(hour = new Date().getHours()): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function healthFromStatus(status: string): "healthy" | "warning" | "critical" | "unknown" {
  const normalized = status.toUpperCase();
  if (["CONNECTED", "VERIFIED", "HEALTHY", "LIVE", "ACTIVE", "APPROVED", "PUBLISHED"].includes(normalized)) {
    return "healthy";
  }
  if (["CONNECTING", "PARTIAL", "PENDING", "AWAITING_USER_ACTION", "WARNING", "LOW_STOCK"].includes(normalized)) {
    return "warning";
  }
  if (["NOT_CONNECTED", "DISCONNECTED", "FAILED", "ERROR", "CRITICAL", "EXPIRED"].includes(normalized)) {
    return "critical";
  }
  return "unknown";
}
