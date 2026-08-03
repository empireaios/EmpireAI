/** X1-05 — Brand Creation Manager. */

import { createHash } from "node:crypto";
import type { CompanyFactoryFrameworkEngine } from "../company-factory-framework/engine.js";
import type { BusinessOpportunityDiscovery } from "../business-opportunity-discovery/engine.js";
import type { MarketValidationEngine } from "../market-validation-engine/engine.js";
import type { BusinessModelGenerator } from "../business-model-generator/engine.js";
import { BCE_METADATA_VERSION, BRAND_CREATION_ENGINE_ID } from "./paths.js";
import { appendBceLog } from "./bce-logging.js";
import { BrandRecordStore } from "./brand-record-store.js";
import { CompanyNamingEngine } from "./company-naming-engine.js";
import { BrandIdentityEngine } from "./brand-identity-engine.js";
import { BrandPositioningEngine } from "./brand-positioning-engine.js";
import { BrandRecommendationEngine } from "./brand-recommendation-engine.js";
import { BrandGuidelinesEngine } from "./brand-guidelines-engine.js";
import { BrandValidator } from "./brand-validator.js";
import { BrandMetadataGenerator } from "./brand-metadata-generator.js";
import type { BrandCreationEngineConfiguration } from "./configuration.js";
import type {
  BrandActionInput,
  BrandEngineRecord,
  BrandRecord,
  BrandRunReport,
  ConnectBrandCreationEngineInput,
  CreateBrandInput,
} from "./types.js";

export type BrandCreationEngineDependencies = {
  companyFactoryFramework: CompanyFactoryFrameworkEngine | null;
  businessOpportunityDiscovery: BusinessOpportunityDiscovery | null;
  marketValidationEngine: MarketValidationEngine | null;
  businessModelGenerator: BusinessModelGenerator | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class BrandCreationManager {
  private engineRecord: BrandEngineRecord | null = null;
  private readonly store = new BrandRecordStore();
  private readonly naming = new CompanyNamingEngine();
  private readonly identity = new BrandIdentityEngine();
  private readonly positioning = new BrandPositioningEngine();
  private readonly recommendations = new BrandRecommendationEngine();
  private readonly guidelines = new BrandGuidelinesEngine();
  private readonly validator = new BrandValidator();
  private readonly metadataGenerator = new BrandMetadataGenerator();

  constructor(private readonly deps: BrandCreationEngineDependencies) {}

  getEngineRecord(): BrandEngineRecord | null {
    return this.engineRecord;
  }

  getBrandRecords(): BrandRecord[] {
    return this.store.list();
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.store.resetForTesting();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): BrandEngineRecord["dependencyPresence"] {
    return {
      companyFactoryFramework: this.deps.companyFactoryFramework
        ? this.probe(() => this.deps.companyFactoryFramework!.getState())
        : false,
      businessOpportunityDiscovery: this.deps.businessOpportunityDiscovery
        ? this.probe(() => this.deps.businessOpportunityDiscovery!.getState())
        : false,
      marketValidationEngine: this.deps.marketValidationEngine
        ? this.probe(() => this.deps.marketValidationEngine!.getState())
        : false,
      businessModelGenerator: this.deps.businessModelGenerator
        ? this.probe(() => this.deps.businessModelGenerator!.getState())
        : false,
    };
  }

  private requireConnected(): BrandEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Brand Creation Engine not connected — call connectBrandCreationEngine first",
      );
    }
    return this.engineRecord;
  }

  private resolveBusinessModelReference(input: {
    businessModelReference?: string;
    industry?: string;
  }): { businessModelReference: string; industry: string } {
    const industry = input.industry?.trim() || "general-structural";

    if (input.businessModelReference?.trim()) {
      return {
        businessModelReference: input.businessModelReference.trim(),
        industry,
      };
    }

    const fromBmg = safe(() => {
      const records = this.deps.businessModelGenerator?.getBusinessModelRecords() ?? [];
      if (records.length === 0) return null;
      const latest = records[records.length - 1]!;
      return {
        businessModelReference: latest.businessModelId,
        industry: industry,
      };
    }, null);
    if (fromBmg) return fromBmg;

    const fromValidation = safe(() => {
      const records = this.deps.marketValidationEngine?.getValidationRecords() ?? [];
      if (records.length === 0) return null;
      const latest = records[records.length - 1]!;
      return {
        businessModelReference: `structural://model-from-validation/${latest.opportunityReference}`,
        industry: latest.industry || industry,
      };
    }, null);
    if (fromValidation) return fromValidation;

    return {
      businessModelReference: `structural://business-model/${industry}`,
      industry,
    };
  }

  registerWithFramework(
    config: BrandCreationEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: BrandRunReport["validation"] } {
    if (!this.deps.companyFactoryFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.companyFactoryFramework.registerCompanyModule({
      definition: {
        companyModuleIdentifier: BRAND_CREATION_ENGINE_ID,
        moduleVersion: BCE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X1-05",
        authenticationMethod: "none",
        credentialRef: "vault://brand-creation-engine",
        apiEndpointConfig: {
          baseUrl: "internal://brand-creation-engine",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["brand.created", "brand.identity_generated", "brand.failed"],
          maxEventsPerMinute: 60,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: true,
          requestsPerMinute: 60,
          burstLimit: 10,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "company_module_registration",
          "company_module_activation",
          "company_event_routing",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.companyFactoryFramework.activateCompanyModule(BRAND_CREATION_ENGINE_ID);
    }

    appendBceLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Brand Creation Engine with Company Factory Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `bce-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: BCE_METADATA_VERSION,
      },
    };
  }

  connectBrandCreationEngine(
    _input: ConnectBrandCreationEngineInput,
    config: BrandCreationEngineConfiguration,
  ): BrandRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: frameworkReg.validation.decision === "fail" ? "failed" : "active",
      validationStatus:
        frameworkReg.validation.decision === "fail"
          ? "failed"
          : frameworkReg.validation.decision === "partial"
            ? "partial"
            : "passed",
      dependencyPresence: deps,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (frameworkReg.validation.warnings.length > 0) {
      validation.warnings.push(...frameworkReg.validation.warnings);
      if (validation.decision === "pass") validation.decision = "partial";
    }

    appendBceLog({
      event: "engine_connect",
      level: "info",
      details: `Brand Creation Engine connected · cff=${deps.companyFactoryFramework} · bod=${deps.businessOpportunityDiscovery} · mve=${deps.marketValidationEngine} · bmg=${deps.businessModelGenerator}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      brandRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createBrand(input: CreateBrandInput, config: BrandCreationEngineConfiguration): BrandRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateCreateInput(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "create_brand",
        engineRecord: engine,
        brandRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.store.list().length >= config.maxBrandsPerCycle) {
      return this.metadataGenerator.buildRunReport({
        action: "create_brand",
        engineRecord: engine,
        brandRecords: [],
        validation: {
          validationReportId: `bce-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [`Max brands per cycle reached (${config.maxBrandsPerCycle})`],
          warnings: [],
          durationMs: 0,
          metadataVersion: BCE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const resolved = this.resolveBusinessModelReference(input);
    const companyName = config.namingRulesEnabled
      ? this.naming.generate(resolved.industry, input.companyNameHint)
      : input.companyNameHint?.trim() || `Structural Brand ${resolved.industry}`;

    const brandIdentity = config.identityGenerationRulesEnabled
      ? this.identity.generate(companyName, resolved.industry)
      : `Structural identity placeholder for ${companyName}`;
    const brandPositioning = this.positioning.generate(companyName, resolved.industry);
    const brandMessaging = this.identity.generateMessaging(companyName, resolved.industry);
    const brandValues = this.identity.generateValues(resolved.industry);
    const brandVoice = this.identity.generateVoice(resolved.industry);
    const colourRecommendations = this.recommendations.colours(resolved.industry);
    const typographyRecommendations = this.recommendations.typography(resolved.industry);

    const fingerprint = createHash("sha256")
      .update(`${companyName}|${brandIdentity}|${brandPositioning}`.toLowerCase())
      .digest("hex")
      .slice(0, 16);
    if (config.preventDuplicateBrandIdentities && this.store.hasIdentityFingerprint(fingerprint)) {
      return this.metadataGenerator.buildRunReport({
        action: "create_brand",
        engineRecord: engine,
        brandRecords: [],
        validation: {
          validationReportId: `bce-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Duplicate brand identity detected — creation blocked"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: BCE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    let record = this.store.create({
      businessModelReference: resolved.businessModelReference,
      companyName,
      brandIdentity,
      brandPositioning,
      brandMessaging,
      brandValues,
      brandVoice,
      colourRecommendations,
      typographyRecommendations,
      brandGuidelineReference: "pending",
      validationStatus: "pending",
    });

    if (config.brandGuidelineRulesEnabled) {
      record.brandGuidelineReference = this.guidelines.generateReference(
        record.brandId,
        record.companyName,
      );
    } else {
      record.brandGuidelineReference = `structural://brand-guidelines/${record.brandId}`;
    }
    record.structuralSignalOnly = true;
    record.fabricatedBrandFacts = false;
    const recordValidation = this.validator.validateBrandRecord(record);
    record.validationStatus =
      recordValidation.decision === "fail"
        ? "failed"
        : recordValidation.decision === "partial"
          ? "partial"
          : "passed";
    this.store.persist(record);

    appendBceLog({
      event: "brand_generation",
      level: "info",
      details: `Created structural brand · id=${record.brandId} · name=${record.companyName}`,
    });
    appendBceLog({
      event: "company_name_generation",
      level: "info",
      details: `Company name generated · ${record.companyName}`,
    });
    appendBceLog({
      event: "identity_generation",
      level: "info",
      details: `Brand identity generated · id=${record.brandId}`,
    });
    appendBceLog({
      event: "brand_guideline_generation",
      level: "info",
      details: `Brand guidelines reference · ${record.brandGuidelineReference}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "create_brand",
      engineRecord: engine,
      brandRecords: [record],
      validation: recordValidation,
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(brandId?: string): BrandRecord {
    if (brandId) {
      const found = this.store.get(brandId);
      if (!found) throw new Error(`Brand not found: ${brandId}`);
      return found;
    }
    const all = this.store.list();
    if (all.length === 0) throw new Error("No brand records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: BrandActionInput,
    config: BrandCreationEngineConfiguration,
  ): BrandRecord {
    try {
      return this.requireRecord(input.brandId);
    } catch {
      const created = this.createBrand(
        {
          businessModelReference: input.businessModelReference,
          industry: input.industry,
          validated: true,
        },
        config,
      );
      return created.brandRecords[0]!;
    }
  }

  private actionPass(
    action: BrandRunReport["action"],
    transform: (record: BrandRecord, industry: string) => BrandRecord,
    input: BrandActionInput,
    config: BrandCreationEngineConfiguration,
    event: string,
  ): BrandRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const resolved = this.resolveBusinessModelReference(input);
    let record = this.ensureRecord(input, config);
    record = transform(record, resolved.industry);
    record.structuralSignalOnly = true;
    record.fabricatedBrandFacts = false;
    this.store.persist(record);

    appendBceLog({
      event,
      level: "info",
      details: `${action} · id=${record.brandId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      brandRecords: [record],
      validation: this.validator.validateBrandRecord(record),
      durationMs: Date.now() - started,
    });
  }

  generateCompanyName(
    input: BrandActionInput,
    config: BrandCreationEngineConfiguration,
  ): BrandRunReport {
    if (!config.namingRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "generate_company_name",
        engineRecord: engine,
        brandRecords: [],
        validation: {
          validationReportId: `bce-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Naming rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: BCE_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "generate_company_name",
      (r, industry) => ({ ...r, companyName: this.naming.generate(industry, r.companyName) }),
      input,
      config,
      "company_name_generation",
    );
  }

  generateBrandIdentity(
    input: BrandActionInput,
    config: BrandCreationEngineConfiguration,
  ): BrandRunReport {
    return this.actionPass(
      "generate_brand_identity",
      (r, industry) => ({
        ...r,
        brandIdentity: this.identity.generate(r.companyName, industry),
      }),
      input,
      config,
      "identity_generation",
    );
  }

  generateBrandPositioning(
    input: BrandActionInput,
    config: BrandCreationEngineConfiguration,
  ): BrandRunReport {
    return this.actionPass(
      "generate_brand_positioning",
      (r, industry) => ({
        ...r,
        brandPositioning: this.positioning.generate(r.companyName, industry),
      }),
      input,
      config,
      "brand_generation",
    );
  }

  generateBrandMessaging(
    input: BrandActionInput,
    config: BrandCreationEngineConfiguration,
  ): BrandRunReport {
    return this.actionPass(
      "generate_brand_messaging",
      (r, industry) => ({
        ...r,
        brandMessaging: this.identity.generateMessaging(r.companyName, industry),
      }),
      input,
      config,
      "brand_generation",
    );
  }

  generateBrandValues(
    input: BrandActionInput,
    config: BrandCreationEngineConfiguration,
  ): BrandRunReport {
    return this.actionPass(
      "generate_brand_values",
      (r, industry) => ({ ...r, brandValues: this.identity.generateValues(industry) }),
      input,
      config,
      "brand_generation",
    );
  }

  generateBrandVoice(
    input: BrandActionInput,
    config: BrandCreationEngineConfiguration,
  ): BrandRunReport {
    return this.actionPass(
      "generate_brand_voice",
      (r, industry) => ({ ...r, brandVoice: this.identity.generateVoice(industry) }),
      input,
      config,
      "brand_generation",
    );
  }

  generateColourRecommendations(
    input: BrandActionInput,
    config: BrandCreationEngineConfiguration,
  ): BrandRunReport {
    return this.actionPass(
      "generate_colour_recommendations",
      (r, industry) => ({
        ...r,
        colourRecommendations: this.recommendations.colours(industry),
      }),
      input,
      config,
      "brand_generation",
    );
  }

  generateTypographyRecommendations(
    input: BrandActionInput,
    config: BrandCreationEngineConfiguration,
  ): BrandRunReport {
    return this.actionPass(
      "generate_typography_recommendations",
      (r, industry) => ({
        ...r,
        typographyRecommendations: this.recommendations.typography(industry),
      }),
      input,
      config,
      "brand_generation",
    );
  }

  generateBrandGuidelines(
    input: BrandActionInput,
    config: BrandCreationEngineConfiguration,
  ): BrandRunReport {
    if (!config.brandGuidelineRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "generate_brand_guidelines",
        engineRecord: engine,
        brandRecords: [],
        validation: {
          validationReportId: `bce-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Brand guideline rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: BCE_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "generate_brand_guidelines",
      (r) => ({
        ...r,
        brandGuidelineReference: this.guidelines.generateReference(r.brandId, r.companyName),
      }),
      input,
      config,
      "brand_guideline_generation",
    );
  }
}
