/** R2-10 — Fulfilment Orchestrator Manager. */

import type { ProcurementEngine } from "../procurement-engine/engine.js";
import { appendFoLog } from "./fo-logging.js";
import { FulfilmentRoutingEngine } from "./fulfilment-routing-engine.js";
import { FulfilmentWorkflowEngine } from "./fulfilment-workflow-engine.js";
import { FulfilmentStatusTracker } from "./fulfilment-status-tracker.js";
import { FulfilmentFailureDetector } from "./fulfilment-failure-detector.js";
import { FulfilmentValidationEngine, FulfilmentValidator } from "./fulfilment-validator.js";
import { FulfilmentMetadataGenerator } from "./fulfilment-metadata-generator.js";
import type { FulfilmentOrchestratorConfiguration } from "./configuration.js";
import type {
  FulfilmentFailureFinding,
  FulfilmentRecord,
  FulfilmentReport,
  InvalidFulfilmentFinding,
  ReceiveFulfilmentRequirementsInput,
  RouteFulfilmentInput,
} from "./types.js";

export class FulfilmentOrchestratorManager {
  private readonly routingEngine = new FulfilmentRoutingEngine();
  private readonly workflowEngine = new FulfilmentWorkflowEngine();
  private readonly statusTracker = new FulfilmentStatusTracker();
  private readonly failureDetector = new FulfilmentFailureDetector();
  private readonly validationEngine = new FulfilmentValidationEngine();
  private readonly validator = new FulfilmentValidator();
  private readonly metadataGenerator = new FulfilmentMetadataGenerator();

  constructor(private readonly procurementEngine: ProcurementEngine | null) {}

  getRecords(): FulfilmentRecord[] {
    return this.statusTracker.getAll();
  }

  resolveApprovedProcurement(procurementReference: string) {
    const records = this.procurementEngine?.getRecords() ?? [];
    return records.find((r) => r.procurementId === procurementReference) ?? null;
  }

  findApprovedProcurementForRouting(input: RouteFulfilmentInput) {
    if (input.procurementReference) {
      return this.resolveApprovedProcurement(input.procurementReference);
    }

    const records = this.procurementEngine?.getRecords() ?? [];
    const approved = records.filter(
      (r) =>
        (r.approvalStatus === "approved" || r.approvalStatus === "auto_approved") &&
        r.procurementStatus === "purchase_order_created",
    );

    if (input.productReference) {
      return approved.find((r) => r.productReference === input.productReference) ?? approved[0] ?? null;
    }

    return approved[0] ?? null;
  }

  routeFulfilment(
    input: RouteFulfilmentInput,
    config: FulfilmentOrchestratorConfiguration,
  ): FulfilmentReport {
    const started = Date.now();
    const failures: FulfilmentFailureFinding[] = [];
    const invalidRequests: InvalidFulfilmentFinding[] = [];

    const invalid = this.validationEngine.detectInvalidRequest(input);
    if (invalid) {
      invalidRequests.push(invalid);
      const validation = this.validator.validateFulfilmentResult({
        records: [],
        failures: [{ fulfilmentId: "fo-invalid", failureType: "routing_failed", details: invalid.errors.join("; ") }],
        config,
        startedAt: started,
      });
      return this.metadataGenerator.generateFulfilmentReport({
        action: "route",
        records: [],
        routeSelection: null,
        failures: [{ fulfilmentId: "fo-invalid", failureType: "routing_failed", details: invalid.errors.join("; ") }],
        invalidRequests,
        validation,
        durationMs: Date.now() - started,
      });
    }

    const procurement = this.findApprovedProcurementForRouting(input);
    const procurementFailure = this.failureDetector.detectProcurementIssues({ procurement, config });
    if (procurementFailure) {
      failures.push(procurementFailure);
      appendFoLog({
        event: "fulfilment_failure",
        level: "warn",
        details: procurementFailure.details,
      });
      const validation = this.validator.validateFulfilmentResult({
        records: [],
        failures,
        config,
        startedAt: started,
      });
      return this.metadataGenerator.generateFulfilmentReport({
        action: "route",
        records: [],
        routeSelection: null,
        failures,
        invalidRequests,
        validation,
        durationMs: Date.now() - started,
      });
    }

    const procurementRef = procurement!.procurementId;
    const duplicateFailure = this.failureDetector.detectDuplicate({
      existingProcurementRef: this.statusTracker.getByProcurementReference(procurementRef)?.procurementReference,
      procurementReference: procurementRef,
    });
    if (duplicateFailure) {
      failures.push(duplicateFailure);
      const validation = this.validator.validateFulfilmentResult({
        records: [],
        failures,
        config,
        startedAt: started,
      });
      return this.metadataGenerator.generateFulfilmentReport({
        action: "route",
        records: [],
        routeSelection: null,
        failures,
        invalidRequests,
        validation,
        durationMs: Date.now() - started,
      });
    }

    const orderReference = input.orderReference ?? `ord-${Date.now()}`;
    const routed = this.routingEngine.routeOrder({
      orderReference,
      procurement: procurement!,
      config,
    });

    if (!routed) {
      const routeFailure = this.failureDetector.detectInvalidRoute(null)!;
      failures.push(routeFailure);
      const validation = this.validator.validateFulfilmentResult({
        records: [],
        failures,
        config,
        startedAt: started,
      });
      return this.metadataGenerator.generateFulfilmentReport({
        action: "route",
        records: [],
        routeSelection: null,
        failures,
        invalidRequests,
        validation,
        durationMs: Date.now() - started,
      });
    }

    appendFoLog({
      event: "supplier_route_selection",
      level: "info",
      details: `Route ${routed.routeSelection!.fulfilmentRoute} for ${procurement!.supplierId}: ${routed.routeSelection!.selectionReason}`,
    });

    let record = routed.record;
    if (config.workflowRulesEnabled) {
      record = this.workflowEngine.coordinateWorkflow(record);
      record = this.workflowEngine.coordinateWorkflow(record);
    }

    appendFoLog({
      event: "fulfilment_routing",
      level: "info",
      details: `Routed ${orderReference} via ${record.selectedFulfilmentRoute} — status ${record.fulfilmentStatus}`,
    });

    const records = [record];
    const validation = this.validator.validateFulfilmentResult({
      records,
      failures,
      config,
      startedAt: started,
    });

    if (validation.decision !== "fail" || !config.preserveExistingOnValidationFailure) {
      this.statusTracker.track(record);
    }

    return this.metadataGenerator.generateFulfilmentReport({
      action: "route",
      records: validation.decision === "fail" && config.preserveExistingOnValidationFailure ? [] : records,
      routeSelection: routed.routeSelection,
      failures,
      invalidRequests,
      validation,
      durationMs: Date.now() - started,
    });
  }

  receiveFulfilmentRequirements(
    input: ReceiveFulfilmentRequirementsInput,
    config: FulfilmentOrchestratorConfiguration,
  ): FulfilmentReport {
    return this.routeFulfilment(
      {
        orderReference: input.orderReference,
        procurementReference: input.procurementReference,
        productReference: input.productReference,
        quantity: input.quantity,
        includeFixtureFulfilment: false,
      },
      config,
    );
  }

  resetForTesting(): void {
    this.statusTracker.resetForTesting();
  }
}
