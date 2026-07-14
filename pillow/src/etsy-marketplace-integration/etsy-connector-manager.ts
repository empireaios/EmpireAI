/** R1-07 — Etsy Connector Manager. */

import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { ETSY_MARKETPLACE_ID, ETSY_API_ENDPOINTS } from "./paths.js";
import { appendEtsyLog } from "./etsy-logging.js";
import { EtsyAuthenticationManager } from "./etsy-authentication-manager.js";
import { EtsyApiClient } from "./etsy-api-client.js";
import { EtsyRequestRouter } from "./etsy-request-router.js";
import { EtsyResponseHandler } from "./etsy-response-handler.js";
import { EtsyEventAdapter } from "./etsy-event-adapter.js";
import { EtsyRateLimitManager } from "./etsy-rate-limit-manager.js";
import { EtsyRetryManager } from "./etsy-retry-manager.js";
import { EtsyConnectorValidator } from "./etsy-connector-validator.js";
import {
  EtsyConnectorMetadataGenerator,
  mapAuthToValidation,
} from "./etsy-connector-metadata-generator.js";
import type { EtsyMarketplaceIntegrationConfiguration } from "./configuration.js";
import type {
  EtsyConnectorRecord,
  EtsyConnectorRunReport,
  ConnectEtsyInput,
  HandleEtsyEventInput,
  RouteEtsyApiInput,
} from "./types.js";

export class EtsyConnectorManager {
  private connectorRecord: EtsyConnectorRecord | null = null;
  private readonly authManager = new EtsyAuthenticationManager();
  private readonly apiClient = new EtsyApiClient();
  private readonly responseHandler = new EtsyResponseHandler();
  private readonly rateLimitManager = new EtsyRateLimitManager();
  private readonly retryManager = new EtsyRetryManager();
  private readonly validator = new EtsyConnectorValidator();
  private readonly metadataGenerator = new EtsyConnectorMetadataGenerator();
  private requestRouter: EtsyRequestRouter;
  private eventAdapter: EtsyEventAdapter;

  constructor(private readonly framework: MarketplaceConnectorFrameworkEngine | null) {
    this.requestRouter = new EtsyRequestRouter(
      this.apiClient,
      this.responseHandler,
      this.rateLimitManager,
      this.retryManager,
      framework,
    );
    this.eventAdapter = new EtsyEventAdapter(framework);
  }

  getConnectorRecord(): EtsyConnectorRecord | null {
    return this.connectorRecord;
  }

  registerWithFramework(config: EtsyMarketplaceIntegrationConfiguration): {
    frameworkConnectorId: string | null;
    validation: EtsyConnectorRunReport["validation"];
  } {
    if (!this.framework) {
      return {
        frameworkConnectorId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? ETSY_API_ENDPOINTS.sandbox
      : ETSY_API_ENDPOINTS.production;

    const report = this.framework.registerConnector({
      definition: {
        marketplaceId: ETSY_MARKETPLACE_ID,
        connectorVersion: "ETSY-001-v1",
        connectorType: "marketplace",
        integrationMissionId: "R1-07",
        authenticationMethod: "oauth2",
        credentialRef: config.credentialRef,
        apiEndpointConfig: {
          baseUrl: endpoint,
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v3",
        },
        webhookConfig: {
          enabled: true,
          pathPrefix: "/webhooks/etsy",
          signatureHeader: "x-etsy-signature",
          verifySignatures: config.eventSignatureVerificationEnabled,
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
          "connector_registration",
          "connector_activation",
          "api_request_routing",
          "webhook_handling",
        ],
      },
      forceRegister: true,
    });

    appendEtsyLog({
      event: "connector_initialization",
      level: "info",
      details: `Registered Etsy connector with MCF: ${report.validation.decision}`,
    });

    return {
      frameworkConnectorId: report.records[0]?.connectorId ?? null,
      validation: {
        validationReportId: `etsy-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: "ETSY-001-v1",
      },
    };
  }

  connectEtsy(
    input: ConnectEtsyInput,
    config: EtsyMarketplaceIntegrationConfiguration,
  ): EtsyConnectorRunReport {
    const started = Date.now();
    const credentialRef = input.credentialRef ?? config.credentialRef;

    const frameworkReg = this.registerWithFramework(config);
    const auth = this.authManager.authenticate(credentialRef, config);

    if (!auth.authenticated) {
      const record = this.metadataGenerator.buildRecord({
        frameworkConnectorId: frameworkReg.frameworkConnectorId,
        auth,
        connection: null,
        operationalState: "failed",
        validationStatus: "failed",
        credentialRefPresent: auth.credentialRefPresent,
      });
      this.connectorRecord = record;
      const validation = this.validator.validateRecord(record);
      validation.decision = "fail";
      validation.errors.push("Etsy authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        record,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.framework) {
      this.framework.activateConnector(ETSY_MARKETPLACE_ID);
    }

    const connection = this.apiClient.testConnection(config);
    const record = this.metadataGenerator.buildRecord({
      frameworkConnectorId: frameworkReg.frameworkConnectorId,
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
      validation.errors.push("Etsy connection test failed");
    }

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      record,
      validation,
      durationMs: Date.now() - started,
    });
  }

  testConnection(config: EtsyMarketplaceIntegrationConfiguration): EtsyConnectorRunReport {
    const started = Date.now();
    const connection = this.apiClient.testConnection(config);
    const auth = this.authManager.authenticate(config.credentialRef, config);

    const record =
      this.connectorRecord ??
      this.metadataGenerator.buildRecord({
        frameworkConnectorId: null,
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
    input: RouteEtsyApiInput,
    config: EtsyMarketplaceIntegrationConfiguration,
  ): Promise<EtsyConnectorRunReport> {
    const started = Date.now();

    try {
      const routed = await this.requestRouter.route(input, config);
      const record = this.connectorRecord;
      if (!record) throw new Error("Etsy connector not connected");

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
          frameworkConnectorId: null,
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

  handleEvent(
    input: HandleEtsyEventInput,
    config: EtsyMarketplaceIntegrationConfiguration,
  ): EtsyConnectorRunReport {
    const started = Date.now();
    const result = this.eventAdapter.handle(input, config);
    const record = this.connectorRecord;
    if (!record) throw new Error("Etsy connector not connected");

    const validation = this.validator.validateRecord(record);
    if (!result.accepted) validation.warnings.push(result.details);

    return this.metadataGenerator.buildRunReport({
      action: "handle_event",
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
