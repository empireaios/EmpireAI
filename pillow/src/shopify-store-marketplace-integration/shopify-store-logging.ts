/** R1-10 — Shopify Store connector logging. */

import type { ShopifyStoreMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { ShopifyStoreLogEntry } from "./types.js";

const logs: ShopifyStoreLogEntry[] = [];
const SENSITIVE_PATTERN =
  /(token|secret|password|oauth|refresh|credential|authorization|bearer|client[_-]?id|api[_-]?key|access[_-]?token|shopify[_-]?session)/i;

function sanitize(details: string): string {
  if (SENSITIVE_PATTERN.test(details)) {
    return "[redacted — Shopify credential omitted]";
  }
  return details;
}

export function appendShopifyStoreLog(input: {
  event: string;
  level: ShopifyStoreLogEntry["level"];
  details: string;
}): ShopifyStoreLogEntry {
  const entry: ShopifyStoreLogEntry = {
    logId: `shf-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    event: input.event,
    level: input.level,
    details: sanitize(input.details),
  };
  logs.push(entry);
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  return entry;
}

export function getShopifyStoreLogs(
  limit = 50,
  config?: ShopifyStoreMarketplaceIntegrationConfiguration,
): ShopifyStoreLogEntry[] {
  const level = config?.loggingLevel ?? "info";
  const levelRank = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const minRank = levelRank[level];
  return logs
    .filter((l) => levelRank[l.level] >= minRank)
    .slice(-limit)
    .map((l) => ({ ...l }));
}

export function resetShopifyStoreLogsForTesting(): void {
  logs.length = 0;
}
