/** R2-03 — AliExpress Connector Manager. */

import type { SupplierFrameworkEngine } from "../supplier-framework/engine.js";
import { AEX_SUPPLIER_ID, AEX_API_ENDPOINTS } from "./paths.js";
import { appendAexLog } from "./aex-logging.js";
import { AliExpressAuthenticationManager } from "./aliexpress-authentication-manager.js";
import { AliExpressApiClient } from "./aliexpress-api-client.js";
import { AliExpressRequestRouter } from "./aliexpress-request-router.js";
import { AliExpressResponseHandler } from "./aliexpress-response-handler.js";
import { AliExpressEventWebhookAdapter } from "./aliexpress-event-webhook-adapter.js";
import { AliExpressRateLimitManager } from "./aliexpress-rate-limit-manager.js";
import { AliExpressRetryManager } from "./aliexpress-retry-manager.js";
import { AliExpressValidator } from "./aliexpress-validator.js";
import { AliExpressMetadataGenerator, mapAuthToValidation } from "./aliexpress-metadata-generator.js";
import type { AliExpressIntegrationConfiguration } from "./configuration.js";
import type {
  AliExpressConnectorRecord,
  AliExpressConnectorRunReport,
  ConnectAliExpressInput,
  RouteAliExpressApiInput,
  HandleAliExpressWebhookInput,
} from "./types.js";

export class AliExpressConnectorManager {
  private connectorRecord: AliExpressConnectorRecord | null = null;
  private readonly authManager = new AliExpressAuthenticationManager();
  private readonly apiClient = new AliExpressApiClient();
  private readonly responseHandler = new AliExpressResponseHandler();
  private readonly rateLimitManager = new AliExpressRateLimitManager();
  private readonly retryManager = new AliExpressRetryManager();
  private readonly webhookAdapter = new AliExpressEventWebhookAdapter();
  private readonly validator = new AliExpressValidator();
  private readonly metadataGenerator = new AliExpressMetadataGenerator();
  private requestRouter: AliExpressRequestRouter;

  constructor(private readonly framework: SupplierFrameworkEngine | null) {
    this.requestRouter = new AliExpressRequestRouter(
      this.apiClient,
      this.responseHandler,
      this.rateLimitManager,
      this.retryManager,
      framework,
    );
  }

  getConnectorRecord(): AliExpressConnectorRecord | null {
    return this.connectorRecord;
  }

  registerWithFramework(config: AliExpressIntegrationConfiguration): {
    frameworkSupplierId: string | null;
    validation: AliExpressConnectorRunReport["validation"];
  } {
    if (!this.framework) {
      return {
        frameworkSupplierId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? AEX_API_ENDPOINTS.sandbox
      : AEX_API_ENDPOINTS.production;

    const report = this.framework.registerSupplier({
      definition: {
        supplierIdentifier: AEX_SUPPLIER_ID,
        connectorVersion: "AEX-001-v1",
        connectorType: "supplier",
        integrationMissionId: "R2-03",
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

    appendAexLog({
      event: "connector_initialization",
      level: "info",
      details: `Registered AliExpress with Supplier Framework: ${report.validation.decision}`,
    });

    return {
      frameworkSupplierId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `aex-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: "AEX-001-v1",
      },
    };
  }

  connectAliExpress(
    input: ConnectAliExpressInput,
    config: AliExpressIntegrationConfiguration,
  ): AliExpressConnectorRunReport {
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
      validation.errors.push("AliExpress authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        record,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.framework) {
      this.framework.activateSupplier(AEX_SUPPLIER_ID);
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
      validation.errors.push("AliExpress connection test failed");
    }

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      record,
      validation,
      durationMs: Date.now() - started,
    });
  }

  testConnection(config: AliExpressIntegrationConfiguration): AliExpressConnectorRunReport {
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
    input: RouteAliExpressApiInput,
    config: AliExpressIntegrationConfiguration,
  ): Promise<AliExpressConnectorRunReport> {
    const started = Date.now();

    try {
      const routed = await this.requestRouter.route(input, config);
      const record = this.connectorRecord;
      if (!record) throw new Error("AliExpress connector not connected");

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
    input: HandleAliExpressWebhookInput,
    config: AliExpressIntegrationConfiguration,
  ): AliExpressConnectorRunReport {
    const started = Date.now();
    const webhook = this.webhookAdapter.handle(input, config);
    const record = this.connectorRecord;

    if (!record) {
      const validation = this.validator.validateConfiguration(config);
      validation.decision = "fail";
      validation.errors.push("AliExpress connector not connected");
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
        supplierIdentifier: AEX_SUPPLIER_ID,
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
