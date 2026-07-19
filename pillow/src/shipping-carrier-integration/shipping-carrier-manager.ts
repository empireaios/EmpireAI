/** R2-11 — Shipping Carrier Manager. */

import type { FulfilmentOrchestrator } from "../fulfilment-orchestrator/engine.js";
import { appendSciLog } from "./sci-logging.js";
import { CarrierRegistry } from "./carrier-registry.js";
import { CarrierAuthenticationManager } from "./carrier-authentication-manager.js";
import { CarrierApiClient } from "./carrier-api-client.js";
import { ShippingRequestEngine } from "./shipping-request-engine.js";
import { ShippingLabelEngine } from "./shipping-label-engine.js";
import { CarrierResponseHandler } from "./carrier-response-handler.js";
import { CarrierValidationEngine, CarrierValidator, CarrierMetadataGenerator } from "./carrier-validator.js";
import { getFixtureShipmentInput, getDefaultCarrierId } from "./carrier-fixtures.js";
import { SUPPORTED_CARRIER_IDENTIFIERS } from "./paths.js";
import type { ShippingCarrierIntegrationConfiguration } from "./configuration.js";
import type {
  CarrierFailureFinding,
  CarrierRegistration,
  CreateShipmentRequestInput,
  InvalidShipmentFinding,
  RegisterCarrierInput,
  RequestShippingLabelInput,
  RequestShippingRatesInput,
  ShipmentRecord,
  ShipmentReport,
  ShippingRateQuote,
  SupportedCarrierIdentifier,
} from "./types.js";

export class ShippingCarrierManager {
  private records: ShipmentRecord[] = [];
  private readonly registry = new CarrierRegistry();
  private readonly authManager = new CarrierAuthenticationManager();
  private readonly apiClient = new CarrierApiClient();
  private readonly requestEngine = new ShippingRequestEngine();
  private readonly labelEngine = new ShippingLabelEngine();
  private readonly responseHandler = new CarrierResponseHandler();
  private readonly validationEngine = new CarrierValidationEngine();
  private readonly validator = new CarrierValidator();
  private readonly metadataGenerator = new CarrierMetadataGenerator();

  constructor(private readonly fulfilmentOrchestrator: FulfilmentOrchestrator | null) {}

  getRecords(): ShipmentRecord[] {
    return [...this.records];
  }

  getCarriers(): CarrierRegistration[] {
    return this.registry.getAll();
  }

  registerCarriers(
    input: RegisterCarrierInput,
    config: ShippingCarrierIntegrationConfiguration,
  ): ShipmentReport {
    const started = Date.now();
    const failures: CarrierFailureFinding[] = [];

    if (!config.carrierRegistrationRulesEnabled) {
      failures.push({
        shipmentId: "sci-reg-fail",
        failureType: "api_failure",
        details: "Carrier registration rules disabled",
      });
    }

    const registrations: CarrierRegistration[] = [];
    if (input.registerAllSupported !== false && !input.carrierId) {
      for (const carrierId of SUPPORTED_CARRIER_IDENTIFIERS) {
        const session = config.authenticationRulesEnabled
          ? this.authManager.authenticate({ carrierId, config })
          : null;
        const reg = this.registry.register(carrierId, session?.sessionId ?? null);
        registrations.push(reg);
        appendSciLog({
          event: "carrier_registration",
          level: "info",
          details: `Registered carrier ${carrierId} (${reg.carrierName})`,
        });
        if (session) {
          appendSciLog({
            event: "authentication_event",
            level: "info",
            details: `Authenticated carrier ${carrierId} — session ${session.sessionId}`,
          });
        }
      }
    } else if (input.carrierId) {
      const session = config.authenticationRulesEnabled
        ? this.authManager.authenticate({ carrierId: input.carrierId, config })
        : null;
      registrations.push(this.registry.register(input.carrierId, session?.sessionId ?? null));
    }

    const validation = this.validator.validateShipmentResult({
      records: [],
      failures,
      config,
      startedAt: started,
    });

    return this.metadataGenerator.generateShipmentReport({
      action: "register",
      records: [],
      rates: [],
      failures,
      invalidRequests: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  resolveShipmentInput(input: CreateShipmentRequestInput) {
    if (input.orderReference && input.fulfilmentReference) {
      return {
        carrierId: input.carrierId ?? getDefaultCarrierId(),
        orderReference: input.orderReference,
        fulfilmentReference: input.fulfilmentReference,
      };
    }

    const fulfilments = this.fulfilmentOrchestrator?.getRecords() ?? [];
    const fulfilled = fulfilments.filter((f) => f.fulfilmentStatus === "fulfilled");
    if (fulfilled.length) {
      const f = fulfilled[0]!;
      return {
        carrierId: input.carrierId ?? this.requestEngine.mapFulfilmentToCarrier(f),
        orderReference: input.orderReference ?? f.orderReference,
        fulfilmentReference: input.fulfilmentReference ?? f.fulfilmentId,
        fulfilment: f,
      };
    }

    if (input.includeFixtureShipment !== false) {
      const fixture = getFixtureShipmentInput();
      return {
        carrierId: input.carrierId ?? fixture.carrierId,
        orderReference: input.orderReference ?? fixture.orderReference,
        fulfilmentReference: input.fulfilmentReference ?? fixture.fulfilmentReference,
        fulfilment: null,
      };
    }

    return null;
  }

  createShipmentRequest(
    input: CreateShipmentRequestInput,
    config: ShippingCarrierIntegrationConfiguration,
  ): ShipmentReport {
    const started = Date.now();
    const failures: CarrierFailureFinding[] = [];
    const invalidRequests: InvalidShipmentFinding[] = [];

    const invalid = this.validationEngine.detectInvalidShipmentRequest(input);
    if (invalid) {
      invalidRequests.push(invalid);
      const validation = this.validator.validateShipmentResult({
        records: [],
        failures: [{ shipmentId: "sci-invalid", failureType: "shipment_creation", details: invalid.errors.join("; ") }],
        config,
        startedAt: started,
      });
      return this.metadataGenerator.generateShipmentReport({
        action: "create",
        records: [],
        rates: [],
        failures: [{ shipmentId: "sci-invalid", failureType: "shipment_creation", details: invalid.errors.join("; ") }],
        invalidRequests,
        validation,
        durationMs: Date.now() - started,
      });
    }

    const resolved = this.resolveShipmentInput(input);
    if (!resolved) {
      failures.push({
        shipmentId: `sci-fail-${Date.now()}`,
        failureType: "shipment_creation",
        details: "No fulfilment record available for shipment",
      });
      const validation = this.validator.validateShipmentResult({
        records: [],
        failures,
        config,
        startedAt: started,
      });
      return this.metadataGenerator.generateShipmentReport({
        action: "create",
        records: [],
        rates: [],
        failures,
        invalidRequests,
        validation,
        durationMs: Date.now() - started,
      });
    }

    const carrierId = resolved.carrierId;
    if (!this.registry.isRegistered(carrierId)) {
      this.registerCarriers({ carrierId }, config);
    }

    if (config.authenticationRulesEnabled && !this.authManager.validateCredentials(carrierId)) {
      this.authManager.authenticate({ carrierId, config });
    }

    const apiResponse = this.apiClient.createShipmentRequest({
      carrierId,
      orderReference: resolved.orderReference,
      fulfilmentReference: resolved.fulfilmentReference,
      config,
    });

    const tempId = `sci-pending-${Date.now()}`;
    const apiFailure = this.responseHandler.handleFailure({
      shipmentId: tempId,
      response: apiResponse,
      context: "shipment creation",
    });
    if (apiFailure) {
      failures.push(apiFailure);
      const validation = this.validator.validateShipmentResult({
        records: [],
        failures,
        config,
        startedAt: started,
      });
      return this.metadataGenerator.generateShipmentReport({
        action: "create",
        records: [],
        rates: [],
        failures,
        invalidRequests,
        validation,
        durationMs: Date.now() - started,
      });
    }

    let record = this.requestEngine.buildShipmentRecord({
      carrierId,
      orderReference: resolved.orderReference,
      fulfilmentReference: resolved.fulfilmentReference,
      shipmentRequestId: apiResponse.data!.shipmentRequestId,
      fulfilment: resolved.fulfilment ?? null,
    });

    appendSciLog({
      event: "shipment_creation",
      level: "info",
      details: `Shipment ${record.shipmentId} created via ${carrierId}`,
    });

    if (config.shipmentRequestRulesEnabled) {
      const labelResponse = this.apiClient.requestLabel({
        carrierId,
        shipmentRequestId: record.shipmentRequestId,
      });
      const labelFailure = this.responseHandler.handleFailure({
        shipmentId: record.shipmentId,
        response: labelResponse,
        context: "label generation",
      });
      if (labelFailure) {
        failures.push(labelFailure);
      } else {
        record = this.labelEngine.attachLabel(record, labelResponse.data!.labelReference);
        record = this.labelEngine.confirmShipment(record);
        appendSciLog({
          event: "label_generation",
          level: "info",
          details: `Label ${record.shippingLabelReference} for ${record.shipmentId}`,
        });
      }
    }

    const records = [record];
    const validation = this.validator.validateShipmentResult({
      records,
      failures,
      config,
      startedAt: started,
    });

    if (validation.decision !== "fail" || !config.preserveExistingOnValidationFailure) {
      this.records.push(record);
    }

    return this.metadataGenerator.generateShipmentReport({
      action: "create",
      records: validation.decision === "fail" && config.preserveExistingOnValidationFailure ? [] : records,
      rates: [],
      failures,
      invalidRequests,
      validation,
      durationMs: Date.now() - started,
    });
  }

  requestShippingLabel(
    input: RequestShippingLabelInput,
    config: ShippingCarrierIntegrationConfiguration,
  ): ShipmentReport {
    const started = Date.now();
    const failures: CarrierFailureFinding[] = [];
    const existing = this.records.find((r) => r.shipmentId === input.shipmentId);

    if (!existing) {
      failures.push({
        shipmentId: input.shipmentId,
        failureType: "shipment_creation",
        details: "Shipment record not found",
      });
      const validation = this.validator.validateShipmentResult({
        records: [],
        failures,
        config,
        startedAt: started,
      });
      return this.metadataGenerator.generateShipmentReport({
        action: "label",
        records: [],
        rates: [],
        failures,
        invalidRequests: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const labelResponse = this.apiClient.requestLabel({
      carrierId: existing.carrierId,
      shipmentRequestId: existing.shipmentRequestId,
    });
    const labelFailure = this.responseHandler.handleFailure({
      shipmentId: existing.shipmentId,
      response: labelResponse,
      context: "label generation",
    });

    let record = existing;
    if (labelFailure) {
      failures.push(labelFailure);
    } else {
      record = this.labelEngine.attachLabel(existing, labelResponse.data!.labelReference);
      const idx = this.records.findIndex((r) => r.shipmentId === input.shipmentId);
      if (idx >= 0) this.records[idx] = record;
    }

    const validation = this.validator.validateShipmentResult({
      records: [record],
      failures,
      config,
      startedAt: started,
    });

    return this.metadataGenerator.generateShipmentReport({
      action: "label",
      records: [record],
      rates: [],
      failures,
      invalidRequests: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  requestShippingRates(
    input: RequestShippingRatesInput,
    config: ShippingCarrierIntegrationConfiguration,
  ): ShipmentReport {
    const started = Date.now();
    const rates: ShippingRateQuote[] = [];
    const carrierIds = input.carrierId
      ? [input.carrierId]
      : [...SUPPORTED_CARRIER_IDENTIFIERS];

    for (const carrierId of carrierIds) {
      if (!this.registry.isRegistered(carrierId)) {
        this.registerCarriers({ carrierId }, config);
      }
      const response = this.apiClient.requestRates(carrierId);
      if (response.success && response.data) {
        rates.push({
          quoteId: `sci-quote-${carrierId}-${Date.now()}`,
          carrierId,
          rate: response.data.rate,
          currency: response.data.currency,
          estimatedDays: response.data.estimatedDays,
        });
      }
    }

    const validation = this.validator.validateShipmentResult({
      records: [],
      failures: [],
      config,
      startedAt: started,
    });

    return this.metadataGenerator.generateShipmentReport({
      action: "rate",
      records: [],
      rates,
      failures: [],
      invalidRequests: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.records = [];
    this.registry.resetForTesting();
    this.authManager.resetForTesting();
    this.apiClient.resetForTesting();
  }
}
