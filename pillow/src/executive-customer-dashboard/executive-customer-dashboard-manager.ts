/** R4-18 — Executive Customer Dashboard Manager. */

import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { AiCustomerSupport } from "../ai-customer-support/engine.js";
import type { CustomerSentimentEngine } from "../customer-sentiment-engine/engine.js";
import type { ReviewManagementEngine } from "../review-management-engine/engine.js";
import type { LoyaltyProgrammeEngine } from "../loyalty-programme-engine/engine.js";
import type { CustomerRiskEngine } from "../customer-risk-engine/engine.js";
import type { CustomerLifetimeValueEngine } from "../customer-lifetime-value-engine/engine.js";
import type { CustomerSegmentationEngine } from "../customer-segmentation-engine/engine.js";
import type { CustomerJourneyIntelligenceEngine } from "../customer-journey-intelligence-engine/engine.js";
import { appendEcdLog } from "./ecd-logging.js";
import { DashboardRegistry } from "./dashboard-registry.js";
import { CustomerDashboardDataSource } from "./customer-dashboard-data-source.js";
import { CustomerDashboardEngine } from "./customer-dashboard-engine.js";
import { CustomerKpiEngine } from "./customer-kpi-engine.js";
import { CustomerAnalyticsAggregator } from "./customer-analytics-aggregator.js";
import { DashboardWidgetManager } from "./dashboard-widget-manager.js";
import { DashboardMetadataGenerator } from "./dashboard-metadata-generator.js";
import { DashboardValidator } from "./dashboard-validator.js";
import type { ExecutiveCustomerDashboardConfiguration } from "./configuration.js";
import type {
  ConnectExecutiveCustomerDashboardInput,
  CustomerDashboardSnapshot,
  DashboardFailure,
  DashboardWidget,
  DetectDashboardFailuresInput,
  ExecutiveCustomerDashboardRecord,
  ExecutiveCustomerDashboardRunReport,
  GetDashboardWidgetsInput,
  RefreshExecutiveCustomerDashboardInput,
  WidgetType,
} from "./types.js";

export class ExecutiveCustomerDashboardManager {
  private engineRecord: ExecutiveCustomerDashboardRecord | null = null;
  private readonly registry = new DashboardRegistry();
  private readonly validator = new DashboardValidator();
  private readonly metadataGenerator = new DashboardMetadataGenerator();
  private readonly dashboardEngine = new CustomerDashboardEngine();
  private readonly kpiEngine = new CustomerKpiEngine();
  private readonly analyticsAggregator = new CustomerAnalyticsAggregator();
  private readonly widgetManager = new DashboardWidgetManager();
  private readonly dataSource: CustomerDashboardDataSource;

  constructor(
    private readonly identityEngine: CustomerIdentityEngine | null,
    private readonly crmFoundation: CrmFoundationEngine | null,
    private readonly timelineEngine: CustomerTimelineEngine | null,
    private readonly aiCustomerSupport: AiCustomerSupport | null,
    private readonly sentimentEngine: CustomerSentimentEngine | null,
    private readonly reviewManagementEngine: ReviewManagementEngine | null,
    private readonly loyaltyProgrammeEngine: LoyaltyProgrammeEngine | null,
    private readonly customerRiskEngine: CustomerRiskEngine | null,
    private readonly customerLifetimeValueEngine: CustomerLifetimeValueEngine | null,
    private readonly customerSegmentationEngine: CustomerSegmentationEngine | null,
    private readonly customerJourneyIntelligenceEngine: CustomerJourneyIntelligenceEngine | null,
  ) {
    this.dataSource = new CustomerDashboardDataSource(
      identityEngine,
      crmFoundation,
      timelineEngine,
      aiCustomerSupport,
      sentimentEngine,
      reviewManagementEngine,
      loyaltyProgrammeEngine,
      customerRiskEngine,
      customerLifetimeValueEngine,
      customerSegmentationEngine,
      customerJourneyIntelligenceEngine,
    );
  }

  getEngineRecord(): ExecutiveCustomerDashboardRecord | null {
    return this.engineRecord;
  }

  getSnapshots(): CustomerDashboardSnapshot[] {
    return this.registry.list();
  }

  getRegistry(): DashboardRegistry {
    return this.registry;
  }

  getMetadataGenerator(): DashboardMetadataGenerator {
    return this.metadataGenerator;
  }

  private isConnected(record: { currentOperationalState?: string } | null | undefined): boolean {
    const state = record?.currentOperationalState;
    return state === "active" || state === "connected";
  }

  private probeConnections() {
    return {
      identityEngineConnected: this.isConnected(this.identityEngine?.getEngineRecord?.()),
      crmFoundationConnected: this.isConnected(this.crmFoundation?.getEngineRecord?.()),
      timelineEngineConnected: this.isConnected(this.timelineEngine?.getEngineRecord?.()),
      aiCustomerSupportConnected: this.isConnected(this.aiCustomerSupport?.getEngineRecord?.()),
      sentimentEngineConnected: this.isConnected(this.sentimentEngine?.getEngineRecord?.()),
      reviewManagementEngineConnected: this.isConnected(this.reviewManagementEngine?.getEngineRecord?.()),
      loyaltyProgrammeEngineConnected: this.isConnected(this.loyaltyProgrammeEngine?.getEngineRecord?.()),
      customerRiskEngineConnected: this.isConnected(this.customerRiskEngine?.getEngineRecord?.()),
      customerLifetimeValueEngineConnected: this.isConnected(
        this.customerLifetimeValueEngine?.getEngineRecord?.(),
      ),
      customerSegmentationEngineConnected: this.isConnected(
        this.customerSegmentationEngine?.getEngineRecord?.(),
      ),
      customerJourneyIntelligenceEngineConnected: this.isConnected(
        this.customerJourneyIntelligenceEngine?.getEngineRecord?.(),
      ),
    };
  }

  connectExecutiveCustomerDashboard(
    _input: ConnectExecutiveCustomerDashboardInput,
    config: ExecutiveCustomerDashboardConfiguration,
  ): ExecutiveCustomerDashboardRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const connections = this.probeConnections();

    const coreConnected =
      connections.identityEngineConnected && connections.timelineEngineConnected;
    const record = this.metadataGenerator.buildEngineRecord({
      operationalState:
        configValidation.decision === "fail" ? "failed" : coreConnected ? "active" : "connected",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      ...connections,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (configValidation.decision !== "pass") {
      validation.warnings.push(...configValidation.warnings);
      if (configValidation.errors.length > 0) {
        validation.errors.push(...configValidation.errors);
        validation.decision = "fail";
      } else {
        validation.decision = "partial";
      }
    }

    appendEcdLog({
      event: "engine_initialization",
      level: "info",
      details: `Executive Customer Dashboard connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      snapshots: [],
      widgets: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private buildDashboardSnapshot(config: ExecutiveCustomerDashboardConfiguration): {
    snapshot: CustomerDashboardSnapshot | null;
    widgets: DashboardWidget[];
    error: string | null;
    warnings: string[];
  } {
    const data = this.dataSource.aggregate();
    const snapshot = this.dashboardEngine.buildSnapshot(data, config);
    const kpis = this.kpiEngine.aggregate(data, config);
    this.analyticsAggregator.enrichSnapshotKpis(snapshot, kpis);

    const snapshotValidation = this.validator.validateSnapshot(snapshot, config);
    if (snapshotValidation.decision === "fail") {
      return {
        snapshot: null,
        widgets: [],
        error: snapshotValidation.errors.join("; "),
        warnings: [...data.warnings, ...snapshotValidation.warnings],
      };
    }

    const widgets = this.widgetManager.buildWidgets(snapshot, data, config);
    return {
      snapshot,
      widgets,
      error: null,
      warnings: [...data.warnings, ...snapshotValidation.warnings],
    };
  }

  private runAction(
    action: ExecutiveCustomerDashboardRunReport["action"],
    fn: () => {
      snapshots: CustomerDashboardSnapshot[];
      widgets: DashboardWidget[];
      failures: DashboardFailure[];
      error: string | null;
      warnings: string[];
    },
    config: ExecutiveCustomerDashboardConfiguration,
  ): ExecutiveCustomerDashboardRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Executive Customer Dashboard not connected");

    const result = fn();
    const validation = this.validator.validateEngineRecord(engineRecord);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      snapshots: result.snapshots,
      widgets: result.widgets,
      failures: result.failures,
      validation,
      durationMs: Date.now() - started,
    });
  }

  refreshExecutiveCustomerDashboard(
    input: RefreshExecutiveCustomerDashboardInput,
    config: ExecutiveCustomerDashboardConfiguration,
  ): ExecutiveCustomerDashboardRunReport {
    const refreshKey = `refresh:${Math.floor(Date.now() / config.dashboardRefreshFrequencyMs)}`;
    if (!input.forceRefresh && this.registry.hasRefreshKey(refreshKey)) {
      return this.runAction(
        "refresh_dashboard",
        () => ({
          snapshots: [],
          widgets: [],
          failures: [],
          error: "Duplicate dashboard refresh within frequency window",
          warnings: [],
        }),
        config,
      );
    }

    return this.runAction(
      "refresh_dashboard",
      () => {
        const result = this.buildDashboardSnapshot(config);
        if (result.snapshot) {
          this.registry.store(result.snapshot, refreshKey);
          appendEcdLog({
            event: "dashboard_refresh",
            level: "info",
            details: `Dashboard ${result.snapshot.dashboardId} refreshed`,
          });
        }
        return {
          snapshots: result.snapshot ? [result.snapshot] : [],
          widgets: result.widgets,
          failures: [],
          error: result.error,
          warnings: result.warnings,
        };
      },
      config,
    );
  }

  private displaySection(
    action: ExecutiveCustomerDashboardRunReport["action"],
    widgetType: WidgetType,
    logEvent: string,
    config: ExecutiveCustomerDashboardConfiguration,
  ): ExecutiveCustomerDashboardRunReport {
    return this.runAction(
      action,
      () => {
        const result = this.buildDashboardSnapshot(config);
        if (!result.snapshot) {
          return {
            snapshots: [],
            widgets: [],
            failures: [],
            error: result.error,
            warnings: result.warnings,
          };
        }
        this.registry.store(result.snapshot);
        appendEcdLog({
          event: logEvent,
          level: "info",
          details: `Displayed ${widgetType} for dashboard ${result.snapshot.dashboardId}`,
        });
        return {
          snapshots: [result.snapshot],
          widgets: this.widgetManager.buildWidgets(
            result.snapshot,
            this.dataSource.aggregate(),
            config,
            [widgetType],
          ),
          failures: [],
          error: null,
          warnings: result.warnings,
        };
      },
      config,
    );
  }

  displayCustomerGrowth(config: ExecutiveCustomerDashboardConfiguration) {
    return this.displaySection("display_growth", "growth", "kpi_aggregation", config);
  }

  displayCustomerActivity(config: ExecutiveCustomerDashboardConfiguration) {
    return this.displaySection("display_activity", "activity", "kpi_aggregation", config);
  }

  displayCustomerLifetimeValue(config: ExecutiveCustomerDashboardConfiguration) {
    return this.displaySection("display_lifetime_value", "lifetime_value", "kpi_aggregation", config);
  }

  displayCustomerSegmentation(config: ExecutiveCustomerDashboardConfiguration) {
    return this.displaySection("display_segmentation", "segmentation", "kpi_aggregation", config);
  }

  displayCustomerSentiment(config: ExecutiveCustomerDashboardConfiguration) {
    return this.displaySection("display_sentiment", "sentiment", "kpi_aggregation", config);
  }

  displayCustomerLoyalty(config: ExecutiveCustomerDashboardConfiguration) {
    return this.displaySection("display_loyalty", "loyalty", "kpi_aggregation", config);
  }

  displayCustomerJourneyAnalytics(config: ExecutiveCustomerDashboardConfiguration) {
    return this.displaySection("display_journey", "journey", "kpi_aggregation", config);
  }

  displayCustomerRisk(config: ExecutiveCustomerDashboardConfiguration) {
    return this.displaySection("display_risk", "risk", "kpi_aggregation", config);
  }

  displayCustomerSupportMetrics(config: ExecutiveCustomerDashboardConfiguration) {
    return this.displaySection("display_support", "support", "kpi_aggregation", config);
  }

  aggregateExecutiveCustomerKpis(
    config: ExecutiveCustomerDashboardConfiguration,
  ): ExecutiveCustomerDashboardRunReport {
    return this.runAction(
      "aggregate_kpis",
      () => {
        const data = this.dataSource.aggregate();
        const kpis = this.kpiEngine.aggregate(data, config);
        const snapshot = this.dashboardEngine.buildSnapshot(data, config);
        this.analyticsAggregator.enrichSnapshotKpis(snapshot, kpis);
        this.registry.store(snapshot);

        appendEcdLog({
          event: "kpi_aggregation",
          level: "info",
          details: `Aggregated ${kpis.length} executive customer KPIs`,
        });

        return {
          snapshots: [snapshot],
          widgets: this.widgetManager.buildWidgets(snapshot, data, config, ["kpi"]),
          failures: [],
          error: null,
          warnings: data.warnings,
        };
      },
      config,
    );
  }

  getDashboardWidgets(
    input: GetDashboardWidgetsInput,
    config: ExecutiveCustomerDashboardConfiguration,
  ): ExecutiveCustomerDashboardRunReport {
    return this.runAction(
      "get_widgets",
      () => {
        const latest = this.registry.latest();
        if (!latest) {
          const refreshed = this.buildDashboardSnapshot(config);
          if (!refreshed.snapshot) {
            return {
              snapshots: [],
              widgets: [],
              failures: [],
              error: refreshed.error ?? "No dashboard snapshot available",
              warnings: refreshed.warnings,
            };
          }
          this.registry.store(refreshed.snapshot);
          return {
            snapshots: [refreshed.snapshot],
            widgets: this.widgetManager.buildWidgets(
              refreshed.snapshot,
              this.dataSource.aggregate(),
              config,
              input.widgetTypes,
            ),
            failures: [],
            error: null,
            warnings: refreshed.warnings,
          };
        }

        const data = this.dataSource.aggregate();
        return {
          snapshots: [latest],
          widgets: this.widgetManager.buildWidgets(latest, data, config, input.widgetTypes),
          failures: [],
          error: null,
          warnings: data.warnings,
        };
      },
      config,
    );
  }

  detectDashboardFailures(
    input: DetectDashboardFailuresInput,
    config: ExecutiveCustomerDashboardConfiguration,
  ): ExecutiveCustomerDashboardRunReport {
    return this.runAction(
      "detect_failures",
      () => {
        const detected: DashboardFailure[] = [];
        const snapshots = input.dashboardId
          ? [this.registry.get(input.dashboardId)].filter(Boolean)
          : this.registry.list();

        for (const snapshot of snapshots as CustomerDashboardSnapshot[]) {
          if (snapshot.customerGrowthSummary.totalCustomers === 0) {
            detected.push(
              this.metadataGenerator.buildFailure({
                dashboardId: snapshot.dashboardId,
                reason: "Dashboard snapshot has zero customers",
                severity: "medium",
              }),
            );
          }
        }

        return {
          snapshots: snapshots as CustomerDashboardSnapshot[],
          widgets: [],
          failures: detected,
          error: null,
          warnings: [],
        };
      },
      config,
    );
  }

  reportDashboardStatus(
    config: ExecutiveCustomerDashboardConfiguration,
  ): ExecutiveCustomerDashboardRunReport {
    return this.runAction(
      "report_status",
      () => ({
        snapshots: this.registry.list(),
        widgets: [],
        failures: [],
        error: null,
        warnings: [],
      }),
      config,
    );
  }

  reportDashboardHealth(
    config: ExecutiveCustomerDashboardConfiguration,
  ): ExecutiveCustomerDashboardRunReport {
    return this.runAction(
      "report_health",
      () => ({
        snapshots: this.registry.list().slice(-5),
        widgets: [],
        failures: [],
        error: null,
        warnings: [`Health snapshot: ${this.registry.list().length} dashboard snapshot(s)`],
      }),
      config,
    );
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
  }
}
