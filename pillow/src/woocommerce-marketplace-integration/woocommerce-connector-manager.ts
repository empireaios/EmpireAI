/** R1-11 — WooCommerce Connector Manager. */

import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { WOOCOMMERCE_MARKETPLACE_ID, WOOCOMMERCE_API_ENDPOINTS } from "./paths.js";
import { appendWooCommerceLog } from "./woocommerce-logging.js";
import { WooCommerceAuthenticationManager } from "./woocommerce-authentication-manager.js";
import { WooCommerceApiClient } from "./woocommerce-api-client.js";
import { WooCommerceRequestRouter } from "./woocommerce-request-router.js";
import { WooCommerceResponseHandler } from "./woocommerce-response-handler.js";
import { WooCommerceWebhookAdapter } from "./woocommerce-webhook-adapter.js";
import { WooCommerceRateLimitManager } from "./woocommerce-rate-limit-manager.js";
import { WooCommerceRetryManager } from "./woocommerce-retry-manager.js";
import { WooCommerceConnectorValidator } from "./woocommerce-connector-validator.js";
import {
  WooCommerceConnectorMetadataGenerator,
  mapAuthToValidation,
} from "./woocommerce-connector-metadata-generator.js";
import type { WooCommerceMarketplaceIntegrationConfiguration } from "./configuration.js";
import type {
  WooCommerceConnectorRecord,
  WooCommerceConnectorRunReport,
  ConnectWooCommerceInput,
  HandleWooCommerceWebhookInput,
  RouteWooCommerceApiInput,
} from "./types.js";

function resolveStoreId(
  input: ConnectWooCommerceInput,
  config: WooCommerceMarketplaceIntegrationConfiguration,
): string {
  return input.storeId ?? config.defaultStoreId ?? `woo-store-${Date.now()}`;
}

function resolveStoreUrl(
  input: ConnectWooCommerceInput,
  config: WooCommerceMarketplaceIntegrationConfiguration,
): string {
  return input.storeUrl ?? config.defaultStoreUrl ?? "https://store.wordpress.example";
}

export class WooCommerceConnectorManager {
  private connectorRecord: WooCommerceConnectorRecord | null = null;
  private readonly authManager = new WooCommerceAuthenticationManager();
  private readonly apiClient = new WooCommerceApiClient();
  private readonly responseHandler = new WooCommerceResponseHandler();
  private readonly rateLimitManager = new WooCommerceRateLimitManager();
  private readonly retryManager = new WooCommerceRetryManager();
  private readonly validator = new WooCommerceConnectorValidator();
  private readonly metadataGenerator = new WooCommerceConnectorMetadataGenerator();
  private requestRouter: WooCommerceRequestRouter;
  private webhookAdapter: WooCommerceWebhookAdapter;

  constructor(private readonly framework: MarketplaceConnectorFrameworkEngine | null) {
    this.requestRouter = new WooCommerceRequestRouter(
      this.apiClient,
      this.responseHandler,
      this.rateLimitManager,
      this.retryManager,
      framework,
    );
    this.webhookAdapter = new WooCommerceWebhookAdapter(framework);
  }

  getConnectorRecord(): WooCommerceConnectorRecord | null {
    return this.connectorRecord;
  }

  registerWithFramework(config: WooCommerceMarketplaceIntegrationConfiguration): {
    frameworkConnectorId: string | null;
    validation: WooCommerceConnectorRunReport["validation"];
  } {
    if (!this.framework) {
      return {
        frameworkConnectorId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? WOOCOMMERCE_API_ENDPOINTS.sandbox
      : WOOCOMMERCE_API_ENDPOINTS.production;

    const report = this.framework.registerConnector({
      definition: {
        marketplaceId: WOOCOMMERCE_MARKETPLACE_ID,
        connectorVersion: "WOO-001-v1",
        connectorType: "marketplace",
        integrationMissionId: "R1-11",
        authenticationMethod: "oauth2",
        credentialRef: config.credentialRef,
        apiEndpointConfig: {
          baseUrl: endpoint,
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v3",
        },
        webhookConfig: {
          enabled: config.webhookRulesEnabled,
          pathPrefix: "/webhooks/woocommerce",
          signatureHeader: "x-wc-webhook-signature",
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

    appendWooCommerceLog({
      event: "connector_initialization",
      level: "info",
      details: `Registered WooCommerce connector with MCF: ${report.validation.decision}`,
    });

    return {
      frameworkConnectorId: report.records[0]?.connectorId ?? null,
      validation: {
        validationReportId: `woo-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: "WOO-001-v1",
      },
    };
  }

  connectWooCommerce(
    input: ConnectWooCommerceInput,
    config: WooCommerceMarketplaceIntegrationConfiguration,
  ): WooCommerceConnectorRunReport {
    const started = Date.now();
    const credentialRef = input.credentialRef ?? config.credentialRef;
    const storeId = resolveStoreId(input, config);
    const storeUrl = resolveStoreUrl(input, config);

    const frameworkReg = this.registerWithFramework(config);
    const auth = this.authManager.authenticate(credentialRef, config);

    if (!auth.authenticated) {
      const record = this.metadataGenerator.buildRecord({
        frameworkConnectorId: frameworkReg.frameworkConnectorId,
        storeId,
        storeUrl,
        auth,
        connection: null,
        operationalState: "failed",
        validationStatus: "failed",
        credentialRefPresent: auth.credentialRefPresent,
      });
      this.connectorRecord = record;
      const validation = this.validator.validateRecord(record);
      validation.decision = "fail";
      validation.errors.push("WooCommerce authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        record,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.framework) {
      this.framework.activateConnector(WOOCOMMERCE_MARKETPLACE_ID);
    }

    this.requestRouter.setStoreUrl(storeUrl);
    const connection = this.apiClient.testConnection(config, storeUrl);
    const record = this.metadataGenerator.buildRecord({
      frameworkConnectorId: frameworkReg.frameworkConnectorId,
      storeId,
      storeUrl,
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
      validation.errors.push("WooCommerce connection test failed");
    }

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      record,
      validation,
      durationMs: Date.now() - started,
    });
  }

  testConnection(config: WooCommerceMarketplaceIntegrationConfiguration): WooCommerceConnectorRunReport {
    const started = Date.now();
    const storeUrl = this.connectorRecord?.storeUrl ?? config.defaultStoreUrl;
    const connection = this.apiClient.testConnection(config, storeUrl);
    const auth = this.authManager.authenticate(config.credentialRef, config);

    const record =
      this.connectorRecord ??
      this.metadataGenerator.buildRecord({
        frameworkConnectorId: null,
        storeId: config.defaultStoreId,
        storeUrl: config.defaultStoreUrl,
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
    input: RouteWooCommerceApiInput,
    config: WooCommerceMarketplaceIntegrationConfiguration,
  ): Promise<WooCommerceConnectorRunReport> {
    const started = Date.now();

    try {
      const routed = await this.requestRouter.route(input, config);
      const record = this.connectorRecord;
      if (!record) throw new Error("WooCommerce connector not connected");

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
          storeUrl: config.defaultStoreUrl,
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
    input: HandleWooCommerceWebhookInput,
    config: WooCommerceMarketplaceIntegrationConfiguration,
  ): WooCommerceConnectorRunReport {
    const started = Date.now();
    const result = this.webhookAdapter.handle(input, config);
    const record = this.connectorRecord;
    if (!record) throw new Error("WooCommerce connector not connected");

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
