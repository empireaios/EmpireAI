/** R1-02 — Amazon Connector Manager. */

import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { AMAZON_CAPABILITIES, AMAZON_MARKETPLACE_ID, AMAZON_SP_API_ENDPOINTS } from "./paths.js";
import { appendAmazonLog } from "./amz-logging.js";
import { AmazonAuthenticationManager } from "./amazon-authentication-manager.js";
import { AmazonApiClient } from "./amazon-api-client.js";
import { AmazonRequestRouter } from "./amazon-request-router.js";
import { AmazonResponseHandler } from "./amazon-response-handler.js";
import { AmazonEventAdapter } from "./amazon-event-adapter.js";
import { AmazonRateLimitManager } from "./amazon-rate-limit-manager.js";
import { AmazonRetryManager } from "./amazon-retry-manager.js";
import { AmazonConnectorValidator } from "./amazon-connector-validator.js";
import {
  AmazonConnectorMetadataGenerator,
  mapAuthToValidation,
} from "./amazon-connector-metadata-generator.js";
import type { AmazonMarketplaceIntegrationConfiguration } from "./configuration.js";
import type {
  AmazonConnectorRecord,
  AmazonConnectorRunReport,
  ConnectAmazonInput,
  HandleAmazonEventInput,
  RouteAmazonApiInput,
} from "./types.js";

export class AmazonConnectorManager {
  private connectorRecord: AmazonConnectorRecord | null = null;
  private readonly authManager = new AmazonAuthenticationManager();
  private readonly apiClient = new AmazonApiClient();
  private readonly responseHandler = new AmazonResponseHandler();
  private readonly rateLimitManager = new AmazonRateLimitManager();
  private readonly retryManager = new AmazonRetryManager();
  private readonly validator = new AmazonConnectorValidator();
  private readonly metadataGenerator = new AmazonConnectorMetadataGenerator();
  private requestRouter: AmazonRequestRouter;
  private eventAdapter: AmazonEventAdapter;

  constructor(private readonly framework: MarketplaceConnectorFrameworkEngine | null) {
    this.requestRouter = new AmazonRequestRouter(
      this.apiClient,
      this.responseHandler,
      this.rateLimitManager,
      this.retryManager,
      framework,
    );
    this.eventAdapter = new AmazonEventAdapter(framework);
  }

  getConnectorRecord(): AmazonConnectorRecord | null {
    return this.connectorRecord;
  }

  registerWithFramework(config: AmazonMarketplaceIntegrationConfiguration): {
    frameworkConnectorId: string | null;
    validation: AmazonConnectorRunReport["validation"];
  } {
    if (!this.framework) {
      return {
        frameworkConnectorId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? AMAZON_SP_API_ENDPOINTS.sandboxNa
      : AMAZON_SP_API_ENDPOINTS[config.defaultRegion];

    const report = this.framework.registerConnector({
      definition: {
        marketplaceId: AMAZON_MARKETPLACE_ID,
        connectorVersion: "AMZ-001-v1",
        connectorType: "marketplace",
        integrationMissionId: "R1-02",
        authenticationMethod: "oauth2",
        credentialRef: config.credentialRef,
        apiEndpointConfig: {
          baseUrl: endpoint,
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v2021",
        },
        webhookConfig: {
          enabled: true,
          pathPrefix: "/webhooks/amazon",
          signatureHeader: "x-amz-sns-message-type",
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

    appendAmazonLog({
      event: "connector_initialization",
      level: "info",
      details: `Registered Amazon connector with MCF: ${report.validation.decision}`,
    });

    return {
      frameworkConnectorId: report.records[0]?.connectorId ?? null,
      validation: {
        validationReportId: `amz-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: "AMZ-001-v1",
      },
    };
  }

  connectAmazon(
    input: ConnectAmazonInput,
    config: AmazonMarketplaceIntegrationConfiguration,
  ): AmazonConnectorRunReport {
    const started = Date.now();
    const region = input.region ?? config.defaultRegion;
    const credentialRef = input.credentialRef ?? config.credentialRef;

    const frameworkReg = this.registerWithFramework(config);
    const auth = this.authManager.authenticate(credentialRef, region, config);

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
      validation.errors.push("Amazon authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        record,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.framework) {
      this.framework.activateConnector(AMAZON_MARKETPLACE_ID);
    }

    const connection = this.apiClient.testConnection(region, config);
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
      validation.errors.push("Amazon connection test failed");
    }

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      record,
      validation,
      durationMs: Date.now() - started,
    });
  }

  testConnection(config: AmazonMarketplaceIntegrationConfiguration): AmazonConnectorRunReport {
    const started = Date.now();
    const region = config.defaultRegion;
    const connection = this.apiClient.testConnection(region, config);
    const auth = this.authManager.authenticate(config.credentialRef, region, config);

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
    input: RouteAmazonApiInput,
    config: AmazonMarketplaceIntegrationConfiguration,
  ): Promise<AmazonConnectorRunReport> {
    const started = Date.now();
    const region = input.region ?? config.defaultRegion;

    try {
      const routed = await this.requestRouter.route(input, region, config);
      const record = this.connectorRecord;
      if (!record) throw new Error("Amazon connector not connected");

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
            region,
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
    input: HandleAmazonEventInput,
    config: AmazonMarketplaceIntegrationConfiguration,
  ): AmazonConnectorRunReport {
    const started = Date.now();
    const result = this.eventAdapter.handle(input, config);
    const record = this.connectorRecord;
    if (!record) throw new Error("Amazon connector not connected");

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
