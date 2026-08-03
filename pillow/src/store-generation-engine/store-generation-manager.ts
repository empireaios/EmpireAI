/** X1-07 — Store Generation Manager. */

import { createHash } from "node:crypto";
import type { CompanyFactoryFrameworkEngine } from "../company-factory-framework/engine.js";
import type { BusinessModelGenerator } from "../business-model-generator/engine.js";
import type { BrandCreationEngine } from "../brand-creation-engine/engine.js";
import type { DomainDigitalAssetPlanner } from "../domain-digital-asset-planner/engine.js";
import { SGE_METADATA_VERSION, STORE_GENERATION_ENGINE_ID } from "./paths.js";
import { appendSgeLog } from "./sge-logging.js";
import { StorefrontRecordStore } from "./storefront-record-store.js";
import { StorefrontGenerationEngine } from "./storefront-generation-engine.js";
import { WebsiteStructureEngine } from "./website-structure-engine.js";
import { NavigationBuilder } from "./navigation-builder.js";
import { CatalogueStructureEngine } from "./catalogue-structure-engine.js";
import { DeploymentPackageGenerator } from "./deployment-package-generator.js";
import { StorefrontValidator } from "./storefront-validator.js";
import { StorefrontMetadataGenerator } from "./storefront-metadata-generator.js";
import type { StoreGenerationEngineConfiguration } from "./configuration.js";
import type {
  ConnectStoreGenerationEngineInput,
  GenerateStorefrontInput,
  StorefrontActionInput,
  StorefrontEngineRecord,
  StorefrontRecord,
  StorefrontRunReport,
} from "./types.js";

export type StoreGenerationEngineDependencies = {
  companyFactoryFramework: CompanyFactoryFrameworkEngine | null;
  businessModelGenerator: BusinessModelGenerator | null;
  brandCreationEngine: BrandCreationEngine | null;
  domainDigitalAssetPlanner: DomainDigitalAssetPlanner | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class StoreGenerationManager {
  private engineRecord: StorefrontEngineRecord | null = null;
  private readonly store = new StorefrontRecordStore();
  private readonly storefront = new StorefrontGenerationEngine();
  private readonly website = new WebsiteStructureEngine();
  private readonly navigation = new NavigationBuilder();
  private readonly catalogue = new CatalogueStructureEngine();
  private readonly deployment = new DeploymentPackageGenerator();
  private readonly validator = new StorefrontValidator();
  private readonly metadataGenerator = new StorefrontMetadataGenerator();

  constructor(private readonly deps: StoreGenerationEngineDependencies) {}

  getEngineRecord(): StorefrontEngineRecord | null {
    return this.engineRecord;
  }

  getStorefrontRecords(): StorefrontRecord[] {
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

  private dependencyPresence(): StorefrontEngineRecord["dependencyPresence"] {
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
      domainDigitalAssetPlanner: this.deps.domainDigitalAssetPlanner
        ? this.probe(() => this.deps.domainDigitalAssetPlanner!.getState())
        : false,
    };
  }

  private requireConnected(): StorefrontEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Store Generation Engine not connected — call connectStoreGenerationEngine first",
      );
    }
    return this.engineRecord;
  }

  private resolveContext(input: {
    companyReference?: string;
    brandReference?: string;
    domainPlanReference?: string;
    industry?: string;
  }): {
    companyReference: string;
    brandReference: string;
    domainPlanReference: string;
    companyName: string;
    industry: string;
  } {
    const industry = input.industry?.trim() || "general-structural";

    const brand = safe(() => {
      const records = this.deps.brandCreationEngine?.getBrandRecords() ?? [];
      if (records.length === 0) return null;
      return records[records.length - 1]!;
    }, null);

    const plan = safe(() => {
      const records = this.deps.domainDigitalAssetPlanner?.getPlanRecords() ?? [];
      if (records.length === 0) return null;
      return records[records.length - 1]!;
    }, null);

    const model = safe(() => {
      const records = this.deps.businessModelGenerator?.getBusinessModelRecords() ?? [];
      if (records.length === 0) return null;
      return records[records.length - 1]!;
    }, null);

    const companyName = brand?.companyName || `Structural Store ${industry}`;
    const companyReference =
      input.companyReference?.trim() ||
      this.storefront.companyReference(companyName, model?.businessModelId);
    const brandReference =
      input.brandReference?.trim() || brand?.brandId || `structural://brand/${industry}`;
    const domainPlanReference =
      input.domainPlanReference?.trim() ||
      plan?.digitalAssetPlanId ||
      `structural://domain-plan/${industry}`;

    return {
      companyReference,
      brandReference,
      domainPlanReference,
      companyName,
      industry,
    };
  }

  registerWithFramework(
    config: StoreGenerationEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: StorefrontRunReport["validation"] } {
    if (!this.deps.companyFactoryFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.companyFactoryFramework.registerCompanyModule({
      definition: {
        companyModuleIdentifier: STORE_GENERATION_ENGINE_ID,
        moduleVersion: SGE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X1-07",
        authenticationMethod: "none",
        credentialRef: "vault://store-generation-engine",
        apiEndpointConfig: {
          baseUrl: "internal://store-generation-engine",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["storefront.generated", "storefront.package_prepared", "storefront.failed"],
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
      this.deps.companyFactoryFramework.activateCompanyModule(STORE_GENERATION_ENGINE_ID);
    }

    appendSgeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Store Generation Engine with Company Factory Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `sge-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: SGE_METADATA_VERSION,
      },
    };
  }

  connectStoreGenerationEngine(
    _input: ConnectStoreGenerationEngineInput,
    config: StoreGenerationEngineConfiguration,
  ): StorefrontRunReport {
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

    appendSgeLog({
      event: "engine_connect",
      level: "info",
      details: `Store Generation Engine connected · cff=${deps.companyFactoryFramework} · bmg=${deps.businessModelGenerator} · bce=${deps.brandCreationEngine} · dap=${deps.domainDigitalAssetPlanner}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      storefrontRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  generateStorefront(
    input: GenerateStorefrontInput,
    config: StoreGenerationEngineConfiguration,
  ): StorefrontRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateGenerateInput(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "generate_storefront",
        engineRecord: engine,
        storefrontRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.store.list().length >= config.maxStorefrontsPerCycle) {
      return this.metadataGenerator.buildRunReport({
        action: "generate_storefront",
        engineRecord: engine,
        storefrontRecords: [],
        validation: {
          validationReportId: `sge-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [`Max storefronts per cycle reached (${config.maxStorefrontsPerCycle})`],
          warnings: [],
          durationMs: 0,
          metadataVersion: SGE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const ctx = this.resolveContext(input);
    const websiteStructureReference = config.websiteGenerationRulesEnabled
      ? this.website.createStructure(ctx.companyName, ctx.industry)
      : `structural://website/${ctx.industry}`;
    const navigationStructure = config.navigationRulesEnabled
      ? this.navigation.build(ctx.companyName, ctx.industry)
      : "Home > Shop";
    const homepageLayout = this.website.createHomepageLayout(ctx.companyName, ctx.industry);
    const productCatalogueStructure = this.catalogue.createProductCatalogue(ctx.industry);
    const categoryStructure = this.catalogue.createCategoryStructure(ctx.industry);
    const companyInformationPages = this.website.createCompanyInformationPages(ctx.companyName);
    const legalPageTemplates = this.website.prepareLegalPageTemplates();

    const fingerprint = createHash("sha256")
      .update(
        `${ctx.companyReference}|${ctx.brandReference}|${ctx.domainPlanReference}|${websiteStructureReference}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);
    if (this.store.hasFingerprint(fingerprint)) {
      return this.metadataGenerator.buildRunReport({
        action: "generate_storefront",
        engineRecord: engine,
        storefrontRecords: [],
        validation: {
          validationReportId: `sge-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Duplicate storefront structure detected — generation blocked"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: SGE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    let record = this.store.create({
      companyReference: ctx.companyReference,
      brandReference: ctx.brandReference,
      domainPlanReference: ctx.domainPlanReference,
      websiteStructureReference,
      navigationStructure,
      homepageLayout,
      productCatalogueStructure,
      categoryStructure,
      companyInformationPages,
      legalPageTemplates,
      deploymentPackageReference: "pending",
      storefrontStatus: "structured",
      deploymentReadiness: "partial",
      validationStatus: "pending",
    });

    if (config.deploymentPreparationRulesEnabled) {
      record.deploymentPackageReference = this.deployment.prepare(
        record.storefrontId,
        ctx.companyName,
        ctx.domainPlanReference,
      );
    } else {
      record.deploymentPackageReference = `structural://deployment-package/${record.storefrontId}`;
    }

    record.storefrontStatus = this.storefront.deriveStatus({
      hasWebsite: Boolean(record.websiteStructureReference),
      hasNavigation: Boolean(record.navigationStructure),
      hasCatalogue: Boolean(record.productCatalogueStructure),
      hasDeploymentPackage: Boolean(record.deploymentPackageReference),
    });
    record.deploymentReadiness = this.storefront.deriveDeploymentReadiness(
      record.storefrontStatus,
      input.validated !== false,
    );
    record.automaticDeployment = false;
    record.structuralSignalOnly = true;
    record.fabricatedStorefrontFacts = false;

    const recordValidation = this.validator.validateStorefrontRecord(record);
    record.validationStatus =
      recordValidation.decision === "fail"
        ? "failed"
        : recordValidation.decision === "partial"
          ? "partial"
          : "passed";
    this.store.persist(record);

    appendSgeLog({
      event: "store_generation",
      level: "info",
      details: `Created structural storefront · id=${record.storefrontId}`,
    });
    appendSgeLog({
      event: "website_generation",
      level: "info",
      details: `Website structure · ${record.websiteStructureReference}`,
    });
    appendSgeLog({
      event: "navigation_generation",
      level: "info",
      details: `Navigation · ${record.navigationStructure}`,
    });
    appendSgeLog({
      event: "deployment_preparation",
      level: "info",
      details: `Deployment package prepared (not deployed) · ${record.deploymentPackageReference}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "generate_storefront",
      engineRecord: engine,
      storefrontRecords: [record],
      validation: recordValidation,
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(storefrontId?: string): StorefrontRecord {
    if (storefrontId) {
      const found = this.store.get(storefrontId);
      if (!found) throw new Error(`Storefront not found: ${storefrontId}`);
      return found;
    }
    const all = this.store.list();
    if (all.length === 0) throw new Error("No storefront records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: StorefrontActionInput,
    config: StoreGenerationEngineConfiguration,
  ): StorefrontRecord {
    try {
      return this.requireRecord(input.storefrontId);
    } catch {
      const created = this.generateStorefront(
        {
          companyReference: input.companyReference,
          brandReference: input.brandReference,
          domainPlanReference: input.domainPlanReference,
          industry: input.industry,
          validated: true,
        },
        config,
      );
      return created.storefrontRecords[0]!;
    }
  }

  private actionPass(
    action: StorefrontRunReport["action"],
    transform: (record: StorefrontRecord, ctx: ReturnType<StoreGenerationManager["resolveContext"]>) => StorefrontRecord,
    input: StorefrontActionInput,
    config: StoreGenerationEngineConfiguration,
    event: string,
  ): StorefrontRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const ctx = this.resolveContext(input);
    let record = this.ensureRecord(input, config);
    record = transform(record, ctx);
    record.automaticDeployment = false;
    record.structuralSignalOnly = true;
    record.fabricatedStorefrontFacts = false;
    record.storefrontStatus = this.storefront.deriveStatus({
      hasWebsite: Boolean(record.websiteStructureReference),
      hasNavigation: Boolean(record.navigationStructure),
      hasCatalogue: Boolean(record.productCatalogueStructure),
      hasDeploymentPackage:
        Boolean(record.deploymentPackageReference) &&
        record.deploymentPackageReference !== "pending",
    });
    record.deploymentReadiness = this.storefront.deriveDeploymentReadiness(
      record.storefrontStatus,
      true,
    );
    this.store.persist(record);

    appendSgeLog({
      event,
      level: "info",
      details: `${action} · id=${record.storefrontId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      storefrontRecords: [record],
      validation: this.validator.validateStorefrontRecord(record),
      durationMs: Date.now() - started,
    });
  }

  createWebsiteStructure(
    input: StorefrontActionInput,
    config: StoreGenerationEngineConfiguration,
  ): StorefrontRunReport {
    if (!config.websiteGenerationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "create_website_structure",
        engineRecord: engine,
        storefrontRecords: [],
        validation: {
          validationReportId: `sge-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Website generation rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: SGE_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "create_website_structure",
      (r, ctx) => ({
        ...r,
        websiteStructureReference: this.website.createStructure(ctx.companyName, ctx.industry),
      }),
      input,
      config,
      "website_generation",
    );
  }

  createNavigationStructure(
    input: StorefrontActionInput,
    config: StoreGenerationEngineConfiguration,
  ): StorefrontRunReport {
    if (!config.navigationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "create_navigation_structure",
        engineRecord: engine,
        storefrontRecords: [],
        validation: {
          validationReportId: `sge-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Navigation rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: SGE_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "create_navigation_structure",
      (r, ctx) => ({
        ...r,
        navigationStructure: this.navigation.build(ctx.companyName, ctx.industry),
      }),
      input,
      config,
      "navigation_generation",
    );
  }

  createHomepageLayout(
    input: StorefrontActionInput,
    config: StoreGenerationEngineConfiguration,
  ): StorefrontRunReport {
    return this.actionPass(
      "create_homepage_layout",
      (r, ctx) => ({
        ...r,
        homepageLayout: this.website.createHomepageLayout(ctx.companyName, ctx.industry),
      }),
      input,
      config,
      "website_generation",
    );
  }

  createProductCatalogueStructure(
    input: StorefrontActionInput,
    config: StoreGenerationEngineConfiguration,
  ): StorefrontRunReport {
    return this.actionPass(
      "create_product_catalogue_structure",
      (r, ctx) => ({
        ...r,
        productCatalogueStructure: this.catalogue.createProductCatalogue(ctx.industry),
      }),
      input,
      config,
      "store_generation",
    );
  }

  createCategoryStructure(
    input: StorefrontActionInput,
    config: StoreGenerationEngineConfiguration,
  ): StorefrontRunReport {
    return this.actionPass(
      "create_category_structure",
      (r, ctx) => ({
        ...r,
        categoryStructure: this.catalogue.createCategoryStructure(ctx.industry),
      }),
      input,
      config,
      "store_generation",
    );
  }

  createCompanyInformationPages(
    input: StorefrontActionInput,
    config: StoreGenerationEngineConfiguration,
  ): StorefrontRunReport {
    return this.actionPass(
      "create_company_information_pages",
      (r, ctx) => ({
        ...r,
        companyInformationPages: this.website.createCompanyInformationPages(ctx.companyName),
      }),
      input,
      config,
      "website_generation",
    );
  }

  prepareLegalPageTemplates(
    input: StorefrontActionInput,
    config: StoreGenerationEngineConfiguration,
  ): StorefrontRunReport {
    return this.actionPass(
      "prepare_legal_page_templates",
      (r) => ({
        ...r,
        legalPageTemplates: this.website.prepareLegalPageTemplates(),
      }),
      input,
      config,
      "website_generation",
    );
  }

  prepareDeploymentPackage(
    input: StorefrontActionInput,
    config: StoreGenerationEngineConfiguration,
  ): StorefrontRunReport {
    if (!config.deploymentPreparationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "prepare_deployment_package",
        engineRecord: engine,
        storefrontRecords: [],
        validation: {
          validationReportId: `sge-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Deployment preparation rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: SGE_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "prepare_deployment_package",
      (r, ctx) => ({
        ...r,
        deploymentPackageReference: this.deployment.prepare(
          r.storefrontId,
          ctx.companyName,
          r.domainPlanReference,
        ),
        automaticDeployment: false as const,
      }),
      input,
      config,
      "deployment_preparation",
    );
  }
}
