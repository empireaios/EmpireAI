/** R5-11 — Creative Asset Manager. */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { CampaignManagerEngine } from "../campaign-manager/engine.js";
import type { MarketingAnalyticsDashboard } from "../marketing-analytics-dashboard/engine.js";
import { CRA_METADATA_VERSION, CREATIVE_ASSET_MANAGER_ID } from "./paths.js";
import { appendCraLog } from "./cra-logging.js";
import { AssetLibraryEngine, defaultClassification } from "./asset-library-engine.js";
import { AssetVersionManager } from "./asset-version-manager.js";
import { AssetClassificationEngine } from "./asset-classification-engine.js";
import { AssetSearchEngine } from "./asset-search-engine.js";
import { AssetUsageTracker } from "./asset-usage-tracker.js";
import { CreativeValidator } from "./creative-validator.js";
import { CreativeMetadataGenerator } from "./creative-metadata-generator.js";
import type { CreativeAssetManagerConfiguration } from "./configuration.js";
import type {
  ApproveAssetInput,
  ClassifyAssetInput,
  ConnectCreativeAssetManagerInput,
  CreateAssetInput,
  CreateVersionInput,
  CreativeAssetRecord,
  CreativeEngineRecord,
  CreativeRunReport,
  SearchAssetsInput,
  TagAssetInput,
  TrackUsageInput,
  UpdateAssetInput,
} from "./types.js";

export type CreativeAssetManagerDependencies = {
  marketingFramework: MarketingFrameworkEngine | null;
  campaignManager: CampaignManagerEngine | null;
  marketingAnalyticsDashboard: MarketingAnalyticsDashboard | null;
};

export class CreativeAssetManagerCore {
  private engineRecord: CreativeEngineRecord | null = null;
  private readonly library = new AssetLibraryEngine();
  private readonly versions = new AssetVersionManager();
  private readonly classification = new AssetClassificationEngine();
  private readonly search = new AssetSearchEngine();
  private readonly usage = new AssetUsageTracker();
  private readonly validator = new CreativeValidator();
  private readonly metadataGenerator = new CreativeMetadataGenerator();

  constructor(private readonly deps: CreativeAssetManagerDependencies) {}

  getEngineRecord(): CreativeEngineRecord | null {
    return this.engineRecord;
  }

  getAssetRecords(): CreativeAssetRecord[] {
    return this.library.list();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): CreativeEngineRecord["dependencyPresence"] {
    return {
      marketingFramework: this.deps.marketingFramework
        ? this.probe(() => this.deps.marketingFramework!.getState())
        : false,
      campaignManager: this.deps.campaignManager
        ? this.probe(() => this.deps.campaignManager!.getState())
        : false,
      marketingAnalyticsDashboard: this.deps.marketingAnalyticsDashboard
        ? this.probe(() => this.deps.marketingAnalyticsDashboard!.getState())
        : false,
    };
  }

  private requireConnected(): CreativeEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Creative Asset Manager not connected — call connectCreativeAssetManager first",
      );
    }
    return this.engineRecord;
  }

  private requireAsset(assetId: string): CreativeAssetRecord {
    const asset = this.library.get(assetId);
    if (!asset) throw new Error(`Asset not found: ${assetId}`);
    return asset;
  }

  private resolveCampaignReference(preferred?: string): string | null {
    if (preferred?.trim()) return preferred.trim();
    if (!this.deps.campaignManager) return null;
    try {
      const campaigns = this.deps.campaignManager.getCampaignRecords();
      return campaigns[0]?.campaignId ?? null;
    } catch {
      return null;
    }
  }

  registerWithFramework(
    config: CreativeAssetManagerConfiguration,
  ): { frameworkModuleId: string | null; validation: CreativeRunReport["validation"] } {
    if (!this.deps.marketingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.marketingFramework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: CREATIVE_ASSET_MANAGER_ID,
        moduleVersion: CRA_METADATA_VERSION,
        moduleType: "marketing",
        integrationMissionId: "R5-11",
        authenticationMethod: "none",
        credentialRef: "vault://creative-asset-manager",
        apiEndpointConfig: {
          baseUrl: "internal://creative-asset-manager",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "creative.created",
            "creative.versioned",
            "creative.approved",
            "creative.usage",
            "creative.failed",
          ],
          maxEventsPerMinute: 120,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: true,
          requestsPerMinute: 120,
          burstLimit: 20,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "marketing_module_registration",
          "marketing_module_activation",
          "marketing_event_routing",
        ],
      },
      forceRegister: true,
    });

    appendCraLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Creative Asset Manager with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `cra-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: CRA_METADATA_VERSION,
      },
    };
  }

  connectCreativeAssetManager(
    _input: ConnectCreativeAssetManagerInput,
    config: CreativeAssetManagerConfiguration,
  ): CreativeRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    if (this.deps.marketingFramework && frameworkReg.validation.decision !== "fail") {
      this.deps.marketingFramework.activateMarketingModule(CREATIVE_ASSET_MANAGER_ID);
    }

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

    appendCraLog({
      event: "engine_connect",
      level: "info",
      details: `Creative Asset Manager connected · deps=${Object.values(deps).filter(Boolean).length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      assetRecords: [],
      versions: [],
      usageEvents: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createAsset(
    input: CreateAssetInput,
    config: CreativeAssetManagerConfiguration,
  ): CreativeRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateCreate(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "create_asset",
        engineRecord: engine,
        assetRecords: [],
        versions: [],
        usageEvents: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const campaignReference = this.resolveCampaignReference(input.campaignReference);
    const classification = config.assetClassificationRulesEnabled
      ? defaultClassification(input.assetType)
      : "unclassified";
    const asset = this.library.create({
      assetName: input.assetName,
      assetType: input.assetType,
      tags: input.tags,
      storageRef: input.storageRef,
      campaignReference,
      classification,
    });
    const version = this.versions.seedInitial(asset);

    appendCraLog({
      event: "asset_creation",
      level: "info",
      details: `Created asset · type=${asset.assetType} · id=${asset.assetId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "create_asset",
      engineRecord: engine,
      assetRecords: [asset],
      versions: [version],
      usageEvents: [],
      validation: this.validator.validateAssetRecord(asset),
      durationMs: Date.now() - started,
    });
  }

  updateAsset(
    input: UpdateAssetInput,
    config: CreativeAssetManagerConfiguration,
  ): CreativeRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const existing = this.library.get(input.assetId);
    const validation = this.validator.validateUpdate(input, existing, config);
    if (validation.decision === "fail" || !existing) {
      return this.metadataGenerator.buildRunReport({
        action: "update_asset",
        engineRecord: engine,
        assetRecords: existing ? [existing] : [],
        versions: [],
        usageEvents: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const updated: CreativeAssetRecord = {
      ...existing,
      assetName: input.assetName?.trim() || existing.assetName,
      tags: input.tags
        ? [...new Set(input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))]
        : existing.tags,
      campaignReference:
        input.campaignReference !== undefined
          ? this.resolveCampaignReference(input.campaignReference)
          : existing.campaignReference,
      validationStatus: "passed",
      timestamp: new Date().toISOString(),
    };
    this.library.persist(updated);

    appendCraLog({
      event: "asset_updates",
      level: "info",
      details: `Updated asset · id=${updated.assetId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "update_asset",
      engineRecord: engine,
      assetRecords: [updated],
      versions: this.versions.listForAsset(updated.assetId),
      usageEvents: [],
      validation: this.validator.validateAssetRecord(updated),
      durationMs: Date.now() - started,
    });
  }

  createVersion(
    input: CreateVersionInput,
    config: CreativeAssetManagerConfiguration,
  ): CreativeRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.versionManagementRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "create_version",
        engineRecord: engine,
        assetRecords: [],
        versions: [],
        usageEvents: [],
        validation: {
          validationReportId: `cra-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Version management rules disabled"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CRA_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    let asset: CreativeAssetRecord;
    try {
      asset = this.requireAsset(input.assetId);
    } catch (error) {
      return this.metadataGenerator.buildRunReport({
        action: "create_version",
        engineRecord: engine,
        assetRecords: [],
        versions: [],
        usageEvents: [],
        validation: {
          validationReportId: `cra-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [error instanceof Error ? error.message : "Asset missing"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CRA_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const { asset: updated, version } = this.versions.createVersion(asset, input.changeSummary);
    this.library.persist(updated);

    appendCraLog({
      event: "version_changes",
      level: "info",
      details: `Created version ${version.version} · asset=${updated.assetId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "create_version",
      engineRecord: engine,
      assetRecords: [updated],
      versions: [version],
      usageEvents: [],
      validation: this.validator.validateAssetRecord(updated),
      durationMs: Date.now() - started,
    });
  }

  approveAsset(
    input: ApproveAssetInput,
    config: CreativeAssetManagerConfiguration,
  ): CreativeRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.approvalWorkflowRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: input.approved === false ? "reject_asset" : "approve_asset",
        engineRecord: engine,
        assetRecords: [],
        versions: [],
        usageEvents: [],
        validation: {
          validationReportId: `cra-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Approval workflow rules disabled"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CRA_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    let asset: CreativeAssetRecord;
    try {
      asset = this.requireAsset(input.assetId);
    } catch (error) {
      return this.metadataGenerator.buildRunReport({
        action: "approve_asset",
        engineRecord: engine,
        assetRecords: [],
        versions: [],
        usageEvents: [],
        validation: {
          validationReportId: `cra-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [error instanceof Error ? error.message : "Asset missing"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CRA_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const approved = input.approved !== false;
    const updated: CreativeAssetRecord = {
      ...asset,
      approvalStatus: approved ? "approved" : "rejected",
      validationStatus: approved ? "passed" : "failed",
      timestamp: new Date().toISOString(),
    };
    this.library.persist(updated);
    this.versions.syncApproval(updated.assetId, updated.version, updated.approvalStatus);

    appendCraLog({
      event: approved ? "asset_updates" : "asset_failures",
      level: "info",
      details: `${approved ? "Approved" : "Rejected"} asset · id=${updated.assetId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: approved ? "approve_asset" : "reject_asset",
      engineRecord: engine,
      assetRecords: [updated],
      versions: this.versions.listForAsset(updated.assetId),
      usageEvents: [],
      validation: this.validator.validateAssetRecord(updated),
      durationMs: Date.now() - started,
    });
  }

  tagAsset(input: TagAssetInput, config: CreativeAssetManagerConfiguration): CreativeRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const existing = this.library.get(input.assetId);
    if (!existing) {
      return this.metadataGenerator.buildRunReport({
        action: "tag_asset",
        engineRecord: engine,
        assetRecords: [],
        versions: [],
        usageEvents: [],
        validation: {
          validationReportId: `cra-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [`Asset not found: ${input.assetId}`],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CRA_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const updated: CreativeAssetRecord = {
      ...existing,
      tags: [...new Set(input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))],
      timestamp: new Date().toISOString(),
    };
    this.library.persist(updated);

    appendCraLog({
      event: "asset_updates",
      level: "info",
      details: `Tagged asset · id=${updated.assetId} · tags=${updated.tags.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "tag_asset",
      engineRecord: engine,
      assetRecords: [updated],
      versions: [],
      usageEvents: [],
      validation: this.validator.validateAssetRecord(updated),
      durationMs: Date.now() - started,
    });
  }

  trackUsage(
    input: TrackUsageInput,
    _config: CreativeAssetManagerConfiguration,
  ): CreativeRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let asset: CreativeAssetRecord;
    try {
      asset = this.requireAsset(input.assetId);
    } catch (error) {
      return this.metadataGenerator.buildRunReport({
        action: "track_usage",
        engineRecord: engine,
        assetRecords: [],
        versions: [],
        usageEvents: [],
        validation: {
          validationReportId: `cra-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [error instanceof Error ? error.message : "Asset missing"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CRA_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const { asset: updated, event } = this.usage.track(
      asset,
      input.context,
      input.campaignReference ?? this.resolveCampaignReference(),
    );
    this.library.persist(updated);

    appendCraLog({
      event: "asset_usage",
      level: "info",
      details: `Tracked usage · asset=${updated.assetId} · count=${updated.usageCount}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "track_usage",
      engineRecord: engine,
      assetRecords: [updated],
      versions: [],
      usageEvents: [event],
      validation: this.validator.validateAssetRecord(updated),
      durationMs: Date.now() - started,
    });
  }

  searchAssets(
    input: SearchAssetsInput,
    _config: CreativeAssetManagerConfiguration,
  ): CreativeRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const results = this.search.search(this.library.list(), input);

    return this.metadataGenerator.buildRunReport({
      action: "search_assets",
      engineRecord: engine,
      assetRecords: results,
      versions: [],
      usageEvents: [],
      validation: {
        validationReportId: `cra-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "pass",
        errors: [],
        warnings: results.length === 0 ? ["No assets matched search criteria"] : [],
        durationMs: Date.now() - started,
        metadataVersion: CRA_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  classifyAsset(
    input: ClassifyAssetInput,
    config: CreativeAssetManagerConfiguration,
  ): CreativeRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.assetClassificationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "classify_asset",
        engineRecord: engine,
        assetRecords: [],
        versions: [],
        usageEvents: [],
        validation: {
          validationReportId: `cra-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Asset classification rules disabled"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CRA_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    let asset: CreativeAssetRecord;
    try {
      asset = this.requireAsset(input.assetId);
    } catch (error) {
      return this.metadataGenerator.buildRunReport({
        action: "classify_asset",
        engineRecord: engine,
        assetRecords: [],
        versions: [],
        usageEvents: [],
        validation: {
          validationReportId: `cra-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [error instanceof Error ? error.message : "Asset missing"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CRA_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const updated = this.classification.classify(asset);
    this.library.persist(updated);

    return this.metadataGenerator.buildRunReport({
      action: "classify_asset",
      engineRecord: engine,
      assetRecords: [updated],
      versions: [],
      usageEvents: [],
      validation: this.validator.validateAssetRecord(updated),
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.library.resetForTesting();
    this.versions.resetForTesting();
    this.usage.resetForTesting();
  }
}
