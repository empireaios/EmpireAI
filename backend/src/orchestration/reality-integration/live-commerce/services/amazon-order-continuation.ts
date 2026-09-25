/**
 * Read-only continuation of owner-started Amazon Orders pagination.
 * One page is attempted per tick; a provider/credential failure pauses the
 * cursor until the owner starts another sync. No listing/order action occurs.
 */
import { logger } from "../../../../config/logger.js";
import {
  nextPendingAmazonOrderImport,
  pauseAmazonOrderImport,
} from "../adapters/amazon-order-import.js";
import { resolveLiveCommerceIntegrationMode } from "../config.js";
import { runLiveCommerceSync } from "./live-commerce-integration-service.js";

export async function continueOneAmazonOrderImport(): Promise<
  "disabled" | "idle" | "waiting" | "pending" | "completed" | "paused"
> {
  if (resolveLiveCommerceIntegrationMode() !== "production") return "disabled";
  const next = nextPendingAmazonOrderImport();
  if (!next) return "idle";
  if (next.nextAllowedAt && !Number.isFinite(Date.parse(next.nextAllowedAt))) {
    await pauseAmazonOrderImport(
      next.workspaceId, next.providerId, "RATE_GATE_CORRUPT", next.updatedAt,
    );
    return "paused";
  }
  if (next.nextAllowedAt && Date.parse(next.nextAllowedAt) > Date.now()) return "waiting";
  const job = await runLiveCommerceSync({
    workspaceId: next.workspaceId, providerId: next.providerId,
    syncType: "orders", actor: "scheduled-order-import",
  });
  if (job.status === "completed") return "completed";
  if (job.errorMessage?.startsWith("AMAZON_ORDERS_PAGINATION_PENDING") ||
      job.errorMessage?.startsWith("AMAZON_ORDERS_RATE_LIMIT_PENDING")) return "pending";
  await pauseAmazonOrderImport(
    next.workspaceId, next.providerId, "PROVIDER_FAILURE", next.updatedAt,
  );
  return "paused";
}

/** Start after the Brain worker is listening; stop and drain before database shutdown. */
export function startAmazonOrderImportContinuation(): () => Promise<void> {
  if (resolveLiveCommerceIntegrationMode() !== "production") return async () => {};
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let flight: Promise<void> | null = null;
  const schedule = () => {
    if (stopped) return;
    timer = setTimeout(() => {
      flight = (async () => {
        try {
          await continueOneAmazonOrderImport();
        } catch (error) {
          logger.error({
            name: error instanceof Error ? error.name : "unknown",
          }, "Amazon order continuation failed; cursor remains pending");
        } finally {
          flight = null;
          schedule();
        }
      })();
    }, 181_000);
    timer.unref();
  };
  schedule();
  return async () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    if (flight) await flight;
  };
}
