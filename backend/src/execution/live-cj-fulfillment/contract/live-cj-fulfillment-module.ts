/**
 * LIVE CJ Fulfillment module — founder-gated LIVE submit, tracking, recovery.
 */

import type { LiveCjFulfillmentRecord } from "../models/live-cj-fulfillment-record.js";
import {
  applyFounderApproval,
  executeLiveCjSubmit,
  getLiveCjFulfillmentById,
  listFulfillmentAttempts,
  listLiveCjFulfillments,
  prepareLiveCjFulfillment,
  recoverFailedFulfillment,
  syncLiveCjTracking,
} from "../services/live-cj-fulfillment-service.js";

export const LIVE_CJ_FULFILLMENT_MODULE_ID = "live-cj-fulfillment" as const;
export type LiveCjFulfillmentModuleId = typeof LIVE_CJ_FULFILLMENT_MODULE_ID;
export const LIVE_CJ_FULFILLMENT_VERSION = "0.1.0" as const;

export type LiveCjFulfillmentCapability =
  | "live-cj-fulfillment.prepare"
  | "live-cj-fulfillment.approve"
  | "live-cj-fulfillment.submit"
  | "live-cj-fulfillment.tracking"
  | "live-cj-fulfillment.recovery";

export const LIVE_CJ_FULFILLMENT_CAPABILITIES: readonly LiveCjFulfillmentCapability[] = [
  "live-cj-fulfillment.prepare",
  "live-cj-fulfillment.approve",
  "live-cj-fulfillment.submit",
  "live-cj-fulfillment.tracking",
  "live-cj-fulfillment.recovery",
] as const;

/** Orchestrates controlled LIVE CJ fulfillment with Protect The Empire gates. */
export class LiveCjFulfillmentModule {
  readonly moduleId = LIVE_CJ_FULFILLMENT_MODULE_ID;
  readonly version = LIVE_CJ_FULFILLMENT_VERSION;
  readonly capabilities = LIVE_CJ_FULFILLMENT_CAPABILITIES;

  prepare = prepareLiveCjFulfillment;
  approve = applyFounderApproval;
  submitLive = executeLiveCjSubmit;
  syncTracking = syncLiveCjTracking;
  recover = recoverFailedFulfillment;
  get = getLiveCjFulfillmentById;
  list = listLiveCjFulfillments;
  getAttempts = listFulfillmentAttempts;
}

export function createLiveCjFulfillmentModule(): LiveCjFulfillmentModule {
  return new LiveCjFulfillmentModule();
}

export const liveCjFulfillmentModule = createLiveCjFulfillmentModule();

export type { LiveCjFulfillmentRecord };
