/** R4-08 — Customer context engine. */

import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { CustomerContext } from "./types.js";
import { SupportMetadataGenerator } from "./support-metadata-generator.js";

export class CustomerContextEngine {
  private readonly metadata = new SupportMetadataGenerator();

  retrieveContext(
    customerId: string,
    crmFoundation: CrmFoundationEngine | null,
    timelineEngine: CustomerTimelineEngine | null,
  ): CustomerContext {
    const crmProfileFound =
      crmFoundation?.getCrmRecords().some((r) => r.customerId === customerId) ?? false;
    const timelineRecords =
      timelineEngine?.getTimelineRecords().filter((r) => r.customerId === customerId) ?? [];
    const recentTimelineEvents = timelineRecords
      .slice(-5)
      .map((r) => `${r.eventType}: ${r.eventDescription.slice(0, 60)}`);

    return this.metadata.buildContext({
      customerId,
      crmProfileFound,
      timelineRecordCount: timelineRecords.length,
      recentTimelineEvents,
    });
  }
}
