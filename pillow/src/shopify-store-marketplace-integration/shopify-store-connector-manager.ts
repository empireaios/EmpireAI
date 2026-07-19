/** R1-10 — Shopify Store Connector Manager. */

import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { SHOPIFY_STORE_MARKETPLACE_ID, SHOPIFY_STORE_API_ENDPOINTS } from "./paths.js";
import { appendShopifyStoreLog } from "./shopify-store-logging.js";
import { ShopifyStoreAuthenticationManager } from "./shopify-store-authentication-manager.js";
import { ShopifyStoreApiClient } from "./shopify-store-api-client.js";
import { ShopifyStoreRequestRouter } from "./shopify-store-request-router.js";
import { ShopifyStoreResponseHandler } from "./shopify-store-response-handler.js";
import { ShopifyStoreWebhookAdapter } from "./shopify-store-webhook-adapter.js";
import { ShopifyStoreRateLimitManager } from "./shopify-store-rate-limit-manager.js";
import { ShopifyStoreRetryManager } from "./shopify-store-retry-manager.js";
import { ShopifyStoreConnectorValidator } from "./shopify-store-connector-validator.js";
import {
  ShopifyStoreConnectorMetadataGenerator,
  mapAuthToValidation,
} from "./shopify-store-connector-metadata-generator.js";
import type { ShopifyStoreMarketplaceIntegrationConfiguration } from "./configuration.js";
import type {
  ShopifyStoreConnectorRecord,
  ShopifyStoreConnectorRunReport,
  ConnectShopifyStoreInput,
  HandleShopifyStoreWebhookInput,
  RouteShopifyStoreApiInput,
} from "./types.js";

function resolveStoreId(
  input: ConnectShopifyStoreInput,
  config: ShopifyStoreMarketplaceIntegrationConfiguration,
): string {
  return input.storeId ?? config.defaultStoreId ?? `shf-store-${Date.now()}`;
}

function resolveStoreDomain(
  input: ConnectShopifyStoreInput,
  config: ShopifyStoreMarketplaceIntegrationConfiguration,
): string {
  return input.storeDomain ?? config.defaultStoreDomain ?? "example.myshopify.com";
}

export class ShopifyStoreConnectorManager {
  private connectorRecord: ShopifyStoreConnectorRecord | null = null;
  private readonly authManager = new ShopifyStoreAuthenticationManager();
  private readonly apiClient = new ShopifyStoreApiClient();
  private readonly responseHandler = new ShopifyStoreResponseHandler();
  private readonly rateLimitManager = new ShopifyStoreRateLimitManager();
  private readonly retryManager = new ShopifyStoreRetryManager();
  private readonly validator = new ShopifyStoreConnectorValidator();
  private readonly metadataGenerator = new ShopifyStoreConnectorMetadataGenerator();
  private requestRouter: ShopifyStoreRequestRouter;
  private webhookAdapter: ShopifyStoreWebhookAdapter;

  constructor(private readonly framework: MarketplaceConnectorFrameworkEngine | null) {
    this.requestRouter = new ShopifyStoreRequestRouter(
      this.apiClient,
      this.responseHandler,
      this.rateLimitManager,
      this.retryManager,
      framework,
    );
    this.webhookAdapter = new ShopifyStoreWebhookAdapter(framework);
  }

  getConnectorRecord(): ShopifyStoreConnectorRecord | null {
    return this.connectorRecord;
  }

  registerWithFramework(config: ShopifyStoreMarketplaceIntegrationConfiguration): {
    frameworkConnectorId: string | null;
    validation: ShopifyStoreConnectorRunReport["validation"];
  } {
    if (!this.framework) {
      return {
        frameworkConnectorId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? SHOPIFY_STORE_API_ENDPOINTS.sandbox
      : SHOPIFY_STORE_API_ENDPOINTS.production;

    const report = this.framework.registerConnector({
      definition: {
        marketplaceId: SHOPIFY_STORE_MARKETPLACE_ID,
        connectorVersion: "SHF-001-v1",
        connectorType: "marketplace",
        integrationMissionId: "R1-10",
        authenticationMethod: "oauth2",
        credentialRef: config.credentialRef,
        apiEndpointConfig: {
          baseUrl: endpoint,
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "2024-10",
        },
        webhookConfig: {
          enabled: config.webhookRulesEnabled,
          pathPrefix: "/webhooks/shopify",
          signatureHeader: "x-shopify-hmac-sha256",
          verifySignatures: config.webhookSignatureVerificationEnabled,
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

    appendShopifyStoreLog({
      event: "connector_initialization",
      level: "info",
      details: `Registered Shopify connector with MCF: ${report.validation.decision}`,
    });

    return {
      frameworkConnectorId: report.records[0]?.connectorId ?? null,
      validation: {
        validationReportId: `shf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: "SHF-001-v1",
      },
    };
  }

  connectShopifyStore(
    input: ConnectShopifyStoreInput,
    config: ShopifyStoreMarketplaceIntegrationConfiguration,
  ): ShopifyStoreConnectorRunReport {
    const started = Date.now();
    const credentialRef = input.credentialRef ?? config.credentialRef;
    const storeId = resolveStoreId(input, config);
    const storeDomain = resolveStoreDomain(input, config);

    const frameworkReg = this.registerWithFramework(config);
    const auth = this.authManager.authenticate(credentialRef, config);

    if (!auth.authenticated) {
      const record = this.metadataGenerator.buildRecord({
        frameworkConnectorId: frameworkReg.frameworkConnectorId,
        storeId,
        storeDomain,
        auth,
        connection: null,
        operationalState: "failed",
        validationStatus: "failed",
        credentialRefPresent: auth.credentialRefPresent,
      });
      this.connectorRecord = record;
      const validation = this.validator.validateRecord(record);
      validation.decision = "fail";
      validation.errors.push("Shopify authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        record,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.framework) {
      this.framework.activateConnector(SHOPIFY_STORE_MARKETPLACE_ID);
    }

    this.requestRouter.setStoreDomain(storeDomain);
    const connection = this.apiClient.testConnection(config, storeDomain);
    const record = this.metadataGenerator.buildRecord({
      frameworkConnectorId: frameworkReg.frameworkConnectorId,
      storeId,
      storeDomain,
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
      validation.errors.push("Shopify store connection test failed");
    }

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      record,
      validation,
      durationMs: Date.now() - started,
    });
  }

  testConnection(config: ShopifyStoreMarketplaceIntegrationConfiguration): ShopifyStoreConnectorRunReport {
    const started = Date.now();
    const storeDomain = this.connectorRecord?.storeDomain ?? config.defaultStoreDomain;
    const connection = this.apiClient.testConnection(config, storeDomain);
    const auth = this.authManager.authenticate(config.credentialRef, config);

    const record =
      this.connectorRecord ??
      this.metadataGenerator.buildRecord({
        frameworkConnectorId: null,
        storeId: config.defaultStoreId,
        storeDomain: config.defaultStoreDomain,
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
    input: RouteShopifyStoreApiInput,
    config: ShopifyStoreMarketplaceIntegrationConfiguration,
  ): Promise<ShopifyStoreConnectorRunReport> {
    const started = Date.now();

    try {
      const routed = await this.requestRouter.route(input, config);
      const record = this.connectorRecord;
      if (!record) throw new Error("Shopify connector not connected");

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
          storeId: config.defaultStoreId,
          storeDomain: config.defaultStoreDomain,
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
    input: HandleShopifyStoreWebhookInput,
    config: ShopifyStoreMarketplaceIntegrationConfiguration,
  ): ShopifyStoreConnectorRunReport {
    const started = Date.now();
    const result = this.webhookAdapter.handle(input, config);
    const record = this.connectorRecord;
    if (!record) throw new Error("Shopify connector not connected");

    const validation = this.validator.validateRecord(record);
    if (!result.accepted) validation.warnings.push(result.details);

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
