/** R1-11 — WooCommerce connector logging. */

import type { WooCommerceMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { WooCommerceLogEntry } from "./types.js";

const logs: WooCommerceLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|oauth|refresh|credential|authorization|bearer|client[_-]?id|api[_-]?key|access[_-]?token|woocommerce[_-]?session)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — WooCommerce credential omitted]";
  }
  return details;
}

export function appendWooCommerceLog(input: {
  event: string;
  level: WooCommerceLogEntry["level"];
  details: string;
}): WooCommerceLogEntry {
  const entry: WooCommerceLogEntry = {
    logId: `woo-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getWooCommerceLogs(
  limit = 50,
  config?: WooCommerceMarketplaceIntegrationConfiguration,
): WooCommerceLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetWooCommerceLogsForTesting(): void {
  logs.length = 0;
}
