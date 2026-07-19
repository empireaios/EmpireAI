/** R4-03 — Customer Timeline Manager. */

import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import { appendCteLog } from "./cte-logging.js";
import { TimelineRegistry } from "./timeline-registry.js";
import { TimelineMetadataGenerator } from "./timeline-metadata-generator.js";
import { TimelineEventEngine } from "./timeline-event-engine.js";
import { TimelineAggregationEngine } from "./timeline-aggregation-engine.js";
import { TimelineSearchEngine } from "./timeline-search-engine.js";
import { TimelineValidationEngine } from "./timeline-validation-engine.js";
import { TimelineValidator } from "./timeline-validator.js";
import { TimelineRetryManager } from "./timeline-retry-manager.js";
import type { CustomerTimelineEngineConfiguration } from "./configuration.js";
import type {
  ConnectCustomerTimelineEngineInput,
  RecordAccountChangeInput,
  RecordCommunicationInput,
  RecordCustomerInteractionInput,
  RecordCustomerMilestoneInput,
  RecordPurchaseInput,
  RecordSupportActivityInput,
  RecordTimelineEventInput,
  SearchTimelineHistoryInput,
  TimelineEngineRecord,
  TimelineRecord,
  TimelineRunReport,
} from "./types.js";

export class CustomerTimelineManager {
  private engineRecord: TimelineEngineRecord | null = null;
  private readonly registry = new TimelineRegistry();
  private readonly metadataGenerator = new TimelineMetadataGenerator();
  private readonly eventEngine = new TimelineEventEngine();
  private readonly aggregationEngine = new TimelineAggregationEngine();
  private readonly searchEngine = new TimelineSearchEngine();
  private readonly validationEngine = new TimelineValidationEngine();
  private readonly validator = new TimelineValidator();
  private readonly retryManager = new TimelineRetryManager();

  constructor(
    private readonly identityEngine: CustomerIdentityEngine | null,
    private readonly crmFoundation: CrmFoundationEngine | null,
  ) {}

  getEngineRecord(): TimelineEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): TimelineRegistry {
    return this.registry;
  }

  getTimelineRecords(): TimelineRecord[] {
    return this.registry.list();
  }

  getAggregationEngine(): TimelineAggregationEngine {
    return this.aggregationEngine;
  }

  getRetryManager(): TimelineRetryManager {
    return this.retryManager;
  }

  private isEngineConnected(
    engine: { getEngineRecord?: () => { currentOperationalState?: string } | null } | null,
  ): boolean {
    try {
      const record = engine?.getEngineRecord?.();
      return (
        record?.currentOperationalState === "active" ||
        record?.currentOperationalState === "connected"
      );
    } catch {
      return false;
    }
  }

  private resolveCustomer(customerId: string): { valid: boolean; error: string | null } {
    if (!this.identityEngine) {
      return { valid: false, error: "Customer Identity Engine unavailable" };
    }
    const identity = this.identityEngine
      .getCustomerRecords()
      .find((r) => r.customerId === customerId);
    if (!identity) {
      return { valid: false, error: `Customer identity ${customerId} not found` };
    }
    return { valid: true, error: null };
  }

  connectCustomerTimelineEngine(
    _input: ConnectCustomerTimelineEngineInput,
    config: CustomerTimelineEngineConfiguration,
  ): TimelineRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const identityConnected = this.isEngineConnected(this.identityEngine);
    const crmConnected = this.isEngineConnected(this.crmFoundation);

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState:
        configValidation.decision === "fail"
          ? "failed"
          : identityConnected
            ? "active"
            : "connected",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      identityEngineConnected: identityConnected,
      crmFoundationConnected: crmConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (configValidation.decision !== "pass") {
      validation.warnings.push(...configValidation.warnings);
      if (configValidation.errors.length > 0) {
        validation.errors.push(...configValidation.errors);
        validation.decision = "fail";
      } else {
        validation.decision = "partial";
      }
    }

    appendCteLog({
      event: "engine_initialization",
      level: "info",
      details: `Customer Timeline Engine connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      timelineRecords: [],
      searchResults: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  recordTimelineEvent(
    input: RecordTimelineEventInput,
    config: CustomerTimelineEngineConfiguration,
  ): TimelineRunReport {
    return this.recordTypedEvent("record_event", input, config);
  }

  recordCustomerInteraction(
    input: RecordCustomerInteractionInput,
    config: CustomerTimelineEngineConfiguration,
  ): TimelineRunReport {
    return this.recordTypedEvent(
      "record_interaction",
      {
        customerId: input.customerId,
        eventType: "interaction",
        eventSource: input.eventSource ?? "system",
        eventReference: input.eventReference,
        eventDescription: input.eventDescription,
      },
      config,
    );
  }

  recordPurchase(
    input: RecordPurchaseInput,
    config: CustomerTimelineEngineConfiguration,
  ): TimelineRunReport {
    return this.recordTypedEvent(
      "record_purchase",
      {
        customerId: input.customerId,
        eventType: "purchase",
        eventSource: input.eventSource ?? "marketplace",
        eventReference: input.eventReference,
        eventDescription: input.eventDescription,
      },
      config,
    );
  }

  recordSupportActivity(
    input: RecordSupportActivityInput,
    config: CustomerTimelineEngineConfiguration,
  ): TimelineRunReport {
    return this.recordTypedEvent(
      "record_support",
      {
        customerId: input.customerId,
        eventType: "support",
        eventSource: input.eventSource ?? "support",
        eventReference: input.eventReference,
        eventDescription: input.eventDescription,
      },
      config,
    );
  }

  recordCommunication(
    input: RecordCommunicationInput,
    config: CustomerTimelineEngineConfiguration,
  ): TimelineRunReport {
    return this.recordTypedEvent(
      "record_communication",
      {
        customerId: input.customerId,
        eventType: "communication",
        eventSource: input.eventSource ?? "communication",
        eventReference: input.eventReference,
        eventDescription: input.eventDescription,
      },
      config,
    );
  }

  recordAccountChange(
    input: RecordAccountChangeInput,
    config: CustomerTimelineEngineConfiguration,
  ): TimelineRunReport {
    return this.recordTypedEvent(
      "record_account_change",
      {
        customerId: input.customerId,
        eventType: "account_change",
        eventSource: input.eventSource ?? "crm",
        eventReference: input.eventReference,
        eventDescription: input.eventDescription,
      },
      config,
    );
  }

  recordCustomerMilestone(
    input: RecordCustomerMilestoneInput,
    config: CustomerTimelineEngineConfiguration,
  ): TimelineRunReport {
    return this.recordTypedEvent(
      "record_milestone",
      {
        customerId: input.customerId,
        eventType: "milestone",
        eventSource: input.eventSource ?? "system",
        eventReference: input.eventReference,
        eventDescription: input.eventDescription,
      },
      config,
    );
  }

  searchTimelineHistory(
    input: SearchTimelineHistoryInput,
    config: CustomerTimelineEngineConfiguration,
  ): TimelineRunReport {
    return this.runAction("search_timeline", config, () => {
      const results = this.searchEngine.search(
        this.registry.list(),
        input.query,
        config,
        { customerId: input.customerId, eventType: input.eventType, limit: input.limit },
      );

      appendCteLog({
        event: "timeline_search",
        level: "info",
        details: `Search "${input.query}" returned ${results.length} result(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      if (results.length === 0) validation.warnings.push("No matching timeline records found");

      return {
        timelineRecords: results
          .map((r) => this.registry.get(r.timelineRecordId))
          .filter(Boolean) as TimelineRecord[],
        searchResults: results,
        validation,
        error: null,
      };
    });
  }

  private recordTypedEvent(
    action: TimelineRunReport["action"],
    input: RecordTimelineEventInput,
    config: CustomerTimelineEngineConfiguration,
  ): TimelineRunReport {
    return this.runAction(action, config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return {
          timelineRecords: [],
          searchResults: [],
          validation,
          error: customer.error,
        };
      }

      const { record, error } = this.eventEngine.buildEvent(input, config);
      if (error) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(error);
        return {
          timelineRecords: [],
          searchResults: [],
          validation,
          error,
        };
      }

      if (config.duplicateDetectionEnabled && this.registry.hasDuplicateEvent(record)) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Duplicate timeline event detected");
        return {
          timelineRecords: [],
          searchResults: [],
          validation,
          error: "Duplicate timeline event detected",
        };
      }

      const validation = this.validationEngine.validateTimelineRecord(record, config);
      if (validation.decision === "fail") {
        return {
          timelineRecords: [],
          searchResults: [],
          validation,
          error: validation.errors.join("; "),
        };
      }

      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      record.eventStatus = "validated";
      this.registry.store(record);

      appendCteLog({
        event: "timeline_event_creation",
        level: "info",
        details: `Timeline event ${record.timelineRecordId} recorded (${record.eventType}) for ${input.customerId}`,
      });

      return {
        timelineRecords: [record],
        searchResults: [],
        validation,
        error: null,
      };
    });
  }

  private runAction(
    action: TimelineRunReport["action"],
    config: CustomerTimelineEngineConfiguration,
    fn: () => {
      timelineRecords: TimelineRecord[];
      searchResults: TimelineRunReport["searchResults"];
      validation: TimelineRunReport["validation"];
      error: string | null;
    },
  ): TimelineRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Customer timeline engine not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      timelineRecords: result.timelineRecords,
      searchResults: result.searchResults,
      validation: result.validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
  }
}
