/** R3-02 — Payment Gateway Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import {
  PAYMENT_GATEWAY_ID,
  PG_API_ENDPOINTS,
  PG_METADATA_VERSION,
} from "./paths.js";
import { appendPgLog } from "./pg-logging.js";
import { GatewayRegistry } from "./gateway-registry.js";
import { PaymentAuthenticationManager } from "./payment-authentication-manager.js";
import { PaymentApiClient } from "./payment-api-client.js";
import { PaymentProcessingEngine } from "./payment-processing-engine.js";
import { PaymentWebhookHandler } from "./payment-webhook-handler.js";
import { PaymentStatusEngine } from "./payment-status-engine.js";
import { PaymentRateLimitManager } from "./payment-rate-limit-manager.js";
import { PaymentRetryManager } from "./payment-retry-manager.js";
import { PaymentValidator } from "./payment-validator.js";
import { PaymentMetadataGenerator, mapAuthToValidation } from "./payment-metadata-generator.js";
import type { PaymentGatewayIntegrationConfiguration } from "./configuration.js";
import type {
  ConnectPaymentGatewayInput,
  CreatePaymentRequestInput,
  GatewayRecord,
  HandlePaymentWebhookInput,
  PaymentGatewayRunReport,
  ProcessPaymentInput,
  RegisterGatewayInput,
  SyncPaymentStatusInput,
} from "./types.js";

export class PaymentGatewayManager {
  private gatewayRecord: GatewayRecord | null = null;
  private readonly registry = new GatewayRegistry();
  private readonly authManager = new PaymentAuthenticationManager();
  private readonly apiClient = new PaymentApiClient();
  private readonly rateLimitManager = new PaymentRateLimitManager();
  private readonly retryManager = new PaymentRetryManager();
  private readonly validator = new PaymentValidator();
  private readonly metadataGenerator = new PaymentMetadataGenerator();
  private readonly processingEngine: PaymentProcessingEngine;
  private readonly webhookHandler: PaymentWebhookHandler;
  private readonly statusEngine: PaymentStatusEngine;

  constructor(private readonly framework: FinancialFrameworkEngine | null) {
    this.processingEngine = new PaymentProcessingEngine(
      this.registry,
      this.metadataGenerator,
      this.validator,
    );
    this.webhookHandler = new PaymentWebhookHandler(this.registry);
    this.statusEngine = new PaymentStatusEngine(this.registry);
  }

  getGatewayRecord(): GatewayRecord | null {
    return this.gatewayRecord;
  }

  getRegistry(): GatewayRegistry {
    return this.registry;
  }

  getPaymentRecords() {
    return this.registry.listPayments();
  }

  private checkRateLimit(config: PaymentGatewayIntegrationConfiguration): boolean {
    if (!config.rateLimitEnabled) return true;
    const check = this.rateLimitManager.check(
      PAYMENT_GATEWAY_ID,
      config.operationsPerMinute,
      config.rateLimitWindowMs,
    );
    return check.allowed;
  }

  registerWithFramework(
    config: PaymentGatewayIntegrationConfiguration,
    providerIdentifier: string,
  ): { frameworkModuleId: string | null; validation: PaymentGatewayRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? PG_API_ENDPOINTS.sandbox
      : PG_API_ENDPOINTS.production;

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: PAYMENT_GATEWAY_ID,
        moduleVersion: PG_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "R3-02",
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
          topics: [
            "payment.authorized",
            "payment.captured",
            "payment.cancelled",
            "payment.failed",
          ],
          maxEventsPerMinute: config.operationsPerMinute,
          windowMs: config.rateLimitWindowMs,
        },
        rateLimitConfig: {
          enabled: config.rateLimitEnabled,
          requestsPerMinute: config.operationsPerMinute,
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
          "financial_module_registration",
          "financial_module_activation",
          "financial_event_routing",
        ],
      },
      forceRegister: true,
    });

    appendPgLog({
      event: "gateway_initialization",
      level: "info",
      details: `Registered payment gateway with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `pg-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: PG_METADATA_VERSION,
      },
    };
  }

  connectPaymentGateway(
    input: ConnectPaymentGatewayInput,
    config: PaymentGatewayIntegrationConfiguration,
  ): PaymentGatewayRunReport {
    const started = Date.now();
    const credentialRef = input.credentialRef ?? config.credentialRef;
    const providerIdentifier = input.providerIdentifier ?? "stripe";

    const frameworkReg = this.registerWithFramework(config, providerIdentifier);
    const auth = this.authManager.authenticate(credentialRef, config);

    if (!auth.authenticated) {
      const record = this.metadataGenerator.buildGatewayRecord({
        frameworkModuleId: frameworkReg.frameworkModuleId,
        auth,
        connection: null,
        operationalState: "failed",
        validationStatus: "failed",
        credentialRefPresent: auth.credentialRefPresent,
        providerIdentifier,
      });
      this.gatewayRecord = record;
      const validation = this.validator.validateGatewayRecord(record);
      validation.decision = "fail";
      validation.errors.push("Payment gateway authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        gatewayRecord: record,
        paymentRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    this.registry.registerProvider({ providerIdentifier });

    if (this.framework) {
      this.framework.activateFinancialModule(PAYMENT_GATEWAY_ID);
    }

    const connection = this.apiClient.testConnection(config);
    const record = this.metadataGenerator.buildGatewayRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      auth,
      connection,
      operationalState: connection.passed ? "active" : "failed",
      validationStatus: mapAuthToValidation(auth),
      credentialRefPresent: auth.credentialRefPresent,
      providerIdentifier,
    });
    this.gatewayRecord = record;

    const validation = this.validator.validateGatewayRecord(record);
    if (!connection.passed) {
      validation.decision = "fail";
      validation.errors.push("Payment gateway connection test failed");
    }

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      gatewayRecord: record,
      paymentRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  registerGateway(
    input: RegisterGatewayInput,
    config: PaymentGatewayIntegrationConfiguration,
  ): PaymentGatewayRunReport {
    const started = Date.now();
    this.registry.registerProvider(input);

    const record =
      this.gatewayRecord ??
      this.metadataGenerator.buildGatewayRecord({
        frameworkModuleId: null,
        auth: {
          authenticated: false,
          authenticationStatus: "unauthenticated",
          sessionStatus: "none",
          credentialRefPresent: false,
          tokenExposed: false,
          details: "Not connected",
        },
        connection: null,
        operationalState: "registered",
        validationStatus: "pending",
        credentialRefPresent: false,
        providerIdentifier: input.providerIdentifier,
      });

    const validation = this.validator.validateGatewayRecord(record);
    if (!config.gatewayRegistrationRulesEnabled) {
      validation.warnings.push("Gateway registration rules disabled");
    }

    return this.metadataGenerator.buildRunReport({
      action: "register_gateway",
      gatewayRecord: record,
      paymentRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createPaymentRequest(
    input: CreatePaymentRequestInput,
    config: PaymentGatewayIntegrationConfiguration,
  ): PaymentGatewayRunReport {
    const started = Date.now();
    const record = this.gatewayRecord;
    if (!record || record.currentOperationalState !== "active") {
      throw new Error("Payment gateway not connected");
    }

    if (!this.checkRateLimit(config)) {
      const validation = this.validator.validateGatewayRecord(record);
      validation.warnings.push("Operation was rate limited");
      return this.metadataGenerator.buildRunReport({
        action: "create_payment",
        gatewayRecord: record,
        paymentRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    try {
      const { record: payment, validation: reqValidation } =
        this.processingEngine.createPaymentRequest(input, config);
      const validation = this.validator.validatePaymentRecord(payment);
      if (reqValidation.warnings.length > 0) {
        validation.warnings.push(...reqValidation.warnings);
      }

      if (this.framework) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: PAYMENT_GATEWAY_ID,
          topic: "payment.created",
          payloadRef: payment.paymentId,
        });
      }

      return this.metadataGenerator.buildRunReport({
        action: "create_payment",
        gatewayRecord: record,
        paymentRecords: [payment],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateGatewayRecord(record);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "Payment request failed");
      return this.metadataGenerator.buildRunReport({
        action: "create_payment",
        gatewayRecord: record,
        paymentRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  processPaymentAuthorization(
    input: ProcessPaymentInput,
    config: PaymentGatewayIntegrationConfiguration,
  ): PaymentGatewayRunReport {
    const started = Date.now();
    const record = this.gatewayRecord;
    if (!record) throw new Error("Payment gateway not connected");

    try {
      const payment = this.processingEngine.processAuthorization(input, config);
      const validation = this.validator.validatePaymentRecord(payment);

      if (this.framework) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: PAYMENT_GATEWAY_ID,
          topic: "payment.authorized",
          payloadRef: payment.paymentId,
        });
      }

      return this.metadataGenerator.buildRunReport({
        action: "authorize",
        gatewayRecord: record,
        paymentRecords: [payment],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateGatewayRecord(record);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "Authorization failed");
      return this.metadataGenerator.buildRunReport({
        action: "authorize",
        gatewayRecord: record,
        paymentRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  processPaymentCapture(
    input: ProcessPaymentInput,
    config: PaymentGatewayIntegrationConfiguration,
  ): PaymentGatewayRunReport {
    const started = Date.now();
    const record = this.gatewayRecord;
    if (!record) throw new Error("Payment gateway not connected");

    try {
      const payment = this.processingEngine.processCapture(input);
      const validation = this.validator.validatePaymentRecord(payment);

      if (this.framework) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: PAYMENT_GATEWAY_ID,
          topic: "payment.captured",
          payloadRef: payment.paymentId,
        });
      }

      return this.metadataGenerator.buildRunReport({
        action: "capture",
        gatewayRecord: record,
        paymentRecords: [payment],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateGatewayRecord(record);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "Capture failed");
      return this.metadataGenerator.buildRunReport({
        action: "capture",
        gatewayRecord: record,
        paymentRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  processPaymentCancellation(
    input: ProcessPaymentInput,
    config: PaymentGatewayIntegrationConfiguration,
  ): PaymentGatewayRunReport {
    const started = Date.now();
    void config;
    const record = this.gatewayRecord;
    if (!record) throw new Error("Payment gateway not connected");

    try {
      const payment = this.processingEngine.processCancellation(input);
      const validation = this.validator.validatePaymentRecord(payment);

      if (this.framework) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: PAYMENT_GATEWAY_ID,
          topic: "payment.cancelled",
          payloadRef: payment.paymentId,
        });
      }

      return this.metadataGenerator.buildRunReport({
        action: "cancel",
        gatewayRecord: record,
        paymentRecords: [payment],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateGatewayRecord(record);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "Cancellation failed");
      return this.metadataGenerator.buildRunReport({
        action: "cancel",
        gatewayRecord: record,
        paymentRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  handlePaymentWebhook(
    input: HandlePaymentWebhookInput,
    config: PaymentGatewayIntegrationConfiguration,
  ): PaymentGatewayRunReport {
    const started = Date.now();
    const record = this.gatewayRecord;

    if (!record) {
      const validation = this.validator.validateConfiguration(config);
      validation.decision = "fail";
      validation.errors.push("Payment gateway not connected");
      return this.metadataGenerator.buildRunReport({
        action: "handle_webhook",
        gatewayRecord: this.metadataGenerator.buildGatewayRecord({
          frameworkModuleId: null,
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
          providerIdentifier: "unknown",
        }),
        paymentRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const webhook = this.webhookHandler.handle(input, config);
    const validation = this.validator.validateGatewayRecord(record);
    if (!webhook.accepted) {
      validation.decision = "fail";
      validation.errors.push(webhook.details);
    }

    const paymentRecords: import("./types.js").PaymentRecord[] = [];
    if (webhook.paymentId) {
      const payment = this.registry.getPayment(webhook.paymentId);
      if (payment) paymentRecords.push(payment);
    }

    if (this.framework && webhook.accepted) {
      this.framework.routeFinancialEvent({
        financialModuleIdentifier: PAYMENT_GATEWAY_ID,
        topic: input.topic,
        payloadRef: input.payloadRef,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "handle_webhook",
      gatewayRecord: record,
      paymentRecords,
      validation,
      durationMs: Date.now() - started,
    });
  }

  syncPaymentStatus(
    input: SyncPaymentStatusInput,
    config: PaymentGatewayIntegrationConfiguration,
  ): PaymentGatewayRunReport {
    const started = Date.now();
    void config;
    const record = this.gatewayRecord;
    if (!record) throw new Error("Payment gateway not connected");

    const payment = this.statusEngine.syncStatus(input);
    const validation = this.validator.validateGatewayRecord(record);
    if (!payment) {
      validation.decision = "fail";
      validation.errors.push("Payment not found for status sync");
    }

    return this.metadataGenerator.buildRunReport({
      action: "sync_status",
      gatewayRecord: record,
      paymentRecords: payment ? [payment] : [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.gatewayRecord = null;
    this.registry.resetForTesting();
    this.authManager.resetForTesting();
    this.rateLimitManager.resetForTesting();
    this.retryManager.resetForTesting();
  }
}
