/** Continue only owner-started, read-only Amazon US seller listing searches. */
import { logger } from "../../../../config/logger.js";
import {
  nextPendingAmazonUsListingsImport, pauseAmazonUsListingsImport,
} from "../adapters/amazon-listings-import.js";
import { resolveLiveCommerceIntegrationMode } from "../config.js";
import { runLiveCommerceSync } from "./live-commerce-integration-service.js";

export async function continueOneAmazonUsListingsImport(): Promise<
  "disabled" | "idle" | "waiting" | "pending" | "completed" | "paused"
> {
  if (resolveLiveCommerceIntegrationMode() !== "production") return "disabled";
  const next = nextPendingAmazonUsListingsImport();
  if (!next) return "idle";
  if (next.nextAllowedAt && !Number.isFinite(Date.parse(next.nextAllowedAt))) {
    await pauseAmazonUsListingsImport(next.workspaceId, "RATE_GATE_CORRUPT", next.startedAt);
    return "paused";
  }
  if (next.nextAllowedAt && Date.parse(next.nextAllowedAt) > Date.now()) return "waiting";
  const job = await runLiveCommerceSync({
    workspaceId: next.workspaceId, providerId: "amazon-us", syncType: "catalog",
    actor: "scheduled-listings-import",
  });
  if (job.status === "completed") return "completed";
  if (job.status === "queued") return "pending";
  await pauseAmazonUsListingsImport(next.workspaceId, "PROVIDER_FAILURE", next.startedAt);
  return "paused";
}

/** Start after the Brain worker listens; stop and drain before its DB closes. */
export function startAmazonUsListingsImportContinuation(): () => Promise<void> {
  if (resolveLiveCommerceIntegrationMode() !== "production") return async () => {};
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let flight: Promise<void> | null = null;
  const schedule = () => {
    if (stopped) return;
    timer = setTimeout(() => {
      flight = (async () => {
        try {
          await continueOneAmazonUsListingsImport();
        } catch (error) {
          logger.error({ name: error instanceof Error ? error.name : "unknown" },
            "Amazon listing continuation failed; cursor remains pending");
        } finally { flight = null; schedule(); }
      })();
    }, 5_000);
    timer.unref();
  };
  schedule();
  return async () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    if (flight) await flight;
  };
}
