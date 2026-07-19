/** R2-13 — Return Management Manager. */

import type { ShipmentTrackingEngine } from "../shipment-tracking-engine/engine.js";
import { appendRmLog } from "./rm-logging.js";
import { ReturnRequestEngine } from "./return-request-engine.js";
import { ReturnValidationEngine, ReturnValidator, ReturnMetadataGenerator } from "./return-validator.js";
import { SupplierReturnCoordinator } from "./supplier-return-coordinator.js";
import { CarrierReturnCoordinator } from "./carrier-return-coordinator.js";
import { ReturnLabelGenerator } from "./return-label-generator.js";
import { ReturnStatusTracker } from "./return-status-tracker.js";
import type { ReturnManagementConfiguration } from "./configuration.js";
import type {
  CreateReturnRequestInput,
  InvalidReturnFinding,
  ReceiveCustomerReturnRequestInput,
  ReturnFailureFinding,
  ReturnRecord,
  ReturnReport,
  TrackReturnLifecycleInput,
} from "./types.js";

export class ReturnManagementManager {
  private records: ReturnRecord[] = [];
  private readonly processedReturnKeys = new Set<string>();
  private readonly requestEngine = new ReturnRequestEngine();
  private readonly validationEngine = new ReturnValidationEngine();
  private readonly supplierCoordinator = new SupplierReturnCoordinator();
  private readonly carrierCoordinator = new CarrierReturnCoordinator();
  private readonly labelGenerator = new ReturnLabelGenerator();
  private readonly statusTracker = new ReturnStatusTracker();
  private readonly validator = new ReturnValidator();
  private readonly metadataGenerator = new ReturnMetadataGenerator();

  constructor(private readonly shipmentTracking: ShipmentTrackingEngine | null) {}

  getRecords(): ReturnRecord[] {
    return [...this.records];
  }

  resolveTrackingRecord(shipmentReference?: string) {
    const trackingRecords = this.shipmentTracking?.getRecords() ?? [];
    if (shipmentReference) {
      return trackingRecords.find((r) => r.shipmentId === shipmentReference) ?? null;
    }
    return trackingRecords.find((r) => r.currentShipmentStatus === "delivered") ?? null;
  }

  createReturnRequest(
    input: CreateReturnRequestInput,
    config: ReturnManagementConfiguration,
  ): ReturnReport {
    const started = Date.now();
    const failures: ReturnFailureFinding[] = [];
    const invalidRecords: InvalidReturnFinding[] = [];
    const updatedRecords: ReturnRecord[] = [];

    const trackingRecord = input.includeFixtureReturn
      ? null
      : this.resolveTrackingRecord(input.shipmentReference);

    if (!input.includeFixtureReturn) {
      const ineligible = this.validationEngine.checkEligibility(trackingRecord, config);
      if (ineligible) {
        invalidRecords.push(ineligible);
        failures.push({
          returnId: ineligible.returnId,
          failureType: "ineligible",
          details: ineligible.errors.join("; "),
        });
      }
    }

    const draft = this.requestEngine.fromCreateInput(input, trackingRecord);
    if (!draft) {
      failures.push({
        returnId: `rm-fail-${Date.now()}`,
        failureType: "missing_shipment",
        details: "No eligible shipment record for return",
      });
    } else {
      const duplicateKey = `${draft.orderReference}:${draft.shipmentReference}`;
      if (this.processedReturnKeys.has(duplicateKey)) {
        failures.push({
          returnId: draft.returnId,
          failureType: "duplicate_request",
          details: "Duplicate return request",
        });
      } else {
        const supplierResult = this.supplierCoordinator.coordinateSupplierReturn(draft, config);
        if (!supplierResult.success) {
          failures.push({
            returnId: draft.returnId,
            failureType: "supplier_failure",
            details: supplierResult.error ?? "Supplier return failed",
          });
        } else {
          let record: ReturnRecord = {
            ...draft,
            returnAuthorizationStatus: supplierResult.authorizationStatus,
            returnCompletionStatus: "processing",
          };

          const carrierResult = this.carrierCoordinator.coordinateCarrierReturn(record, config);
          if (!carrierResult.success) {
            failures.push({
              returnId: record.returnId,
              failureType: "carrier_failure",
              details: carrierResult.error ?? "Carrier return failed",
            });
          } else {
            record = this.labelGenerator.applyLabel({
              ...record,
              returnShipmentStatus: carrierResult.returnShipmentStatus,
              returnTrackingNumber: carrierResult.returnTrackingNumber,
            });
            this.processedReturnKeys.add(duplicateKey);
            updatedRecords.push(record);
            appendRmLog({
              event: "return_request_creation",
              level: "info",
              details: `Return ${record.returnId} created for ${record.orderReference}`,
            });
          }
        }
      }
    }

    const validation = this.validator.validateReturnResult({
      records: updatedRecords,
      failures,
      config,
      startedAt: started,
    });

    if (validation.decision !== "fail" || !config.preserveExistingOnValidationFailure) {
      for (const record of updatedRecords) {
        const idx = this.records.findIndex((r) => r.returnId === record.returnId);
        if (idx >= 0) this.records[idx] = record;
        else this.records.push(record);
      }
    }

    return this.metadataGenerator.generateReturnReport({
      action: "create",
      records:
        validation.decision === "fail" && config.preserveExistingOnValidationFailure ? [] : updatedRecords,
      failures,
      invalidRecords,
      validation,
      durationMs: Date.now() - started,
    });
  }

  receiveCustomerReturnRequest(
    input: ReceiveCustomerReturnRequestInput,
    config: ReturnManagementConfiguration,
  ): ReturnReport {
    const started = Date.now();
    const failures: ReturnFailureFinding[] = [];
    const invalidRecords: InvalidReturnFinding[] = [];
    const updatedRecords: ReturnRecord[] = [];

    const trackingRecord = this.resolveTrackingRecord(input.shipmentReference);
    const ineligible = this.validationEngine.checkEligibility(trackingRecord, config);
    if (ineligible) {
      invalidRecords.push(ineligible);
      failures.push({
        returnId: ineligible.returnId,
        failureType: "ineligible",
        details: ineligible.errors.join("; "),
      });
    }

    const draft = this.requestEngine.fromCustomerRequest(input, trackingRecord);
    if (!draft) {
      failures.push({
        returnId: `rm-fail-${Date.now()}`,
        failureType: "invalid_request",
        details: "Invalid customer return request",
      });
    } else {
      const supplierResult = this.supplierCoordinator.coordinateSupplierReturn(draft, config);
      const carrierResult = this.carrierCoordinator.coordinateCarrierReturn(draft, config);
      const record = this.labelGenerator.applyLabel({
        ...draft,
        returnAuthorizationStatus: supplierResult.authorizationStatus,
        returnShipmentStatus: carrierResult.returnShipmentStatus,
        returnTrackingNumber: carrierResult.returnTrackingNumber,
        returnCompletionStatus: "processing",
      });
      updatedRecords.push(record);
      appendRmLog({
        event: "return_request_creation",
        level: "info",
        details: `Customer return ${record.returnId} received`,
      });
    }

    const validation = this.validator.validateReturnResult({
      records: updatedRecords,
      failures,
      config,
      startedAt: started,
    });

    for (const record of updatedRecords) {
      const idx = this.records.findIndex((r) => r.returnId === record.returnId);
      if (idx >= 0) this.records[idx] = record;
      else this.records.push(record);
    }

    return this.metadataGenerator.generateReturnReport({
      action: "customer_request",
      records: updatedRecords,
      failures,
      invalidRecords,
      validation,
      durationMs: Date.now() - started,
    });
  }

  trackReturnLifecycle(
    input: TrackReturnLifecycleInput,
    config: ReturnManagementConfiguration,
  ): ReturnReport {
    const started = Date.now();
    const failures: ReturnFailureFinding[] = [];
    const updatedRecords: ReturnRecord[] = [];

    const existing = this.records.find((r) => r.returnId === input.returnId);
    if (!existing) {
      failures.push({
        returnId: input.returnId,
        failureType: "invalid_request",
        details: "Return record not found",
      });
    } else {
      const fixtureMode =
        input.returnFixtureMode && input.returnFixtureMode !== "none"
          ? input.returnFixtureMode
          : undefined;
      const tracked = this.statusTracker.trackLifecycle(existing, fixtureMode);
      updatedRecords.push(tracked);

      appendRmLog({
        event: "return_status_update",
        level: tracked.returnCompletionStatus === "failed" ? "warn" : "info",
        details: `Return ${tracked.returnId} — ${tracked.returnShipmentStatus} / ${tracked.returnCompletionStatus}`,
      });

      if (this.statusTracker.isCompleted(tracked)) {
        appendRmLog({
          event: "return_status_update",
          level: "info",
          details: `Return completed: ${tracked.returnId} · inventory restocked`,
        });
      }
    }

    const validation = this.validator.validateReturnResult({
      records: updatedRecords,
      failures,
      config,
      startedAt: started,
    });

    for (const record of updatedRecords) {
      const idx = this.records.findIndex((r) => r.returnId === record.returnId);
      if (idx >= 0) this.records[idx] = record;
    }

    return this.metadataGenerator.generateReturnReport({
      action: "track",
      records: updatedRecords,
      failures,
      invalidRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.records = [];
    this.processedReturnKeys.clear();
  }
}
