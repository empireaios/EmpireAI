/** X1-06 — Domain & Digital Asset Planning Manager. */

import { createHash } from "node:crypto";
import type { CompanyFactoryFrameworkEngine } from "../company-factory-framework/engine.js";
import type { BusinessModelGenerator } from "../business-model-generator/engine.js";
import type { BrandCreationEngine } from "../brand-creation-engine/engine.js";
import { DAP_METADATA_VERSION, DOMAIN_DIGITAL_ASSET_PLANNER_ID } from "./paths.js";
import { appendDapLog } from "./dap-logging.js";
import { DigitalAssetRecordStore } from "./digital-asset-record-store.js";
import { DomainPlanningEngine } from "./domain-planning-engine.js";
import { SocialIdentityPlanner } from "./social-identity-planner.js";
import { WebsitePlanningEngine } from "./website-planning-engine.js";
import { DigitalAssetRecommendationEngine } from "./digital-asset-recommendation-engine.js";
import { NamingConflictAnalyzer } from "./naming-conflict-analyzer.js";
import { DigitalAssetValidator } from "./digital-asset-validator.js";
import { DigitalAssetMetadataGenerator } from "./digital-asset-metadata-generator.js";
import type { DomainDigitalAssetPlannerConfiguration } from "./configuration.js";
import type {
  ConnectDomainDigitalAssetPlannerInput,
  CreateDigitalAssetPlanInput,
  DigitalAssetActionInput,
  DigitalAssetEngineRecord,
  DigitalAssetPlanRecord,
  DigitalAssetRunReport,
} from "./types.js";

export type DomainDigitalAssetPlannerDependencies = {
  companyFactoryFramework: CompanyFactoryFrameworkEngine | null;
  businessModelGenerator: BusinessModelGenerator | null;
  brandCreationEngine: BrandCreationEngine | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class DigitalAssetPlanningManager {
  private engineRecord: DigitalAssetEngineRecord | null = null;
  private readonly store = new DigitalAssetRecordStore();
  private readonly domains = new DomainPlanningEngine();
  private readonly social = new SocialIdentityPlanner();
  private readonly website = new WebsitePlanningEngine();
  private readonly recommendations = new DigitalAssetRecommendationEngine();
  private readonly conflicts = new NamingConflictAnalyzer();
  private readonly validator = new DigitalAssetValidator();
  private readonly metadataGenerator = new DigitalAssetMetadataGenerator();

  constructor(private readonly deps: DomainDigitalAssetPlannerDependencies) {}

  getEngineRecord(): DigitalAssetEngineRecord | null {
    return this.engineRecord;
  }

  getPlanRecords(): DigitalAssetPlanRecord[] {
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

  private dependencyPresence(): DigitalAssetEngineRecord["dependencyPresence"] {
    return {
      companyFactoryFramework: this.deps.companyFactoryFramework
        ? this.probe(() => this.deps.companyFactoryFramework!.getState())
        : false,
      businessModelGenerator: this.deps.businessModelGenerator
        ? this.probe(() => this.deps.businessModelGenerator!.getState())
        : false,
      brandCreationEngine: this.deps.brandCreationEngine
        ? this.probe(() => this.deps.brandCreationEngine!.getState())
        : false,
    };
  }

  private requireConnected(): DigitalAssetEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Domain & Digital Asset Planner not connected — call connectDomainDigitalAssetPlanner first",
      );
    }
    return this.engineRecord;
  }

  private resolveBrandContext(input: {
    brandReference?: string;
    companyNameHint?: string;
    industry?: string;
  }): { brandReference: string; companyName: string; industry: string } {
    const industry = input.industry?.trim() || "general-structural";

    const fromBrand = safe(() => {
      const records = this.deps.brandCreationEngine?.getBrandRecords() ?? [];
      if (records.length === 0) return null;
      const latest = records[records.length - 1]!;
      return {
        brandReference: input.brandReference?.trim() || latest.brandId,
        companyName: input.companyNameHint?.trim() || latest.companyName,
        industry,
      };
    }, null);
    if (fromBrand) return fromBrand;

    if (input.brandReference?.trim() || input.companyNameHint?.trim()) {
      return {
        brandReference:
          input.brandReference?.trim() ||
          `structural://brand/${slug(input.companyNameHint || industry)}`,
        companyName: input.companyNameHint?.trim() || `Structural Brand ${industry}`,
        industry,
      };
    }

    const fromBmg = safe(() => {
      const records = this.deps.businessModelGenerator?.getBusinessModelRecords() ?? [];
      if (records.length === 0) return null;
      const latest = records[records.length - 1]!;
      return {
        brandReference: `structural://brand-from-model/${latest.businessModelId}`,
        companyName: `Structural Brand ${industry}`,
        industry,
      };
    }, null);
    if (fromBmg) return fromBmg;

    return {
      brandReference: `structural://brand/${industry}`,
      companyName: `Structural Brand ${industry}`,
      industry,
    };
  }

  registerWithFramework(
    config: DomainDigitalAssetPlannerConfiguration,
  ): { frameworkModuleId: string | null; validation: DigitalAssetRunReport["validation"] } {
    if (!this.deps.companyFactoryFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.companyFactoryFramework.registerCompanyModule({
      definition: {
        companyModuleIdentifier: DOMAIN_DIGITAL_ASSET_PLANNER_ID,
        moduleVersion: DAP_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X1-06",
        authenticationMethod: "none",
        credentialRef: "vault://domain-digital-asset-planner",
        apiEndpointConfig: {
          baseUrl: "internal://domain-digital-asset-planner",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["digital_asset.planned", "digital_asset.conflict", "digital_asset.failed"],
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
      this.deps.companyFactoryFramework.activateCompanyModule(DOMAIN_DIGITAL_ASSET_PLANNER_ID);
    }

    appendDapLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Domain & Digital Asset Planner with Company Factory Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `dap-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: DAP_METADATA_VERSION,
      },
    };
  }

  connectDomainDigitalAssetPlanner(
    _input: ConnectDomainDigitalAssetPlannerInput,
    config: DomainDigitalAssetPlannerConfiguration,
  ): DigitalAssetRunReport {
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

    appendDapLog({
      event: "engine_connect",
      level: "info",
      details: `Domain & Digital Asset Planner connected · cff=${deps.companyFactoryFramework} · bmg=${deps.businessModelGenerator} · bce=${deps.brandCreationEngine}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      planRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createPlan(
    input: CreateDigitalAssetPlanInput,
    config: DomainDigitalAssetPlannerConfiguration,
  ): DigitalAssetRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateCreateInput(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "create_plan",
        engineRecord: engine,
        planRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.store.list().length >= config.maxPlansPerCycle) {
      return this.metadataGenerator.buildRunReport({
        action: "create_plan",
        engineRecord: engine,
        planRecords: [],
        validation: {
          validationReportId: `dap-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [`Max plans per cycle reached (${config.maxPlansPerCycle})`],
          warnings: [],
          durationMs: 0,
          metadataVersion: DAP_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    if (!config.neverAutoRegisterOrPurchase) {
      return this.metadataGenerator.buildRunReport({
        action: "create_plan",
        engineRecord: engine,
        planRecords: [],
        validation: {
          validationReportId: `dap-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Automatic registration/purchase guard violated"],
          warnings: [],
          durationMs: 0,
          metadataVersion: DAP_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const resolved = this.resolveBrandContext(input);
    const proposedCompanyDomain = config.domainPlanningRulesEnabled
      ? this.domains.proposePrimaryDomain(resolved.companyName, resolved.industry)
      : `${slug(resolved.companyName)}.example`;
    const alternativeDomains = config.domainPlanningRulesEnabled
      ? this.domains.proposeAlternatives(resolved.companyName, resolved.industry)
      : `${slug(resolved.companyName)}.co`;
    const socialMediaHandlePlan = this.social.planHandles(resolved.companyName);
    const emailDomainPlan = this.domains.proposeEmailDomain(proposedCompanyDomain);
    const brandAssetStructure = this.website.planBrandAssetStructure(resolved.companyName);
    const websiteArchitectureSummary = config.websitePlanningRulesEnabled
      ? this.website.planArchitecture(resolved.companyName, resolved.industry)
      : `Structural website plan for ${resolved.companyName}`;
    const digitalIdentityConsistency = this.website.planIdentityConsistency(
      resolved.companyName,
      proposedCompanyDomain,
    );

    const fingerprint = createHash("sha256")
      .update(
        `${resolved.brandReference}|${proposedCompanyDomain}|${socialMediaHandlePlan}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);
    if (this.store.hasPlanFingerprint(fingerprint)) {
      return this.metadataGenerator.buildRunReport({
        action: "create_plan",
        engineRecord: engine,
        planRecords: [],
        validation: {
          validationReportId: `dap-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Duplicate digital asset plan identity detected — planning blocked"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: DAP_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    let record = this.store.create({
      brandReference: resolved.brandReference,
      proposedCompanyDomain,
      alternativeDomains,
      socialMediaHandlePlan,
      emailDomainPlan,
      brandAssetStructure,
      websiteArchitectureSummary,
      digitalIdentityConsistency,
      namingConflictSummary: "pending",
      recommendations: "pending",
      validationStatus: "pending",
    });

    if (config.namingValidationRulesEnabled) {
      record.namingConflictSummary = this.conflicts.analyze(record, this.store.list());
    } else {
      record.namingConflictSummary = "naming validation rules disabled";
    }

    const conflictCount = this.conflicts.countConflicts(record.namingConflictSummary);
    record.recommendations = this.recommendations.recommend({
      companyName: resolved.companyName,
      primaryDomain: proposedCompanyDomain,
      industry: resolved.industry,
      conflictCount,
    });
    record.structuralSignalOnly = true;
    record.automaticRegistrationOrPurchase = false;
    record.fabricatedDigitalAssetFacts = false;

    const recordValidation = this.validator.validatePlanRecord(record);
    record.validationStatus =
      recordValidation.decision === "fail"
        ? "failed"
        : recordValidation.decision === "partial"
          ? "partial"
          : "passed";
    this.store.persist(record);

    appendDapLog({
      event: "domain_planning",
      level: "info",
      details: `Planned structural domain · id=${record.digitalAssetPlanId} · domain=${record.proposedCompanyDomain}`,
    });
    appendDapLog({
      event: "social_identity_planning",
      level: "info",
      details: `Social handles planned · id=${record.digitalAssetPlanId}`,
    });
    appendDapLog({
      event: "website_planning",
      level: "info",
      details: `Website architecture planned · id=${record.digitalAssetPlanId}`,
    });
    appendDapLog({
      event: "recommendation_generation",
      level: "info",
      details: `Digital asset recommendations generated · id=${record.digitalAssetPlanId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "create_plan",
      engineRecord: engine,
      planRecords: [record],
      validation: recordValidation,
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(planId?: string): DigitalAssetPlanRecord {
    if (planId) {
      const found = this.store.get(planId);
      if (!found) throw new Error(`Digital asset plan not found: ${planId}`);
      return found;
    }
    const all = this.store.list();
    if (all.length === 0) throw new Error("No digital asset plan records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: DigitalAssetActionInput,
    config: DomainDigitalAssetPlannerConfiguration,
  ): DigitalAssetPlanRecord {
    try {
      return this.requireRecord(input.digitalAssetPlanId);
    } catch {
      const created = this.createPlan(
        {
          brandReference: input.brandReference,
          companyNameHint: input.companyNameHint,
          industry: input.industry,
          validated: true,
        },
        config,
      );
      return created.planRecords[0]!;
    }
  }

  private actionPass(
    action: DigitalAssetRunReport["action"],
    transform: (record: DigitalAssetPlanRecord, ctx: { companyName: string; industry: string }) => DigitalAssetPlanRecord,
    input: DigitalAssetActionInput,
    config: DomainDigitalAssetPlannerConfiguration,
    event: string,
  ): DigitalAssetRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const resolved = this.resolveBrandContext(input);
    let record = this.ensureRecord(input, config);
    record = transform(record, {
      companyName: resolved.companyName,
      industry: resolved.industry,
    });
    record.structuralSignalOnly = true;
    record.automaticRegistrationOrPurchase = false;
    record.fabricatedDigitalAssetFacts = false;
    this.store.persist(record);

    appendDapLog({
      event,
      level: "info",
      details: `${action} · id=${record.digitalAssetPlanId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      planRecords: [record],
      validation: this.validator.validatePlanRecord(record),
      durationMs: Date.now() - started,
    });
  }

  planCompanyDomains(
    input: DigitalAssetActionInput,
    config: DomainDigitalAssetPlannerConfiguration,
  ): DigitalAssetRunReport {
    if (!config.domainPlanningRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "plan_company_domains",
        engineRecord: engine,
        planRecords: [],
        validation: {
          validationReportId: `dap-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Domain planning rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: DAP_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "plan_company_domains",
      (r, ctx) => ({
        ...r,
        proposedCompanyDomain: this.domains.proposePrimaryDomain(ctx.companyName, ctx.industry),
        emailDomainPlan: this.domains.proposeEmailDomain(
          this.domains.proposePrimaryDomain(ctx.companyName, ctx.industry),
        ),
      }),
      input,
      config,
      "domain_planning",
    );
  }

  planDomainAlternatives(
    input: DigitalAssetActionInput,
    config: DomainDigitalAssetPlannerConfiguration,
  ): DigitalAssetRunReport {
    return this.actionPass(
      "plan_domain_alternatives",
      (r, ctx) => ({
        ...r,
        alternativeDomains: this.domains.proposeAlternatives(ctx.companyName, ctx.industry),
      }),
      input,
      config,
      "domain_planning",
    );
  }

  planSocialHandles(
    input: DigitalAssetActionInput,
    config: DomainDigitalAssetPlannerConfiguration,
  ): DigitalAssetRunReport {
    return this.actionPass(
      "plan_social_handles",
      (r, ctx) => ({
        ...r,
        socialMediaHandlePlan: this.social.planHandles(ctx.companyName),
      }),
      input,
      config,
      "social_identity_planning",
    );
  }

  planEmailDomains(
    input: DigitalAssetActionInput,
    config: DomainDigitalAssetPlannerConfiguration,
  ): DigitalAssetRunReport {
    return this.actionPass(
      "plan_email_domains",
      (r) => ({
        ...r,
        emailDomainPlan: this.domains.proposeEmailDomain(r.proposedCompanyDomain),
      }),
      input,
      config,
      "domain_planning",
    );
  }

  planBrandAssetStructure(
    input: DigitalAssetActionInput,
    config: DomainDigitalAssetPlannerConfiguration,
  ): DigitalAssetRunReport {
    return this.actionPass(
      "plan_brand_asset_structure",
      (r, ctx) => ({
        ...r,
        brandAssetStructure: this.website.planBrandAssetStructure(ctx.companyName),
      }),
      input,
      config,
      "website_planning",
    );
  }

  planWebsiteArchitecture(
    input: DigitalAssetActionInput,
    config: DomainDigitalAssetPlannerConfiguration,
  ): DigitalAssetRunReport {
    if (!config.websitePlanningRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "plan_website_architecture",
        engineRecord: engine,
        planRecords: [],
        validation: {
          validationReportId: `dap-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Website planning rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: DAP_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "plan_website_architecture",
      (r, ctx) => ({
        ...r,
        websiteArchitectureSummary: this.website.planArchitecture(ctx.companyName, ctx.industry),
      }),
      input,
      config,
      "website_planning",
    );
  }

  planDigitalIdentityConsistency(
    input: DigitalAssetActionInput,
    config: DomainDigitalAssetPlannerConfiguration,
  ): DigitalAssetRunReport {
    return this.actionPass(
      "plan_digital_identity_consistency",
      (r, ctx) => ({
        ...r,
        digitalIdentityConsistency: this.website.planIdentityConsistency(
          ctx.companyName,
          r.proposedCompanyDomain,
        ),
      }),
      input,
      config,
      "website_planning",
    );
  }

  detectNamingConflicts(
    input: DigitalAssetActionInput,
    config: DomainDigitalAssetPlannerConfiguration,
  ): DigitalAssetRunReport {
    if (!config.namingValidationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "detect_naming_conflicts",
        engineRecord: engine,
        planRecords: [],
        validation: {
          validationReportId: `dap-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Naming validation rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: DAP_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "detect_naming_conflicts",
      (r) => ({
        ...r,
        namingConflictSummary: this.conflicts.analyze(r, this.store.list()),
      }),
      input,
      config,
      "domain_planning",
    );
  }

  generateRecommendations(
    input: DigitalAssetActionInput,
    config: DomainDigitalAssetPlannerConfiguration,
  ): DigitalAssetRunReport {
    return this.actionPass(
      "generate_recommendations",
      (r, ctx) => ({
        ...r,
        recommendations: this.recommendations.recommend({
          companyName: ctx.companyName,
          primaryDomain: r.proposedCompanyDomain,
          industry: ctx.industry,
          conflictCount: this.conflicts.countConflicts(r.namingConflictSummary),
        }),
      }),
      input,
      config,
      "recommendation_generation",
    );
  }
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "company";
}
