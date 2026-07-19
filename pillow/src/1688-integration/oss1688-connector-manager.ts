/** R2-04 — 1688 Connector Manager. */

import type { SupplierFrameworkEngine } from "../supplier-framework/engine.js";
import { OSS1688_SUPPLIER_ID, OSS1688_API_ENDPOINTS } from "./paths.js";
import { appendOssLog } from "./oss-logging.js";
import { Oss1688AuthenticationManager } from "./oss1688-authentication-manager.js";
import { Oss1688ApiClient } from "./oss1688-api-client.js";
import { Oss1688RequestRouter } from "./oss1688-request-router.js";
import { Oss1688ResponseHandler } from "./oss1688-response-handler.js";
import { Oss1688EventWebhookAdapter } from "./oss1688-event-webhook-adapter.js";
import { Oss1688RateLimitManager } from "./oss1688-rate-limit-manager.js";
import { Oss1688RetryManager } from "./oss1688-retry-manager.js";
import { Oss1688Validator } from "./oss1688-validator.js";
import { Oss1688MetadataGenerator, mapAuthToValidation } from "./oss1688-metadata-generator.js";
import type { Oss1688IntegrationConfiguration } from "./configuration.js";
import type {
  Oss1688ConnectorRecord,
  Oss1688ConnectorRunReport,
  ConnectOss1688Input,
  RouteOss1688ApiInput,
  HandleOss1688WebhookInput,
} from "./types.js";

export class Oss1688ConnectorManager {
  private connectorRecord: Oss1688ConnectorRecord | null = null;
  private readonly authManager = new Oss1688AuthenticationManager();
  private readonly apiClient = new Oss1688ApiClient();
  private readonly responseHandler = new Oss1688ResponseHandler();
  private readonly rateLimitManager = new Oss1688RateLimitManager();
  private readonly retryManager = new Oss1688RetryManager();
  private readonly webhookAdapter = new Oss1688EventWebhookAdapter();
  private readonly validator = new Oss1688Validator();
  private readonly metadataGenerator = new Oss1688MetadataGenerator();
  private requestRouter: Oss1688RequestRouter;

  constructor(private readonly framework: SupplierFrameworkEngine | null) {
    this.requestRouter = new Oss1688RequestRouter(
      this.apiClient,
      this.responseHandler,
      this.rateLimitManager,
      this.retryManager,
      framework,
    );
  }

  getConnectorRecord(): Oss1688ConnectorRecord | null {
    return this.connectorRecord;
  }

  registerWithFramework(config: Oss1688IntegrationConfiguration): {
    frameworkSupplierId: string | null;
    validation: Oss1688ConnectorRunReport["validation"];
  } {
    if (!this.framework) {
      return {
        frameworkSupplierId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? OSS1688_API_ENDPOINTS.sandbox
      : OSS1688_API_ENDPOINTS.production;

    const report = this.framework.registerSupplier({
      definition: {
        supplierIdentifier: OSS1688_SUPPLIER_ID,
        connectorVersion: "OSS-001-v1",
        connectorType: "supplier",
        integrationMissionId: "R2-04",
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

    appendOssLog({
      event: "connector_initialization",
      level: "info",
      details: `Registered 1688 with Supplier Framework: ${report.validation.decision}`,
    });

    return {
      frameworkSupplierId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `oss-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: "OSS-001-v1",
      },
    };
  }

  connectOss1688(
    input: ConnectOss1688Input,
    config: Oss1688IntegrationConfiguration,
  ): Oss1688ConnectorRunReport {
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
      validation.errors.push("1688 authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        record,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.framework) {
      this.framework.activateSupplier(OSS1688_SUPPLIER_ID);
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
      validation.errors.push("1688 connection test failed");
    }

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      record,
      validation,
      durationMs: Date.now() - started,
    });
  }

  testConnection(config: Oss1688IntegrationConfiguration): Oss1688ConnectorRunReport {
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
    input: RouteOss1688ApiInput,
    config: Oss1688IntegrationConfiguration,
  ): Promise<Oss1688ConnectorRunReport> {
    const started = Date.now();

    try {
      const routed = await this.requestRouter.route(input, config);
      const record = this.connectorRecord;
      if (!record) throw new Error("1688 connector not connected");

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
    input: HandleOss1688WebhookInput,
    config: Oss1688IntegrationConfiguration,
  ): Oss1688ConnectorRunReport {
    const started = Date.now();
    const webhook = this.webhookAdapter.handle(input, config);
    const record = this.connectorRecord;

    if (!record) {
      const validation = this.validator.validateConfiguration(config);
      validation.decision = "fail";
      validation.errors.push("1688 connector not connected");
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
        supplierIdentifier: OSS1688_SUPPLIER_ID,
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
