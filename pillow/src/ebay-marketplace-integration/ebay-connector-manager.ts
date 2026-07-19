/** R1-08 — eBay Connector Manager. */

import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { EBAY_MARKETPLACE_ID, EBAY_API_ENDPOINTS } from "./paths.js";
import { appendEbayLog } from "./ebay-logging.js";
import { EbayAuthenticationManager } from "./ebay-authentication-manager.js";
import { EbayApiClient } from "./ebay-api-client.js";
import { EbayRequestRouter } from "./ebay-request-router.js";
import { EbayResponseHandler } from "./ebay-response-handler.js";
import { EbayEventAdapter } from "./ebay-event-adapter.js";
import { EbayRateLimitManager } from "./ebay-rate-limit-manager.js";
import { EbayRetryManager } from "./ebay-retry-manager.js";
import { EbayConnectorValidator } from "./ebay-connector-validator.js";
import {
  EbayConnectorMetadataGenerator,
  mapAuthToValidation,
} from "./ebay-connector-metadata-generator.js";
import type { EbayMarketplaceIntegrationConfiguration } from "./configuration.js";
import type {
  EbayConnectorRecord,
  EbayConnectorRunReport,
  ConnectEbayInput,
  HandleEbayEventInput,
  RouteEbayApiInput,
} from "./types.js";

export class EbayConnectorManager {
  private connectorRecord: EbayConnectorRecord | null = null;
  private readonly authManager = new EbayAuthenticationManager();
  private readonly apiClient = new EbayApiClient();
  private readonly responseHandler = new EbayResponseHandler();
  private readonly rateLimitManager = new EbayRateLimitManager();
  private readonly retryManager = new EbayRetryManager();
  private readonly validator = new EbayConnectorValidator();
  private readonly metadataGenerator = new EbayConnectorMetadataGenerator();
  private requestRouter: EbayRequestRouter;
  private eventAdapter: EbayEventAdapter;

  constructor(private readonly framework: MarketplaceConnectorFrameworkEngine | null) {
    this.requestRouter = new EbayRequestRouter(
      this.apiClient,
      this.responseHandler,
      this.rateLimitManager,
      this.retryManager,
      framework,
    );
    this.eventAdapter = new EbayEventAdapter(framework);
  }

  getConnectorRecord(): EbayConnectorRecord | null {
    return this.connectorRecord;
  }

  registerWithFramework(config: EbayMarketplaceIntegrationConfiguration): {
    frameworkConnectorId: string | null;
    validation: EbayConnectorRunReport["validation"];
  } {
    if (!this.framework) {
      return {
        frameworkConnectorId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? EBAY_API_ENDPOINTS.sandbox
      : EBAY_API_ENDPOINTS.production;

    const report = this.framework.registerConnector({
      definition: {
        marketplaceId: EBAY_MARKETPLACE_ID,
        connectorVersion: "EBAY-001-v1",
        connectorType: "marketplace",
        integrationMissionId: "R1-08",
        authenticationMethod: "oauth2",
        credentialRef: config.credentialRef,
        apiEndpointConfig: {
          baseUrl: endpoint,
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        webhookConfig: {
          enabled: true,
          pathPrefix: "/webhooks/ebay",
          signatureHeader: "x-ebay-signature",
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

    appendEbayLog({
      event: "connector_initialization",
      level: "info",
      details: `Registered eBay connector with MCF: ${report.validation.decision}`,
    });

    return {
      frameworkConnectorId: report.records[0]?.connectorId ?? null,
      validation: {
        validationReportId: `ebay-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: "EBAY-001-v1",
      },
    };
  }

  connectEbay(
    input: ConnectEbayInput,
    config: EbayMarketplaceIntegrationConfiguration,
  ): EbayConnectorRunReport {
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
      validation.errors.push("eBay authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        record,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.framework) {
      this.framework.activateConnector(EBAY_MARKETPLACE_ID);
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
      validation.errors.push("eBay connection test failed");
    }

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      record,
      validation,
      durationMs: Date.now() - started,
    });
  }

  testConnection(config: EbayMarketplaceIntegrationConfiguration): EbayConnectorRunReport {
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
    input: RouteEbayApiInput,
    config: EbayMarketplaceIntegrationConfiguration,
  ): Promise<EbayConnectorRunReport> {
    const started = Date.now();

    try {
      const routed = await this.requestRouter.route(input, config);
      const record = this.connectorRecord;
      if (!record) throw new Error("eBay connector not connected");

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
    input: HandleEbayEventInput,
    config: EbayMarketplaceIntegrationConfiguration,
  ): EbayConnectorRunReport {
    const started = Date.now();
    const result = this.eventAdapter.handle(input, config);
    const record = this.connectorRecord;
    if (!record) throw new Error("eBay connector not connected");

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
