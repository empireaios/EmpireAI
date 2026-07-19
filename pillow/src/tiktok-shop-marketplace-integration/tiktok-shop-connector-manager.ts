/** R1-09 — TikTok Shop Connector Manager. */

import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { TIKTOK_SHOP_MARKETPLACE_ID, TIKTOK_SHOP_API_ENDPOINTS } from "./paths.js";
import { appendTikTokShopLog } from "./tiktok-shop-logging.js";
import { TikTokShopAuthenticationManager } from "./tiktok-shop-authentication-manager.js";
import { TikTokShopApiClient } from "./tiktok-shop-api-client.js";
import { TikTokShopRequestRouter } from "./tiktok-shop-request-router.js";
import { TikTokShopResponseHandler } from "./tiktok-shop-response-handler.js";
import { TikTokShopEventAdapter } from "./tiktok-shop-event-adapter.js";
import { TikTokShopRateLimitManager } from "./tiktok-shop-rate-limit-manager.js";
import { TikTokShopRetryManager } from "./tiktok-shop-retry-manager.js";
import { TikTokShopConnectorValidator } from "./tiktok-shop-connector-validator.js";
import {
  TikTokShopConnectorMetadataGenerator,
  mapAuthToValidation,
} from "./tiktok-shop-connector-metadata-generator.js";
import type { TikTokShopMarketplaceIntegrationConfiguration } from "./configuration.js";
import type {
  TikTokShopConnectorRecord,
  TikTokShopConnectorRunReport,
  ConnectTikTokShopInput,
  HandleTikTokShopEventInput,
  RouteTikTokShopApiInput,
} from "./types.js";

function resolveShopId(
  input: ConnectTikTokShopInput,
  config: TikTokShopMarketplaceIntegrationConfiguration,
): string {
  return input.shopId ?? config.defaultShopId ?? `tts-shop-${Date.now()}`;
}

export class TikTokShopConnectorManager {
  private connectorRecord: TikTokShopConnectorRecord | null = null;
  private readonly authManager = new TikTokShopAuthenticationManager();
  private readonly apiClient = new TikTokShopApiClient();
  private readonly responseHandler = new TikTokShopResponseHandler();
  private readonly rateLimitManager = new TikTokShopRateLimitManager();
  private readonly retryManager = new TikTokShopRetryManager();
  private readonly validator = new TikTokShopConnectorValidator();
  private readonly metadataGenerator = new TikTokShopConnectorMetadataGenerator();
  private requestRouter: TikTokShopRequestRouter;
  private eventAdapter: TikTokShopEventAdapter;

  constructor(private readonly framework: MarketplaceConnectorFrameworkEngine | null) {
    this.requestRouter = new TikTokShopRequestRouter(
      this.apiClient,
      this.responseHandler,
      this.rateLimitManager,
      this.retryManager,
      framework,
    );
    this.eventAdapter = new TikTokShopEventAdapter(framework);
  }

  getConnectorRecord(): TikTokShopConnectorRecord | null {
    return this.connectorRecord;
  }

  registerWithFramework(config: TikTokShopMarketplaceIntegrationConfiguration): {
    frameworkConnectorId: string | null;
    validation: TikTokShopConnectorRunReport["validation"];
  } {
    if (!this.framework) {
      return {
        frameworkConnectorId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? TIKTOK_SHOP_API_ENDPOINTS.sandbox
      : TIKTOK_SHOP_API_ENDPOINTS.production;

    const report = this.framework.registerConnector({
      definition: {
        marketplaceId: TIKTOK_SHOP_MARKETPLACE_ID,
        connectorVersion: "TTS-001-v1",
        connectorType: "marketplace",
        integrationMissionId: "R1-09",
        authenticationMethod: "oauth2",
        credentialRef: config.credentialRef,
        apiEndpointConfig: {
          baseUrl: endpoint,
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "202309",
        },
        webhookConfig: {
          enabled: true,
          pathPrefix: "/webhooks/tiktok-shop",
          signatureHeader: "x-tiktok-shop-signature",
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

    appendTikTokShopLog({
      event: "connector_initialization",
      level: "info",
      details: `Registered TikTok Shop connector with MCF: ${report.validation.decision}`,
    });

    return {
      frameworkConnectorId: report.records[0]?.connectorId ?? null,
      validation: {
        validationReportId: `tts-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: "TTS-001-v1",
      },
    };
  }

  connectTikTokShop(
    input: ConnectTikTokShopInput,
    config: TikTokShopMarketplaceIntegrationConfiguration,
  ): TikTokShopConnectorRunReport {
    const started = Date.now();
    const credentialRef = input.credentialRef ?? config.credentialRef;
    const shopId = resolveShopId(input, config);

    const frameworkReg = this.registerWithFramework(config);
    const auth = this.authManager.authenticate(credentialRef, config);

    if (!auth.authenticated) {
      const record = this.metadataGenerator.buildRecord({
        frameworkConnectorId: frameworkReg.frameworkConnectorId,
        shopId,
        auth,
        connection: null,
        operationalState: "failed",
        validationStatus: "failed",
        credentialRefPresent: auth.credentialRefPresent,
      });
      this.connectorRecord = record;
      const validation = this.validator.validateRecord(record);
      validation.decision = "fail";
      validation.errors.push("TikTok Shop authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        record,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.framework) {
      this.framework.activateConnector(TIKTOK_SHOP_MARKETPLACE_ID);
    }

    const connection = this.apiClient.testConnection(config);
    const record = this.metadataGenerator.buildRecord({
      frameworkConnectorId: frameworkReg.frameworkConnectorId,
      shopId,
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
      validation.errors.push("TikTok Shop connection test failed");
    }

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      record,
      validation,
      durationMs: Date.now() - started,
    });
  }

  testConnection(config: TikTokShopMarketplaceIntegrationConfiguration): TikTokShopConnectorRunReport {
    const started = Date.now();
    const connection = this.apiClient.testConnection(config);
    const auth = this.authManager.authenticate(config.credentialRef, config);
    const shopId = this.connectorRecord?.shopId ?? config.defaultShopId;

    const record =
      this.connectorRecord ??
      this.metadataGenerator.buildRecord({
        frameworkConnectorId: null,
        shopId,
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
    input: RouteTikTokShopApiInput,
    config: TikTokShopMarketplaceIntegrationConfiguration,
  ): Promise<TikTokShopConnectorRunReport> {
    const started = Date.now();

    try {
      const routed = await this.requestRouter.route(input, config);
      const record = this.connectorRecord;
      if (!record) throw new Error("TikTok Shop connector not connected");

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
          shopId: config.defaultShopId,
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
    input: HandleTikTokShopEventInput,
    config: TikTokShopMarketplaceIntegrationConfiguration,
  ): TikTokShopConnectorRunReport {
    const started = Date.now();
    const result = this.eventAdapter.handle(input, config);
    const record = this.connectorRecord;
    if (!record) throw new Error("TikTok Shop connector not connected");

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
