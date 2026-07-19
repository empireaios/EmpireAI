/** R2-12 — Shipment Tracking Manager. */

import type { ShippingCarrierIntegrationEngine } from "../shipping-carrier-integration/engine.js";
import { appendSteLog } from "./ste-logging.js";
import { CarrierTrackingAdapter } from "./carrier-tracking-adapter.js";
import { TrackingEventProcessor } from "./tracking-event-processor.js";
import { ShipmentStatusMapper } from "./shipment-status-mapper.js";
import { DeliveryMilestoneEngine } from "./delivery-milestone-engine.js";
import { DelayDetectionEngine } from "./delay-detection-engine.js";
import { TrackingValidationEngine, TrackingValidator, TrackingMetadataGenerator } from "./tracking-validator.js";
import type { ShipmentTrackingEngineConfiguration } from "./configuration.js";
import type {
  InvalidTrackingFinding,
  QueryCarrierTrackingInput,
  ReceiveTrackingWebhookInput,
  ShipmentTrackingRecord,
  ShipmentTrackingReport,
  SyncShipmentTrackingInput,
  TrackingEvent,
  TrackingFailureFinding,
} from "./types.js";

export class ShipmentTrackingManager {
  private records: ShipmentTrackingRecord[] = [];
  private readonly trackingAdapter = new CarrierTrackingAdapter();
  private readonly eventProcessor = new TrackingEventProcessor();
  private readonly statusMapper = new ShipmentStatusMapper();
  private readonly milestoneEngine = new DeliveryMilestoneEngine();
  private readonly delayEngine = new DelayDetectionEngine();
  private readonly validationEngine = new TrackingValidationEngine();
  private readonly validator = new TrackingValidator();
  private readonly metadataGenerator = new TrackingMetadataGenerator();

  constructor(private readonly carrierIntegration: ShippingCarrierIntegrationEngine | null) {}

  getRecords(): ShipmentTrackingRecord[] {
    return [...this.records];
  }

  resolveShipments(input: SyncShipmentTrackingInput) {
    const shipments = this.carrierIntegration?.getRecords() ?? [];
    if (input.shipmentId) {
      return shipments.filter((s) => s.shipmentId === input.shipmentId);
    }
    return shipments.filter((s) => s.shipmentStatus === "confirmed" || s.shippingLabelReference);
  }

  syncShipmentTracking(
    input: SyncShipmentTrackingInput,
    config: ShipmentTrackingEngineConfiguration,
  ): ShipmentTrackingReport {
    const started = Date.now();
    const failures: TrackingFailureFinding[] = [];
    const invalidRecords: InvalidTrackingFinding[] = [];
    const events: TrackingEvent[] = [];
    const updatedRecords: ShipmentTrackingRecord[] = [];

    const shipments = this.resolveShipments(input);
    if (!shipments.length) {
      failures.push({
        trackingRecordId: `ste-fail-${Date.now()}`,
        failureType: "invalid_record",
        details: "No shipment records available for tracking",
      });
      const validation = this.validator.validateTrackingResult({
        records: [],
        failures,
        config,
        startedAt: started,
      });
      return this.metadataGenerator.generateTrackingReport({
        action: "sync",
        records: [],
        events: [],
        failures,
        invalidRecords,
        validation,
        durationMs: Date.now() - started,
      });
    }

    const fixtureMode =
      input.trackingFixtureMode && input.trackingFixtureMode !== "none"
        ? input.trackingFixtureMode
        : undefined;

    for (const shipment of shipments) {
      const response = this.trackingAdapter.queryTracking({
        shipment,
        fixtureMode,
        config,
      });

      if (!response.success) {
        failures.push({
          trackingRecordId: `ste-fail-${shipment.shipmentId}`,
          failureType: "api_failure",
          details: response.error ?? "Carrier tracking API failed",
        });
        continue;
      }

      const invalid = this.validationEngine.detectInvalidShipment(
        shipment.shipmentId,
        response.trackingNumber,
      );
      if (invalid) {
        invalidRecords.push(invalid);
        continue;
      }

      const previous = this.records.find((r) => r.shipmentId === shipment.shipmentId) ?? null;
      const milestone = this.statusMapper.statusToMilestone(response.status);
      const delayStatus = this.delayEngine.detectDelay({
        status: response.status,
        estimatedDeliveryDate: response.estimatedDeliveryDate,
        config,
      });

      const record = this.statusMapper.mapToTrackingRecord({
        shipment,
        trackingNumber: response.trackingNumber,
        status: response.status,
        location: response.location,
        milestone,
        delayStatus,
        estimatedDeliveryDate: response.estimatedDeliveryDate,
        deliveredTimestamp:
          response.status === "delivered" ? new Date().toISOString() : previous?.deliveredTimestamp ?? null,
      });

      const apiEvent = this.eventProcessor.processApiEvent({
        shipmentId: shipment.shipmentId,
        trackingNumber: response.trackingNumber,
        eventType: response.status,
        location: response.location,
      });
      events.push(apiEvent);

      if (this.delayEngine.detectDelayChange(previous, record)) {
        appendSteLog({
          event: "delay_detection",
          level: "warn",
          details: `Delay detected for ${shipment.shipmentId}: ${record.delayStatus}`,
        });
      }
      if (this.milestoneEngine.isDelivered(response.status)) {
        appendSteLog({
          event: "delivery_milestone",
          level: "info",
          details: `Delivered: ${shipment.shipmentId}`,
        });
      }
      if (this.milestoneEngine.isFailed(response.status)) {
        appendSteLog({
          event: "tracking_status_update",
          level: "warn",
          details: `Failed delivery: ${shipment.shipmentId}`,
        });
      }

      appendSteLog({
        event: "tracking_synchronization",
        level: "info",
        details: `Tracked ${shipment.shipmentId} — ${response.status} @ ${response.location ?? "unknown"}`,
      });

      updatedRecords.push(record);
    }

    const validation = this.validator.validateTrackingResult({
      records: updatedRecords,
      failures,
      config,
      startedAt: started,
    });

    if (validation.decision !== "fail" || !config.preserveExistingOnValidationFailure) {
      for (const record of updatedRecords) {
        const idx = this.records.findIndex((r) => r.shipmentId === record.shipmentId);
        if (idx >= 0) this.records[idx] = record;
        else this.records.push(record);
      }
    }

    return this.metadataGenerator.generateTrackingReport({
      action: "sync",
      records:
        validation.decision === "fail" && config.preserveExistingOnValidationFailure ? [] : updatedRecords,
      events,
      failures,
      invalidRecords,
      validation,
      durationMs: Date.now() - started,
    });
  }

  queryCarrierTracking(
    input: QueryCarrierTrackingInput,
    config: ShipmentTrackingEngineConfiguration,
  ): ShipmentTrackingReport {
    return this.syncShipmentTracking(
      { shipmentId: input.shipmentId, trackingFixtureMode: "in_transit" },
      config,
    );
  }

  receiveTrackingWebhook(
    input: ReceiveTrackingWebhookInput,
    config: ShipmentTrackingEngineConfiguration,
  ): ShipmentTrackingReport {
    const started = Date.now();
    const failures: TrackingFailureFinding[] = [];
    const events: TrackingEvent[] = [];

    if (!config.webhookProcessingRulesEnabled) {
      failures.push({
        trackingRecordId: `ste-fail-${input.shipmentId}`,
        failureType: "api_failure",
        details: "Webhook processing rules disabled",
      });
    }

    const event = this.eventProcessor.processWebhook(input);
    if (!event) {
      failures.push({
        trackingRecordId: `ste-fail-${input.shipmentId}`,
        failureType: "duplicate_event",
        details: "Duplicate tracking webhook event",
      });
    } else {
      events.push(event);
      appendSteLog({
        event: "tracking_status_update",
        level: "info",
        details: `Webhook ${input.eventType} for ${input.shipmentId}`,
      });
    }

    const existing = this.records.find((r) => r.shipmentId === input.shipmentId);
    const updatedRecords: ShipmentTrackingRecord[] = [];

    if (existing && event) {
      const milestone = this.milestoneEngine.advanceMilestone(existing, input.eventType);
      const delayStatus = this.delayEngine.detectDelay({
        status: input.eventType,
        estimatedDeliveryDate: existing.estimatedDeliveryDate,
        config,
      });
      const updated: ShipmentTrackingRecord = {
        ...existing,
        timestamp: new Date().toISOString(),
        currentShipmentStatus: input.eventType,
        currentLocation: input.location ?? existing.currentLocation,
        deliveryMilestone: milestone,
        delayStatus,
        deliveredTimestamp:
          input.eventType === "delivered" ? new Date().toISOString() : existing.deliveredTimestamp,
      };
      const idx = this.records.findIndex((r) => r.shipmentId === input.shipmentId);
      if (idx >= 0) this.records[idx] = updated;
      updatedRecords.push(updated);
    }

    const validation = this.validator.validateTrackingResult({
      records: updatedRecords,
      failures,
      config,
      startedAt: started,
    });

    return this.metadataGenerator.generateTrackingReport({
      action: "webhook",
      records: updatedRecords,
      events,
      failures,
      invalidRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.records = [];
    this.eventProcessor.resetForTesting();
  }
}
