/** R1-01 — Marketplace Connector Framework manager. */

import { ConnectorRegistry } from "./connector-registry.js";
import { ConnectorLifecycleManager } from "./connector-lifecycle-manager.js";
import { ConnectorConfigurationManager } from "./connector-configuration-manager.js";
import { AuthenticationAdapter } from "./authentication-adapter.js";
import { MarketplaceApiAdapter } from "./marketplace-api-adapter.js";
import { WebhookAdapter } from "./webhook-adapter.js";
import { RateLimitManager } from "./rate-limit-manager.js";
import { RetryManager } from "./retry-manager.js";
import { ResponseNormalizationEngine } from "./response-normalization-engine.js";
import { ConnectorValidator } from "./connector-validator.js";
import { ConnectorMetadataGenerator } from "./connector-metadata-generator.js";
import type { MarketplaceConnectorFrameworkConfiguration } from "./configuration.js";
import type {
  FrameworkRunReport,
  HandleWebhookInput,
  MarketplaceConnectorRecord,
  RegisterConnectorInput,
  RouteApiRequestInput,
} from "./types.js";

export class MarketplaceConnectorFrameworkManager {
  private readonly registry = new ConnectorRegistry();
  private readonly lifecycle = new ConnectorLifecycleManager();
  private readonly configManager = new ConnectorConfigurationManager();
  private readonly authAdapter = new AuthenticationAdapter();
  private readonly rateLimitManager = new RateLimitManager();
  private readonly retryManager = new RetryManager();
  private readonly normalizer = new ResponseNormalizationEngine();
  private readonly apiAdapter: MarketplaceApiAdapter;
  private readonly webhookAdapter: WebhookAdapter;
  private readonly validator = new ConnectorValidator();
  private readonly metadataGenerator = new ConnectorMetadataGenerator();

  constructor() {
    this.webhookAdapter = new WebhookAdapter(this.registry);
    this.apiAdapter = new MarketplaceApiAdapter(
      this.registry,
      this.authAdapter,
      this.rateLimitManager,
      this.retryManager,
      this.normalizer,
    );
  }

  getRegistry() {
    return this.registry;
  }

  getConnectors(): MarketplaceConnectorRecord[] {
    return this.registry.list();
  }

  registerConnector(
    input: RegisterConnectorInput,
    config: MarketplaceConnectorFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const merged = this.configManager.mergeDefaults(input.definition, config);
    const validation = this.validator.validateDefinition(merged, config);

    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "register",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.registry.get(merged.marketplaceId) && !input.forceRegister) {
      validation.decision = "fail";
      validation.errors.push("Connector already registered — use forceRegister to replace");
      return this.metadataGenerator.buildRunReport({
        action: "register",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.registry.list().length >= config.maxRegisteredConnectors) {
      validation.decision = "fail";
      validation.errors.push("Maximum registered connectors reached");
      return this.metadataGenerator.buildRunReport({
        action: "register",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const record = this.registry.register(merged);
    this.lifecycle.initialize(this.registry, merged.marketplaceId);
    const recordValidation = this.validator.validateRecord(record);
    validation.connectorId = record.connectorId;
    if (recordValidation.decision === "fail") {
      validation.decision = "fail";
      validation.errors.push(...recordValidation.errors);
    }

    return this.metadataGenerator.buildRunReport({
      action: "register",
      records: [record],
      validation,
      durationMs: Date.now() - started,
    });
  }

  activateConnector(marketplaceId: string, config: MarketplaceConnectorFrameworkConfiguration): FrameworkRunReport {
    const started = Date.now();
    const recordBefore = this.registry.get(marketplaceId);
    if (!recordBefore) {
      const validation = {
        validationReportId: `mcf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        connectorId: null,
        errors: ["Connector not found"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: "MCF-001-v1",
      };
      return this.metadataGenerator.buildRunReport({
        action: "activate",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    this.lifecycle.initialize(this.registry, marketplaceId);
    const result = this.lifecycle.activate(this.registry, marketplaceId);
    const record = result.record;
    const validation = this.validator.validateRecord(record!);
    if (!result.ok) {
      validation.decision = "fail";
      validation.errors.push(result.error ?? "Activation failed");
    } else if (record) {
      const auth = this.authAdapter.authenticate(
        {
          marketplaceId,
          method: record.authenticationMethod,
          credentialRef: record.credentialRefPresent ? `vault://${marketplaceId}` : null,
        },
        config,
      );
      if (!auth.authenticated && config.authenticationRulesEnabled && record.authenticationMethod !== "none") {
        validation.decision = "fail";
        validation.errors.push("Authentication failed during activation");
        this.lifecycle.transition(this.registry, marketplaceId, "failed");
      }
    }
    return this.metadataGenerator.buildRunReport({
      action: "activate",
      records: record ? [record] : [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  suspendConnector(marketplaceId: string): FrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.suspend(this.registry, marketplaceId);
    const validation = this.validator.validateRecord(
      result.record ?? ({ connectorId: "" } as MarketplaceConnectorRecord),
    );
    if (!result.ok) {
      validation.decision = "fail";
      validation.errors.push(result.error ?? "Suspend failed");
    }
    return this.metadataGenerator.buildRunReport({
      action: "suspend",
      records: result.record ? [result.record] : [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  shutdownConnector(marketplaceId: string): FrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.shutdown(this.registry, marketplaceId);
    const validation = this.validator.validateRecord(
      result.record ?? ({ connectorId: "" } as MarketplaceConnectorRecord),
    );
    if (!result.ok) {
      validation.decision = "fail";
      validation.errors.push(result.error ?? "Shutdown failed");
    }
    return this.metadataGenerator.buildRunReport({
      action: "shutdown",
      records: result.record ? [result.record] : [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  async routeApiRequest(
    input: RouteApiRequestInput,
    config: MarketplaceConnectorFrameworkConfiguration,
  ): Promise<FrameworkRunReport> {
    const started = Date.now();
    try {
      const routed = await this.apiAdapter.routeRequest(input, config);
      const record = this.registry.get(input.marketplaceId);
      const validation = this.validator.validateRecord(record!);
      if (routed.rateLimited) validation.warnings.push("Request was rate limited");
      return this.metadataGenerator.buildRunReport({
        action: "route_api",
        records: record ? [record] : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = {
        validationReportId: `mcf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        connectorId: null,
        errors: [error instanceof Error ? error.message : "API routing failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: "MCF-001-v1",
      };
      return this.metadataGenerator.buildRunReport({
        action: "route_api",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  handleWebhook(
    input: HandleWebhookInput,
    config: MarketplaceConnectorFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    try {
      const result = this.webhookAdapter.handle(input, config);
      const record = this.registry.get(input.marketplaceId);
      const validation = this.validator.validateRecord(record!);
      if (!result.accepted) validation.warnings.push(result.details);
      return this.metadataGenerator.buildRunReport({
        action: "handle_webhook",
        records: record ? [record] : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = {
        validationReportId: `mcf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        connectorId: null,
        errors: [error instanceof Error ? error.message : "Webhook handling failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: "MCF-001-v1",
      };
      return this.metadataGenerator.buildRunReport({
        action: "handle_webhook",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  resetForTesting(): void {
    this.registry.resetForTesting();
    this.rateLimitManager.resetForTesting();
  }
}
