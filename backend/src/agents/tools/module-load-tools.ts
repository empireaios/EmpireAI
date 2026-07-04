import type { RegisteredTool } from "../../brain/types.js";
import {
  loadAdminView,
  loadAdsView,
  loadAiCeoView,
  loadDashboardView,
  loadFinanceView,
  loadIntegrationsView,
  loadIntelligenceView,
  loadMarketingView,
  loadOrdersView,
  loadSettingsView,
  loadStoreView,
  loadSuppliersView,
  loadSupportView,
} from "../../domain/services/module-views.js";
import {
  loadLaunchView,
  loadOperationalCommandView,
} from "../../domain/services/operational-command-view.js";
import {
  loadExecutiveAuditView,
  loadIntelligenceEnginePanel,
  loadMarketIntelligenceEnginePanel,
  loadSupplierIntelligenceEnginePanel,
  loadFinancialIntelligenceEnginePanel,
  loadQuantitativeIntelligenceEnginePanel,
  loadAdvertisingIntelligenceEnginePanel,
  loadCustomerIntelligenceEnginePanel,
  loadRiskIntelligenceEnginePanel,
  loadDecisionIntelligenceEnginePanel,
  loadExecutiveIntelligenceOrchestratorPanel,
  loadMissionCentreView,
  loadPillowSupervisorView,
  type EngineCenterPanelId,
} from "../../domain/services/cockpit-panel-views.js";
import { loadExecutiveHomeForDispatch } from "../../domain/services/executive-home-loader.js";
import { loadEngineCenterView } from "../../domain/services/engine-center-views.js";
import {
  handleCockpitInteraction,
  loadCockpitInteractionContext,
  type CockpitInteractionRequest,
} from "../../domain/services/cockpit-interaction-layer.js";
import { loadExecutiveRelationshipGraphView } from "../../domain/services/executive-relationship-graph.js";
import { loadProductIntelligenceEngineViewForWorkspace } from "../../domain/services/product-intelligence-engine-views.js";
import { loadMarketIntelligenceEngineViewForWorkspace } from "../../domain/services/market-intelligence-engine-views.js";
import { loadSupplierIntelligenceEngineViewForWorkspace } from "../../domain/services/supplier-intelligence-engine-views.js";
import { loadFinancialIntelligenceEngineViewForWorkspace } from "../../domain/services/financial-intelligence-engine-views.js";
import { loadQuantitativeIntelligenceEngineViewForWorkspace } from "../../domain/services/quantitative-intelligence-engine-views.js";
import { loadAdvertisingIntelligenceEngineViewForWorkspace } from "../../domain/services/advertising-intelligence-engine-views.js";
import { loadCustomerIntelligenceEngineViewForWorkspace } from "../../domain/services/customer-intelligence-engine-views.js";
import { loadRiskIntelligenceEngineViewForWorkspace } from "../../domain/services/risk-intelligence-engine-views.js";
import { loadDecisionIntelligenceEngineViewForWorkspace } from "../../domain/services/decision-intelligence-engine-views.js";
import { loadExecutiveIntelligenceOrchestratorViewForWorkspace } from "../../domain/services/executive-intelligence-orchestrator-views.js";
import {
  handleGlobalAssistantRequest,
  loadGlobalAssistantContext,
  type GlobalAssistantRequest,
} from "../../domain/services/cockpit-global-assistant.js";

export const moduleLoadTools: RegisteredTool[] = [
  {
    name: "dashboard.load_view",
    description: "Load founder dashboard view data from domain store",
    module: "dashboard",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
      required: ["workspaceId"],
    },
    handler: async (_args, context) => loadDashboardView(context.workspaceId),
  },
  {
    name: "ai-ceo.load_view",
    description: "Load AI CEO briefing view data",
    module: "ai-ceo",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
      required: ["workspaceId"],
    },
    handler: async (_args, context) => loadAiCeoView(context.workspaceId),
  },
  {
    name: "intelligence.load_view",
    description: "Load product intelligence view data",
    module: "intelligence",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadIntelligenceView(context.workspaceId),
  },
  {
    name: "suppliers.load_view",
    description: "Load supplier network view data",
    module: "suppliers",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadSuppliersView(context.workspaceId),
  },
  {
    name: "store.load_view",
    description: "Load store builder view data",
    module: "store",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadStoreView(context.workspaceId),
  },
  {
    name: "marketing.load_view",
    description: "Load marketing AI view data",
    module: "marketing",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadMarketingView(context.workspaceId),
  },
  {
    name: "ads.load_view",
    description: "Load ad manager view data",
    module: "ads",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadAdsView(context.workspaceId),
  },
  {
    name: "finance.load_view",
    description: "Load finance view data",
    module: "finance",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadFinanceView(context.workspaceId),
  },
  {
    name: "orders.load_view",
    description: "Load orders view data",
    module: "orders",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadOrdersView(context.workspaceId),
  },
  {
    name: "support.load_view",
    description: "Load support view data",
    module: "support",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadSupportView(context.workspaceId),
  },
  {
    name: "settings.load_view",
    description: "Load settings view data",
    module: "settings",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadSettingsView(context.workspaceId),
  },
  {
    name: "admin.load_view",
    description: "Load admin console view data",
    module: "admin",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async () => loadAdminView(),
  },
  {
    name: "integrations.load_view",
    description: "Load integrations grid with live connector truth",
    module: "integrations",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadIntegrationsView(context.workspaceId),
  },
  {
    name: "cockpit_command.load_view",
    description: "Load Cockpit executive command strip — B5–B8, CRIR, PROOF-001, approvals",
    module: "cockpit-command",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      loadOperationalCommandView(
        context.workspaceId,
        args.companyId ? String(args.companyId) : context.companyId,
      ),
  },
  {
    name: "launch.load_view",
    description: "Load Commerce Launch Centre view from Grand King dashboard",
    module: "launch",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      loadLaunchView(
        context.workspaceId,
        args.companyId ? String(args.companyId) : context.companyId,
      ),
  },
  {
    name: "executive_home.load_view",
    description: "Load Executive Home — King's daily operating screen (G4-03 summary cards)",
    module: "executive-home",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      loadExecutiveHomeForDispatch(
        context.workspaceId,
        args.companyId ? String(args.companyId) : context.companyId,
      ),
  },
  {
    name: "cockpit_missions.load_view",
    description: "Load Mission Centre — blockers, approvals, OMS objectives",
    module: "cockpit-missions",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      loadMissionCentreView(
        context.workspaceId,
        args.companyId ? String(args.companyId) : context.companyId,
      ),
  },
  {
    name: "cockpit_audit.load_view",
    description: "Load Executive Audit Center — B5–B8, B6, ESIS",
    module: "cockpit-audit",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      loadExecutiveAuditView(
        context.workspaceId,
        args.companyId ? String(args.companyId) : context.companyId,
      ),
  },
  {
    name: "cockpit_pillow.load_view",
    description: "Load Pillow Supervisor runtime state (no AI logic)",
    module: "cockpit-pillow",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadPillowSupervisorView(context.workspaceId),
  },
  {
    name: "cockpit_engine.load_view",
    description: "Load Engine Center view — G4-04 eight-section operational department",
    module: "cockpit-engine",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        engineId: { type: "string" },
      },
      required: ["engineId"],
    },
    handler: async (args, context) =>
      loadEngineCenterView(
        String(args.engineId) as EngineCenterPanelId,
        context.workspaceId,
      ),
  },
  {
    name: "cockpit_intelligence.load_view",
    description: "Load Product Intelligence Center panel view",
    module: "cockpit-intelligence",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadIntelligenceEnginePanel(context.workspaceId),
  },
  {
    name: "product_intelligence_engine.load_view",
    description: "G3-01 — Load Product Intelligence Engine architecture and analysed product contracts",
    module: "product-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) =>
      loadProductIntelligenceEngineViewForWorkspace(context.workspaceId),
  },
  {
    name: "market_intelligence_engine.load_view",
    description: "G3-02 — Load Market Intelligence Engine architecture and analysed market contracts",
    module: "market-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) =>
      loadMarketIntelligenceEngineViewForWorkspace(context.workspaceId),
  },
  {
    name: "market_intelligence_engine.load_panel",
    description: "G3-02 — Load Market Intelligence Engine cockpit panel",
    module: "market-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadMarketIntelligenceEnginePanel(context.workspaceId),
  },
  {
    name: "supplier_intelligence_engine.load_view",
    description: "G3-03 — Load Supplier Intelligence Engine architecture and analysed supplier contracts",
    module: "supplier-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) =>
      loadSupplierIntelligenceEngineViewForWorkspace(context.workspaceId),
  },
  {
    name: "supplier_intelligence_engine.load_panel",
    description: "G3-03 — Load Supplier Intelligence Engine cockpit panel",
    module: "supplier-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadSupplierIntelligenceEnginePanel(context.workspaceId),
  },
  {
    name: "financial_intelligence_engine.load_view",
    description: "G3-04 — Load Financial Intelligence Engine architecture and analysed financial contracts",
    module: "financial-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) =>
      loadFinancialIntelligenceEngineViewForWorkspace(context.workspaceId),
  },
  {
    name: "financial_intelligence_engine.load_panel",
    description: "G3-04 — Load Financial Intelligence Engine cockpit panel",
    module: "financial-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadFinancialIntelligenceEnginePanel(context.workspaceId),
  },
  {
    name: "quantitative_intelligence_engine.load_view",
    description: "G3-05 — Load Quantitative Intelligence Engine model results (mathematics only)",
    module: "quantitative-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) =>
      loadQuantitativeIntelligenceEngineViewForWorkspace(context.workspaceId),
  },
  {
    name: "quantitative_intelligence_engine.load_panel",
    description: "G3-05 — Load Quantitative Intelligence Engine cockpit panel",
    module: "quantitative-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadQuantitativeIntelligenceEnginePanel(context.workspaceId),
  },
  {
    name: "advertising_intelligence_engine.load_view",
    description: "G3-06 — Load Advertising Intelligence Engine architecture and analysed campaign contracts",
    module: "advertising-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) =>
      loadAdvertisingIntelligenceEngineViewForWorkspace(context.workspaceId),
  },
  {
    name: "advertising_intelligence_engine.load_panel",
    description: "G3-06 — Load Advertising Intelligence Engine cockpit panel",
    module: "advertising-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadAdvertisingIntelligenceEnginePanel(context.workspaceId),
  },
  {
    name: "customer_intelligence_engine.load_view",
    description: "G3-07 — Load Customer Intelligence Engine architecture and analysed customer contracts",
    module: "customer-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) =>
      loadCustomerIntelligenceEngineViewForWorkspace(context.workspaceId),
  },
  {
    name: "customer_intelligence_engine.load_panel",
    description: "G3-07 — Load Customer Intelligence Engine cockpit panel",
    module: "customer-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadCustomerIntelligenceEnginePanel(context.workspaceId),
  },
  {
    name: "risk_intelligence_engine.load_view",
    description: "G3-08 — Load Risk Intelligence Engine architecture and assessed risk contracts",
    module: "risk-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) =>
      loadRiskIntelligenceEngineViewForWorkspace(context.workspaceId),
  },
  {
    name: "risk_intelligence_engine.load_panel",
    description: "G3-08 — Load Risk Intelligence Engine cockpit panel",
    module: "risk-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadRiskIntelligenceEnginePanel(context.workspaceId),
  },
  {
    name: "decision_intelligence_engine.load_view",
    description: "G3-09 — Load Decision Intelligence Engine orchestrated decision view",
    module: "decision-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) =>
      loadDecisionIntelligenceEngineViewForWorkspace(context.workspaceId),
  },
  {
    name: "decision_intelligence_engine.load_panel",
    description: "G3-09 — Load Decision Intelligence Engine cockpit panel",
    module: "decision-intelligence-engine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadDecisionIntelligenceEnginePanel(context.workspaceId),
  },
  {
    name: "executive_intelligence_orchestrator.load_view",
    description: "G3-10 — Load Executive Intelligence Orchestrator unified service view",
    module: "executive-intelligence-orchestrator",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) =>
      loadExecutiveIntelligenceOrchestratorViewForWorkspace(context.workspaceId),
  },
  {
    name: "executive_intelligence_orchestrator.load_panel",
    description: "G3-10 — Load Executive Intelligence Orchestrator cockpit panel",
    module: "executive-intelligence-orchestrator",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async (_args, context) => loadExecutiveIntelligenceOrchestratorPanel(context.workspaceId),
  },
  {
    name: "cockpit_interaction.load_context",
    description: "G4-07 — Load AI interaction context for current Cockpit screen",
    module: "cockpit-interaction",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        screenPath: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["screenPath"],
    },
    handler: async (args, context) =>
      loadCockpitInteractionContext(
        context.workspaceId,
        String(args.screenPath),
        args.companyId ? String(args.companyId) : context.companyId,
      ),
  },
  {
    name: "cockpit_interaction.explain",
    description: "G4-07 — Structured explain response from Brain aggregates (no LLM)",
    module: "cockpit-interaction",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        intent: { type: "string" },
        screenPath: { type: "string" },
        targetType: { type: "string" },
        targetId: { type: "string" },
        label: { type: "string" },
        value: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["intent", "screenPath"],
    },
    handler: async (args, context) =>
      handleCockpitInteraction(context.workspaceId, {
        intent: String(args.intent) as CockpitInteractionRequest["intent"],
        screenPath: String(args.screenPath),
        targetType: args.targetType as CockpitInteractionRequest["targetType"],
        targetId: args.targetId ? String(args.targetId) : undefined,
        label: args.label ? String(args.label) : undefined,
        value: args.value ? String(args.value) : undefined,
      }, args.companyId ? String(args.companyId) : context.companyId),
  },
  {
    name: "cockpit_interaction.recommend",
    description: "G4-07 — Recommend next executive action from OMS aggregate",
    module: "cockpit-interaction",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        screenPath: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["screenPath"],
    },
    handler: async (args, context) =>
      handleCockpitInteraction(
        context.workspaceId,
        {
          intent: "recommend_next_action",
          screenPath: String(args.screenPath),
          targetType: "page",
        },
        args.companyId ? String(args.companyId) : context.companyId,
      ),
  },
  {
    name: "executive_relationship_graph.load_view",
    description: "G4-08 — Load Executive Relationship Graph — V1 engine nodes and live relationships",
    module: "executive-relationship-graph",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      loadExecutiveRelationshipGraphView(
        context.workspaceId,
        args.companyId ? String(args.companyId) : context.companyId,
      ),
  },
  {
    name: "cockpit_global_assistant.load_context",
    description: "G4-09 — Load Global AI Assistant context (auto page/engine/mission/alert awareness)",
    module: "cockpit-global-assistant",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        screenPath: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["screenPath"],
    },
    handler: async (args, context) =>
      loadGlobalAssistantContext(
        context.workspaceId,
        String(args.screenPath),
        args.companyId ? String(args.companyId) : context.companyId,
      ),
  },
  {
    name: "cockpit_global_assistant.ask",
    description: "G4-09 — Global AI Assistant action (delegates to G4-07 interaction layer)",
    module: "cockpit-global-assistant",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string" },
        screenPath: { type: "string" },
        query: { type: "string" },
        targetType: { type: "string" },
        targetId: { type: "string" },
        label: { type: "string" },
        value: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["action", "screenPath"],
    },
    handler: async (args, context) =>
      handleGlobalAssistantRequest(
        context.workspaceId,
        {
          action: String(args.action) as GlobalAssistantRequest["action"],
          screenPath: String(args.screenPath),
          query: args.query ? String(args.query) : undefined,
          targetType: args.targetType as GlobalAssistantRequest["targetType"],
          targetId: args.targetId ? String(args.targetId) : undefined,
          label: args.label ? String(args.label) : undefined,
          value: args.value ? String(args.value) : undefined,
        },
        args.companyId ? String(args.companyId) : context.companyId,
      ),
  },
];
