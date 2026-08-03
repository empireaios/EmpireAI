/** X2-02 — Company lifecycle tracker. */

import { appendMcrLog } from "./mcr-logging.js";
import type { CompanyRegistrationEngine } from "./company-registration-engine.js";
import type {
  AdvanceLifecycleInput,
  CompanyRegistryRecord,
  LifecycleStage,
} from "./types.js";

const TRANSITIONS: Record<LifecycleStage, LifecycleStage[]> = {
  prospect: ["forming", "archived"],
  forming: ["launching", "paused", "archived"],
  launching: ["operating", "paused", "archived"],
  operating: ["scaling", "paused", "winding_down"],
  scaling: ["operating", "paused", "winding_down"],
  paused: ["forming", "launching", "operating", "archived"],
  winding_down: ["archived", "paused"],
  archived: [],
};

export class CompanyLifecycleTracker {
  constructor(private readonly registration: CompanyRegistrationEngine) {}

  canAdvance(from: LifecycleStage, to: LifecycleStage): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  }

  advance(input: AdvanceLifecycleInput): CompanyRegistryRecord {
    const current = this.registration.get(input.companyId);
    if (!current) {
      throw new Error(`Company not found: ${input.companyId}`);
    }
    if (!this.canAdvance(current.companyLifecycleStage, input.companyLifecycleStage)) {
      throw new Error(
        `Invalid lifecycle transition ${current.companyLifecycleStage} → ${input.companyLifecycleStage}`,
      );
    }

    const previous = current.companyLifecycleStage;
    current.companyLifecycleStage = input.companyLifecycleStage;
    if (input.companyLifecycleStage === "operating" || input.companyLifecycleStage === "scaling") {
      current.operationalStatus = "active";
    } else if (input.companyLifecycleStage === "paused") {
      current.operationalStatus = "inactive";
    } else if (input.companyLifecycleStage === "archived") {
      current.operationalStatus = "inactive";
    }

    const updated = this.registration.upsert(current);
    appendMcrLog({
      event: "lifecycle_update",
      level: "info",
      details: `${input.companyId}: ${previous} → ${input.companyLifecycleStage}`,
    });
    return updated;
  }
}
