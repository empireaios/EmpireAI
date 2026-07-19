/** R2-02 — CJdropshipping Connector Manager. */

import type { SupplierFrameworkEngine } from "../supplier-framework/engine.js";
import { CJ_SUPPLIER_ID, CJ_API_ENDPOINTS } from "./paths.js";
import { appendCjLog } from "./cj-logging.js";
import { CjAuthenticationManager } from "./cj-authentication-manager.js";
import { CjApiClient } from "./cj-api-client.js";
import { CjRequestRouter } from "./cj-request-router.js";
import { CjResponseHandler } from "./cj-response-handler.js";
import { CjEventWebhookAdapter } from "./cj-event-webhook-adapter.js";
import { CjRateLimitManager } from "./cj-rate-limit-manager.js";
import { CjRetryManager } from "./cj-retry-manager.js";
import { CjValidator } from "./cj-validator.js";
import { CjMetadataGenerator, mapAuthToValidation } from "./cj-metadata-generator.js";
import type { CjDropshippingIntegrationConfiguration } from "./configuration.js";
import type {
  CjConnectorRecord,
  CjConnectorRunReport,
  ConnectCjDropshippingInput,
  RouteCjApiInput,
  HandleCjWebhookInput,
} from "./types.js";

export class CjConnectorManager {
  private connectorRecord: CjConnectorRecord | null = null;
  private readonly authManager = new CjAuthenticationManager();
  private readonly apiClient = new CjApiClient();
  private readonly responseHandler = new CjResponseHandler();
  private readonly rateLimitManager = new CjRateLimitManager();
  private readonly retryManager = new CjRetryManager();
  private readonly webhookAdapter = new CjEventWebhookAdapter();
  private readonly validator = new CjValidator();
  private readonly metadataGenerator = new CjMetadataGenerator();
  private requestRouter: CjRequestRouter;

  constructor(private readonly framework: SupplierFrameworkEngine | null) {
    this.requestRouter = new CjRequestRouter(
      this.apiClient,
      this.responseHandler,
      this.rateLimitManager,
      this.retryManager,
      framework,
    );
  }

  getConnectorRecord(): CjConnectorRecord | null {
    return this.connectorRecord;
  }

  registerWithFramework(config: CjDropshippingIntegrationConfiguration): {
    frameworkSupplierId: string | null;
    validation: CjConnectorRunReport["validation"];
  } {
    if (!this.framework) {
      return {
        frameworkSupplierId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? CJ_API_ENDPOINTS.sandbox
      : CJ_API_ENDPOINTS.production;

    const report = this.framework.registerSupplier({
      definition: {
        supplierIdentifier: CJ_SUPPLIER_ID,
        connectorVersion: "CJ-001-v1",
        connectorType: "supplier",
        integrationMissionId: "R2-02",
        authenticationMethod: "api_key",
        credentialRef: config.credentialRef,
        apiEndpointConfig: {
          baseUrl: endpoint,
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["product.updated", "inventory.changed", "order.shipped"],
          maxEventsPerMinute: config.requestsPerMinute,
          windowMs: config.rateLimitWindowMs,
        },
        rateLimitConfig: {
          enabled: config.rateLimitEnabled,
          requestsPerMinute: config.requestsPerMinute,
          burstLimit: config.burstLimit,
          windowMs: config.rateLimitWindowMs,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "supplier_registration",
          "supplier_activation",
          "supplier_event_routing",
        ],
      },
      forceRegister: true,
    });

    appendCjLog({
      event: "connector_initialization",
      level: "info",
      details: `Registered CJdropshipping with Supplier Framework: ${report.validation.decision}`,
    });

    return {
      frameworkSupplierId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `cj-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: "CJ-001-v1",
      },
    };
  }

  connectCjDropshipping(
    input: ConnectCjDropshippingInput,
    config: CjDropshippingIntegrationConfiguration,
  ): CjConnectorRunReport {
    const started = Date.now();
    const credentialRef = input.credentialRef ?? config.credentialRef;

    const frameworkReg = this.registerWithFramework(config);
    const auth = this.authManager.authenticate(credentialRef, config);

    if (!auth.authenticated) {
      const record = this.metadataGenerator.buildRecord({
        frameworkSupplierId: frameworkReg.frameworkSupplierId,
        auth,
        connection: null,
        operationalState: "failed",
        validationStatus: "failed",
        credentialRefPresent: auth.credentialRefPresent,
      });
      this.connectorRecord = record;
      const validation = this.validator.validateRecord(record);
      validation.decision = "fail";
      validation.errors.push("CJdropshipping authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        record,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.framework) {
      this.framework.activateSupplier(CJ_SUPPLIER_ID);
    }

    const connection = this.apiClient.testConnection(config);
    const record = this.metadataGenerator.buildRecord({
      frameworkSupplierId: frameworkReg.frameworkSupplierId,
      auth,
      connection,
      operationalState: connection.passed ? "active" : "failed",
      validationStatus: mapAuthToValidation(auth),
      credentialRefPresent: auth.credentialRefPresent,
    });
    this.connectorRecord = record;

    const validation = this.validator.validateRecord(record);
    if (!connection.passed) {
      validation.decision = "fail";
      validation.errors.push("CJdropshipping connection test failed");
    }

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      record,
      validation,
      durationMs: Date.now() - started,
    });
  }

  testConnection(config: CjDropshippingIntegrationConfiguration): CjConnectorRunReport {
    const started = Date.now();
    const connection = this.apiClient.testConnection(config);
    const auth = this.authManager.authenticate(config.credentialRef, config);

    const record =
      this.connectorRecord ??
      this.metadataGenerator.buildRecord({
        frameworkSupplierId: null,
        auth,
        connection,
        operationalState: connection.passed ? "connected" : "failed",
        validationStatus: connection.passed ? "passed" : "failed",
        credentialRefPresent: auth.credentialRefPresent,
      });

    record.connectionStatus = connection.connectionStatus;
    record.timestamp = new Date().toISOString();
    this.connectorRecord = record;

    const validation = this.validator.validateRecord(record);
    if (!connection.passed) validation.decision = "fail";

    return this.metadataGenerator.buildRunReport({
      action: "test_connection",
      record,
      validation,
      durationMs: Date.now() - started,
    });
  }

  async routeApi(
    input: RouteCjApiInput,
    config: CjDropshippingIntegrationConfiguration,
  ): Promise<CjConnectorRunReport> {
    const started = Date.now();

    try {
      const routed = await this.requestRouter.route(input, config);
      const record = this.connectorRecord;
      if (!record) throw new Error("CJdropshipping connector not connected");

      const validation = this.validator.validateRecord(record);
      if (routed.rateLimited) validation.warnings.push("Request was rate limited");

      return this.metadataGenerator.buildRunReport({
        action: "route_api",
        record,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const record =
        this.connectorRecord ??
        this.metadataGenerator.buildRecord({
          frameworkSupplierId: null,
          auth: {
            authenticated: false,
            authenticationStatus: "failed",
            sessionStatus: "failed",
            credentialRefPresent: false,
            tokenExposed: false,
            details: "Not connected",
          },
          connection: null,
          operationalState: "failed",
          validationStatus: "failed",
          credentialRefPresent: false,
        });

      const validation = this.validator.validateRecord(record);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "API routing failed");

      return this.metadataGenerator.buildRunReport({
        action: "route_api",
        record,
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  handleWebhook(
    input: HandleCjWebhookInput,
    config: CjDropshippingIntegrationConfiguration,
  ): CjConnectorRunReport {
    const started = Date.now();
    const webhook = this.webhookAdapter.handle(input, config);
    const record = this.connectorRecord;

    if (!record) {
      const validation = this.validator.validateConfiguration(config);
      validation.decision = "fail";
      validation.errors.push("CJdropshipping connector not connected");
      return this.metadataGenerator.buildRunReport({
        action: "handle_webhook",
        record: this.metadataGenerator.buildRecord({
          frameworkSupplierId: null,
          auth: {
            authenticated: false,
            authenticationStatus: "unauthenticated",
            sessionStatus: "none",
            credentialRefPresent: false,
            tokenExposed: false,
            details: "Not connected",
          },
          connection: null,
          operationalState: "failed",
          validationStatus: "failed",
          credentialRefPresent: false,
        }),
        validation,
        durationMs: Date.now() - started,
      });
    }

    const validation = this.validator.validateRecord(record);
    if (!webhook.accepted) {
      validation.decision = "fail";
      validation.errors.push(webhook.details);
    }

    if (this.framework) {
      this.framework.routeSupplierEvent({
        supplierIdentifier: CJ_SUPPLIER_ID,
        topic: input.topic,
        payloadRef: input.payloadRef,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "handle_webhook",
      record,
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.connectorRecord = null;
    this.authManager.resetForTesting();
    this.rateLimitManager.resetForTesting();
  }
}
