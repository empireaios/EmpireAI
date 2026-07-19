/** R2-13 — Return Status Tracker. */

import type { ReturnRecord } from "./types.js";
import { getFixtureReturnStatus } from "./return-fixtures.js";

export class ReturnStatusTracker {
  trackLifecycle(
    record: ReturnRecord,
    fixtureMode?: "in_transit" | "received" | "failed",
  ): ReturnRecord {
    if (!fixtureMode) return record;
    const fixture = getFixtureReturnStatus(fixtureMode);
    return {
      ...record,
      timestamp: new Date().toISOString(),
      returnShipmentStatus: fixture.returnShipmentStatus,
      returnCompletionStatus: fixture.returnCompletionStatus,
      inventoryRestocked: fixture.returnCompletionStatus === "completed",
    };
  }

  isCompleted(record: ReturnRecord): boolean {
    return record.returnCompletionStatus === "completed";
  }

  isFailed(record: ReturnRecord): boolean {
    return (
      record.returnCompletionStatus === "failed" ||
      record.returnShipmentStatus === "failed" ||
      record.returnAuthorizationStatus === "denied"
    );
  }
}
