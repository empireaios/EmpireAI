import type { ManufacturingFulfillmentPreparation } from "../../fulfillment/manufacturing-fulfillment-bridge.js";
import type { Order } from "../../orders/index.js";
import type { CjOrderPayload, CjOrderSubmissionResult } from "../../suppliers/cj-dropshipping/orders/cj-order-types.js";
import type { TrackingSyncResult } from "../../suppliers/cj-dropshipping/orders/cj-tracking-sync.js";

export type OrderExecutionSession = {
  sessionId: string;
  workspaceId: string;
  companyId?: string;
  runId: string | null;
  preparation: ManufacturingFulfillmentPreparation | null;
  draftOrder: Order | null;
  draftPayload: CjOrderPayload | null;
  approvedOrder: Order | null;
  lastSubmission: CjOrderSubmissionResult | null;
  tracking: TrackingSyncResult | null;
  updatedAt: string;
};
