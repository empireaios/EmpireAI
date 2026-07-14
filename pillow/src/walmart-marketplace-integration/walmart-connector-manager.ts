/** R1-06 — Walmart Connector Manager. */

import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { WALMART_MARKETPLACE_ID, WALMART_API_ENDPOINTS } from "./paths.js";
import { appendWalmartLog } from "./wmt-logging.js";
import { WalmartAuthenticationManager } from "./walmart-authentication-manager.js";
import { WalmartApiClient } from "./walmart-api-client.js";
import { WalmartRequestRouter } from "./walmart-request-router.js";
import { WalmartResponseHandler } from "./walmart-response-handler.js";
import { WalmartRateLimitManager } from "./walmart-rate-limit-manager.js";
import { WalmartRetryManager } from "./walmart-retry-manager.js";
import { WalmartConnectorValidator } from "./walmart-connector-validator.js";
import {
  WalmartConnectorMetadataGenerator,
  mapAuthToValidation,
} from "./walmart-connector-metadata-generator.js";
import type { WalmartMarketplaceIntegrationConfiguration } from "./configuration.js";
import type {
  WalmartConnectorRecord,
  WalmartConnectorRunReport,
  ConnectWalmartInput,
  RouteWalmartApiInput,
} from "./types.js";

export class WalmartConnectorManager {
  private connectorRecord: WalmartConnectorRecord | null = null;
  private readonly authManager = new WalmartAuthenticationManager();
  private readonly apiClient = new WalmartApiClient();
  private readonly responseHandler = new WalmartResponseHandler();
  private readonly rateLimitManager = new WalmartRateLimitManager();
  private readonly retryManager = new WalmartRetryManager();
  private readonly validator = new WalmartConnectorValidator();
  private readonly metadataGenerator = new WalmartConnectorMetadataGenerator();
  private requestRouter: WalmartRequestRouter;

  constructor(private readonly framework: MarketplaceConnectorFrameworkEngine | null) {
    this.requestRouter = new WalmartRequestRouter(
      this.apiClient,
      this.responseHandler,
      this.rateLimitManager,
      this.retryManager,
      framework,
    );
  }

  getConnectorRecord(): WalmartConnectorRecord | null {
    return this.connectorRecord;
  }

  registerWithFramework(config: WalmartMarketplaceIntegrationConfiguration): {
    frameworkConnectorId: string | null;
    validation: WalmartConnectorRunReport["validation"];
  } {
    if (!this.framework) {
      return {
        frameworkConnectorId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? WALMART_API_ENDPOINTS.sandbox
      : WALMART_API_ENDPOINTS.production;

    const report = this.framework.registerConnector({
      definition: {
        marketplaceId: WALMART_MARKETPLACE_ID,
        connectorVersion: "WMT-001-v1",
        connectorType: "marketplace",
        integrationMissionId: "R1-06",
        authenticationMethod: "oauth2",
        credentialRef: config.credentialRef,
        apiEndpointConfig: {
          baseUrl: endpoint,
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v3",
        },
        webhookConfig: {
          enabled: false,
          pathPrefix: "/webhooks/walmart",
          signatureHeader: "x-walmart-signature",
          verifySignatures: false,
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
        ],
      },
      forceRegister: true,
    });

    appendWalmartLog({
      event: "connector_initialization",
      level: "info",
      details: `Registered Walmart connector with MCF: ${report.validation.decision}`,
    });

    return {
      frameworkConnectorId: report.records[0]?.connectorId ?? null,
      validation: {
        validationReportId: `wmt-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: "WMT-001-v1",
      },
    };
  }

  connectWalmart(
    input: ConnectWalmartInput,
    config: WalmartMarketplaceIntegrationConfiguration,
  ): WalmartConnectorRunReport {
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
      validation.errors.push("Walmart authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        record,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.framework) {
      this.framework.activateConnector(WALMART_MARKETPLACE_ID);
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
      validation.errors.push("Walmart connection test failed");
    }

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      record,
      validation,
      durationMs: Date.now() - started,
    });
  }

  testConnection(config: WalmartMarketplaceIntegrationConfiguration): WalmartConnectorRunReport {
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
    input: RouteWalmartApiInput,
    config: WalmartMarketplaceIntegrationConfiguration,
  ): Promise<WalmartConnectorRunReport> {
    const started = Date.now();

    try {
      const routed = await this.requestRouter.route(input, config);
      const record = this.connectorRecord;
      if (!record) throw new Error("Walmart connector not connected");

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

  resetForTesting(): void {
    this.connectorRecord = null;
    this.authManager.resetForTesting();
    this.rateLimitManager.resetForTesting();
  }
}
