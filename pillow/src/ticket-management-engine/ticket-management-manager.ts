/** R4-09 — Ticket Management Manager. */

import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { LiveChatIntegration } from "../live-chat-integration/engine.js";
import type { AiCustomerSupport } from "../ai-customer-support/engine.js";
import { appendTmeLog } from "./tme-logging.js";
import { TicketRegistry } from "./ticket-registry.js";
import { TicketMetadataGenerator } from "./ticket-metadata-generator.js";
import { TicketCreationEngine } from "./ticket-creation-engine.js";
import { TicketClassificationEngine } from "./ticket-classification-engine.js";
import { TicketAssignmentEngine } from "./ticket-assignment-engine.js";
import { TicketWorkflowEngine } from "./ticket-workflow-engine.js";
import { TicketTimelineMapper } from "./ticket-timeline-mapper.js";
import { TicketAnalyticsEngine } from "./ticket-analytics-engine.js";
import { TicketValidationEngine } from "./ticket-validation-engine.js";
import { TicketValidator } from "./ticket-validator.js";
import type { TicketManagementEngineConfiguration } from "./configuration.js";
import type {
  AssignTicketOwnershipInput,
  AssignTicketPriorityInput,
  ClassifyTicketCategoryInput,
  ConnectTicketManagementEngineInput,
  CreateSupportTicketInput,
  DetectOverdueTicketsInput,
  DetectStalledTicketsInput,
  DetectTicketFailuresInput,
  LinkTicketToConversationInput,
  LinkTicketToCustomerInput,
  LinkTicketToTimelineInput,
  TicketEngineRecord,
  TicketFailure,
  TicketRecord,
  TicketRunReport,
  TrackTicketLifecycleInput,
} from "./types.js";

export class TicketManagementManager {
  private engineRecord: TicketEngineRecord | null = null;
  private readonly registry = new TicketRegistry();
  private readonly metadataGenerator = new TicketMetadataGenerator();
  private readonly creationEngine = new TicketCreationEngine();
  private readonly classificationEngine = new TicketClassificationEngine();
  private readonly assignmentEngine = new TicketAssignmentEngine();
  private readonly workflowEngine = new TicketWorkflowEngine();
  private readonly timelineMapper = new TicketTimelineMapper();
  private readonly analyticsEngine = new TicketAnalyticsEngine();
  private readonly validationEngine = new TicketValidationEngine();
  private readonly validator = new TicketValidator();
  private readonly failures: TicketFailure[] = [];

  constructor(
    private readonly identityEngine: CustomerIdentityEngine | null,
    private readonly crmFoundation: CrmFoundationEngine | null,
    private readonly timelineEngine: CustomerTimelineEngine | null,
    private readonly liveChatIntegration: LiveChatIntegration | null,
    private readonly aiCustomerSupport: AiCustomerSupport | null,
  ) {}

  getEngineRecord(): TicketEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): TicketRegistry {
    return this.registry;
  }

  getTicketRecords(): TicketRecord[] {
    return this.registry.listRecords();
  }

  getAnalyticsEngine(): TicketAnalyticsEngine {
    return this.analyticsEngine;
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
    if (!this.crmFoundation) {
      return { valid: false, error: "CRM Foundation unavailable" };
    }
    const crm = this.crmFoundation.getCrmRecords().find((r) => r.customerId === customerId);
    if (!crm) {
      return { valid: false, error: `CRM record for customer ${customerId} not found` };
    }
    return { valid: true, error: null };
  }

  connectTicketManagementEngine(
    _input: ConnectTicketManagementEngineInput,
    config: TicketManagementEngineConfiguration,
  ): TicketRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState: configValidation.decision === "fail" ? "failed" : "active",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      identityEngineConnected: this.isEngineConnected(this.identityEngine),
      crmFoundationConnected: this.isEngineConnected(this.crmFoundation),
      timelineEngineConnected: this.isEngineConnected(this.timelineEngine),
      liveChatIntegrationConnected: this.isEngineConnected(this.liveChatIntegration),
      aiCustomerSupportConnected: this.isEngineConnected(this.aiCustomerSupport),
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

    appendTmeLog({
      event: "engine_initialization",
      level: "info",
      details: `Ticket Management Engine connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      ticketRecords: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createSupportTicket(
    input: CreateSupportTicketInput,
    config: TicketManagementEngineConfiguration,
  ): TicketRunReport {
    return this.runAction("create_ticket", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      let conversationReference = input.conversationReference;
      if (input.aiSupportRecordId && this.aiCustomerSupport) {
        const aiRecord = this.aiCustomerSupport
          .getAiSupportRecords()
          .find((r) => r.aiSupportRecordId === input.aiSupportRecordId);
        if (aiRecord) {
          conversationReference = aiRecord.conversationReference;
        }
      }

      const result = this.creationEngine.createTicket(this.registry, config, {
        customerId: input.customerId,
        subject: input.subject,
        description: input.description,
        conversationReference,
      });

      if (result.error || !result.ticket) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(result.error ?? "Ticket creation failed");
        return this.emptyResult(validation, result.error);
      }

      const text = `${input.subject} ${input.description}`;
      const category = this.classificationEngine.classifyCategory(text, config);
      const priority = this.assignmentEngine.assignPriority(category, config);
      const ownerResult = this.assignmentEngine.assignOwner(category, this.registry, config);

      let ticket: TicketRecord = {
        ...result.ticket,
        ticketCategory: category,
        ticketPriority: priority,
      };

      if (ownerResult.ownerId) {
        ticket = this.assignmentEngine.applyOwnership(ticket, ownerResult.ownerId);
      }

      const timelineRef = this.timelineMapper.mapTicketCreated(this.timelineEngine, {
        customerId: input.customerId,
        ticketId: ticket.ticketId,
        subject: input.subject,
      });
      if (timelineRef) {
        ticket = { ...ticket, relatedTimelineReference: timelineRef };
      }

      const validation = this.validationEngine.validateTicketRecord(ticket, config);
      if (validation.decision === "fail") {
        return this.emptyResult(validation, validation.errors.join("; "));
      }

      ticket.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.storeRecord(ticket);

      appendTmeLog({
        event: "ticket_creation",
        level: "info",
        details: `Ticket ${ticket.ticketId} created (${category}/${priority}) for ${input.customerId}`,
      });

      return {
        ticketRecords: [ticket],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  classifyTicketCategory(
    input: ClassifyTicketCategoryInput,
    config: TicketManagementEngineConfiguration,
  ): TicketRunReport {
    return this.runAction("classify_category", config, () => {
      const existing = this.registry.getRecord(input.ticketId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Ticket not found");
        return this.emptyResult(validation, "Ticket not found");
      }

      const textData = this.registry.getTicketText(input.ticketId);
      const text = `${input.subject ?? textData?.subject ?? ""} ${input.description ?? textData?.description ?? ""}`;
      const category = this.classificationEngine.classifyCategory(text, config);
      const updated = {
        ...existing,
        ticketCategory: category,
        timestamp: new Date().toISOString(),
      };
      this.registry.storeRecord(updated);

      appendTmeLog({
        event: "ticket_classification",
        level: "info",
        details: `Ticket ${input.ticketId} classified as ${category}`,
      });

      const validation = this.validationEngine.validateTicketRecord(updated, config);
      return {
        ticketRecords: [updated],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  assignTicketPriority(
    input: AssignTicketPriorityInput,
    config: TicketManagementEngineConfiguration,
  ): TicketRunReport {
    return this.runAction("assign_priority", config, () => {
      const existing = this.registry.getRecord(input.ticketId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Ticket not found");
        return this.emptyResult(validation, "Ticket not found");
      }

      const priority =
        input.priority ?? this.assignmentEngine.assignPriority(existing.ticketCategory, config);
      const updated = this.assignmentEngine.applyPriority(existing, priority);
      this.registry.storeRecord(updated);

      appendTmeLog({
        event: "priority_assignment",
        level: "info",
        details: `Ticket ${input.ticketId} priority set to ${priority}`,
      });

      const validation = this.validationEngine.validateTicketRecord(updated, config);
      return {
        ticketRecords: [updated],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  assignTicketOwnership(
    input: AssignTicketOwnershipInput,
    config: TicketManagementEngineConfiguration,
  ): TicketRunReport {
    return this.runAction("assign_ownership", config, () => {
      const existing = this.registry.getRecord(input.ticketId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Ticket not found");
        return this.emptyResult(validation, "Ticket not found");
      }

      if (config.assignmentRulesEnabled) {
        const ownerTickets = this.registry
          .listRecords()
          .filter(
            (t) =>
              t.assignedOwner === input.ownerId &&
              t.currentStatus !== "closed" &&
              t.currentStatus !== "resolved" &&
              t.currentStatus !== "failed" &&
              t.ticketId !== input.ticketId,
          ).length;
        const rule = config.assignmentRules.find((r) => r.defaultOwner === input.ownerId);
        if (rule && ownerTickets >= rule.maxTicketsPerOwner) {
          const validation = this.validator.validateEngineRecord(this.engineRecord!);
          validation.decision = "fail";
          validation.errors.push(`Owner ${input.ownerId} at maximum ticket capacity`);
          return this.emptyResult(validation, validation.errors[0] ?? "Assignment failed");
        }
      }

      const updated = this.assignmentEngine.applyOwnership(existing, input.ownerId);
      this.registry.storeRecord(updated);

      appendTmeLog({
        event: "ticket_assignment",
        level: "info",
        details: `Ticket ${input.ticketId} assigned to ${input.ownerId}`,
      });

      const validation = this.validationEngine.validateTicketRecord(updated, config);
      return {
        ticketRecords: [updated],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  trackTicketLifecycle(
    input: TrackTicketLifecycleInput,
    config: TicketManagementEngineConfiguration,
  ): TicketRunReport {
    return this.runAction("track_lifecycle", config, () => {
      const existing = this.registry.getRecord(input.ticketId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Ticket not found");
        return this.emptyResult(validation, "Ticket not found");
      }

      const result = this.workflowEngine.updateLifecycle(this.registry, config, existing, {
        status: input.status,
        resolutionStatus: input.resolutionStatus,
      });

      if (result.error || !result.ticket) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(result.error ?? "Lifecycle update failed");
        return this.emptyResult(validation, result.error);
      }

      this.timelineMapper.mapStatusChange(this.timelineEngine, {
        customerId: result.ticket.customerId,
        ticketId: result.ticket.ticketId,
        status: input.status,
      });

      appendTmeLog({
        event: "status_change",
        level: "info",
        details: `Ticket ${input.ticketId} status → ${input.status}`,
      });

      const validation = this.validationEngine.validateTicketRecord(result.ticket, config);
      return {
        ticketRecords: [result.ticket],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  linkTicketToCustomer(
    input: LinkTicketToCustomerInput,
    config: TicketManagementEngineConfiguration,
  ): TicketRunReport {
    return this.runAction("link_customer", config, () => {
      const existing = this.registry.getRecord(input.ticketId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Ticket not found");
        return this.emptyResult(validation, "Ticket not found");
      }

      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      const updated = {
        ...existing,
        customerId: input.customerId,
        timestamp: new Date().toISOString(),
      };
      this.registry.storeRecord(updated);

      appendTmeLog({
        event: "customer_link",
        level: "info",
        details: `Ticket ${input.ticketId} linked to customer ${input.customerId}`,
      });

      const validation = this.validationEngine.validateTicketRecord(updated, config);
      return {
        ticketRecords: [updated],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  linkTicketToConversation(
    input: LinkTicketToConversationInput,
    config: TicketManagementEngineConfiguration,
  ): TicketRunReport {
    return this.runAction("link_conversation", config, () => {
      const existing = this.registry.getRecord(input.ticketId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Ticket not found");
        return this.emptyResult(validation, "Ticket not found");
      }

      const updated = {
        ...existing,
        conversationReference: input.conversationReference,
        timestamp: new Date().toISOString(),
      };

      const timelineRef = this.timelineMapper.mapConversationLink(this.timelineEngine, {
        customerId: existing.customerId,
        ticketId: existing.ticketId,
        conversationReference: input.conversationReference,
      });
      if (timelineRef) {
        updated.relatedTimelineReference = timelineRef;
      }

      this.registry.storeRecord(updated);

      appendTmeLog({
        event: "conversation_link",
        level: "info",
        details: `Ticket ${input.ticketId} linked to conversation ${input.conversationReference}`,
      });

      const validation = this.validationEngine.validateTicketRecord(updated, config);
      return {
        ticketRecords: [updated],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  linkTicketToTimeline(
    input: LinkTicketToTimelineInput,
    config: TicketManagementEngineConfiguration,
  ): TicketRunReport {
    return this.runAction("link_timeline", config, () => {
      const existing = this.registry.getRecord(input.ticketId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Ticket not found");
        return this.emptyResult(validation, "Ticket not found");
      }

      const textData = this.registry.getTicketText(input.ticketId);
      const timelineRef = this.timelineMapper.mapTicketCreated(this.timelineEngine, {
        customerId: existing.customerId,
        ticketId: existing.ticketId,
        subject: textData?.subject ?? existing.ticketId,
      });

      const updated = {
        ...existing,
        relatedTimelineReference: timelineRef ?? existing.relatedTimelineReference,
        timestamp: new Date().toISOString(),
      };
      this.registry.storeRecord(updated);

      appendTmeLog({
        event: "timeline_link",
        level: "info",
        details: `Ticket ${input.ticketId} linked to timeline ${timelineRef ?? "none"}`,
      });

      const validation = this.validationEngine.validateTicketRecord(updated, config);
      return {
        ticketRecords: [updated],
        failures: [],
        validation,
        error: validation.decision === "fail" ? "Timeline link failed" : null,
      };
    });
  }

  detectOverdueTickets(
    input: DetectOverdueTicketsInput,
    config: TicketManagementEngineConfiguration,
  ): TicketRunReport {
    return this.runAction("detect_overdue", config, () => {
      const records = input.ticketId
        ? [this.registry.getRecord(input.ticketId)].filter(Boolean) as TicketRecord[]
        : this.registry.listRecords();

      const overdue = records.filter((r) => this.workflowEngine.isOverdue(r, config));
      const detected: TicketFailure[] = overdue.map((r) =>
        this.metadataGenerator.buildFailure(
          r.ticketId,
          `Ticket ${r.ticketId} is overdue`,
          r.ticketPriority === "critical" ? "high" : "medium",
        ),
      );

      for (const f of detected) {
        if (!this.failures.some((x) => x.ticketId === f.ticketId && x.reason === f.reason)) {
          this.failures.push(f);
        }
      }

      appendTmeLog({
        event: "overdue_detection",
        level: detected.length > 0 ? "warn" : "info",
        details: `Detected ${detected.length} overdue ticket(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        ticketRecords: overdue,
        failures: detected,
        validation,
        error: detected.length > 0 ? "Overdue tickets detected" : null,
      };
    });
  }

  detectStalledTickets(
    input: DetectStalledTicketsInput,
    config: TicketManagementEngineConfiguration,
  ): TicketRunReport {
    return this.runAction("detect_stalled", config, () => {
      const records = input.ticketId
        ? [this.registry.getRecord(input.ticketId)].filter(Boolean) as TicketRecord[]
        : this.registry.listRecords();

      const stalled = records.filter((r) =>
        this.workflowEngine.isStalled(r, this.registry, config),
      );
      const detected: TicketFailure[] = stalled.map((r) =>
        this.metadataGenerator.buildFailure(
          r.ticketId,
          `Ticket ${r.ticketId} is stalled`,
          "medium",
        ),
      );

      for (const f of detected) {
        if (!this.failures.some((x) => x.ticketId === f.ticketId && x.reason === f.reason)) {
          this.failures.push(f);
        }
      }

      appendTmeLog({
        event: "stalled_detection",
        level: detected.length > 0 ? "warn" : "info",
        details: `Detected ${detected.length} stalled ticket(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        ticketRecords: stalled,
        failures: detected,
        validation,
        error: detected.length > 0 ? "Stalled tickets detected" : null,
      };
    });
  }

  detectTicketFailures(
    input: DetectTicketFailuresInput,
    config: TicketManagementEngineConfiguration,
  ): TicketRunReport {
    return this.runAction("detect_failures", config, () => {
      const records = input.ticketId
        ? [this.registry.getRecord(input.ticketId)].filter(Boolean) as TicketRecord[]
        : this.registry.listRecords();

      const detected: TicketFailure[] = [];
      for (const record of records) {
        if (record.currentStatus === "failed" || record.resolutionStatus === "failed") {
          detected.push(
            this.metadataGenerator.buildFailure(
              record.ticketId,
              `Ticket ${record.ticketId} failed`,
              "high",
            ),
          );
        }
      }

      for (const f of detected) {
        if (!this.failures.some((x) => x.ticketId === f.ticketId && x.reason === f.reason)) {
          this.failures.push(f);
        }
      }

      appendTmeLog({
        event: "ticket_failure",
        level: detected.length > 0 ? "warn" : "info",
        details: `Detected ${detected.length} ticket failure(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        ticketRecords: records,
        failures: detected,
        validation,
        error: detected.length > 0 ? "Ticket failures detected" : null,
      };
    });
  }

  private emptyResult(
    validation: TicketRunReport["validation"],
    error: string | null,
  ) {
    return {
      ticketRecords: [] as TicketRecord[],
      failures: [],
      validation,
      error,
    };
  }

  private runAction(
    action: TicketRunReport["action"],
    config: TicketManagementEngineConfiguration,
    fn: () => {
      ticketRecords: TicketRecord[];
      failures: TicketFailure[];
      validation: TicketRunReport["validation"];
      error: string | null;
    },
  ): TicketRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Ticket Management Engine not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      ticketRecords: result.ticketRecords,
      failures: result.failures,
      validation: result.validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.failures.length = 0;
  }
}
