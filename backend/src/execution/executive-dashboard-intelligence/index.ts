export {
  REVENUE_TRENDS,
  revenueWidgetSchema,
  validateRevenueWidget,
} from "./models/revenue-widget.js";
export type { RevenueTrend, RevenueWidget } from "./models/revenue-widget.js";

export {
  ordersWidgetSchema,
  validateOrdersWidget,
} from "./models/orders-widget.js";
export type { OrdersWidget } from "./models/orders-widget.js";

export {
  visitorsWidgetSchema,
  validateVisitorsWidget,
} from "./models/visitors-widget.js";
export type { VisitorsWidget } from "./models/visitors-widget.js";

export {
  roasWidgetSchema,
  validateRoasWidget,
} from "./models/roas-widget.js";
export type { RoasWidget } from "./models/roas-widget.js";

export {
  profitWidgetSchema,
  validateProfitWidget,
} from "./models/profit-widget.js";
export type { ProfitWidget } from "./models/profit-widget.js";

export {
  INVENTORY_STATUSES,
  inventoryWidgetSchema,
  validateInventoryWidget,
} from "./models/inventory-widget.js";
export type { InventoryStatus, InventoryWidget } from "./models/inventory-widget.js";

export {
  marketingWidgetSchema,
  validateMarketingWidget,
} from "./models/marketing-widget.js";
export type { MarketingWidget } from "./models/marketing-widget.js";

export {
  MANUFACTURING_STATUSES,
  manufacturingWidgetSchema,
  validateManufacturingWidget,
} from "./models/manufacturing-widget.js";
export type { ManufacturingStatus, ManufacturingWidget } from "./models/manufacturing-widget.js";

export {
  eyeWidgetSchema,
  validateEyeWidget,
} from "./models/eye-widget.js";
export type { EyeWidget } from "./models/eye-widget.js";

export {
  ALERT_SEVERITIES,
  ALERT_CATEGORIES,
  dashboardAlertSchema,
  alertsWidgetSchema,
  validateAlertsWidget,
  validateDashboardAlert,
} from "./models/alerts-widget.js";
export type { AlertSeverity, AlertCategory, DashboardAlert, AlertsWidget } from "./models/alerts-widget.js";

export {
  EXECUTIVE_DASHBOARD_SIGNAL_TYPES,
  executiveDashboardSignalSchema,
  validateExecutiveDashboardSignal,
} from "./models/executive-dashboard-signal.js";
export type {
  ExecutiveDashboardSignalType,
  ExecutiveDashboardSignal,
} from "./models/executive-dashboard-signal.js";

export {
  executiveDashboardReportSchema,
  validateExecutiveDashboardReport,
} from "./models/executive-dashboard-report.js";
export type {
  ExecutiveDashboardReportId,
  ExecutiveDashboardReport,
  ExecutiveDashboardReportCreateInput,
} from "./models/executive-dashboard-report.js";

export {
  executiveDashboardRecordSchema,
  validateExecutiveDashboardRecord,
} from "./models/executive-dashboard-record.js";
export type {
  ExecutiveDashboardRecordId,
  ExecutiveDashboardRecord,
  ExecutiveDashboardRecordCreateInput,
} from "./models/executive-dashboard-record.js";

export type {
  ExecutiveDashboardIntelligenceRepositoryQuery,
  ExecutiveDashboardIntelligenceRepository,
} from "./repositories/executive-dashboard-intelligence-repository.js";

export {
  InMemoryExecutiveDashboardIntelligenceRepository,
  createInMemoryExecutiveDashboardIntelligenceRepository,
} from "./repositories/in-memory-executive-dashboard-intelligence-repository.js";

export {
  EXECUTIVE_DASHBOARD_SIGNAL_WEIGHTS,
  generateExecutiveDashboard,
  executiveDashboardIntelligenceScoring,
} from "./scoring/executive-dashboard-intelligence-scoring.js";
export type {
  ExecutiveDashboardBrandInput,
  ExecutiveDashboardMetricsInput,
  ExecutiveDashboardInput,
  ExecutiveDashboardBreakdown,
} from "./scoring/executive-dashboard-intelligence-scoring.js";

export {
  ExecutiveDashboardIntelligenceEngine,
  defaultExecutiveDashboardIntelligenceEngine,
} from "./engines/executive-dashboard-intelligence-engine.js";

export {
  EXECUTIVE_DASHBOARD_INTELLIGENCE_MODULE_ID,
  EXECUTIVE_DASHBOARD_INTELLIGENCE_MODULE_VERSION,
  EXECUTIVE_DASHBOARD_INTELLIGENCE_CAPABILITIES,
  EXECUTIVE_DASHBOARD_INTELLIGENCE_MODULE_CONTRACT,
  ExecutiveDashboardIntelligenceModule,
  createExecutiveDashboardIntelligenceModule,
  executiveDashboardIntelligenceModule,
} from "./contract/executive-dashboard-intelligence-module.js";
export type {
  ExecutiveDashboardIntelligenceModuleId,
  ExecutiveDashboardIntelligenceCapability,
  ExecutiveDashboardIntelligenceModuleContract,
} from "./contract/executive-dashboard-intelligence-module.js";
