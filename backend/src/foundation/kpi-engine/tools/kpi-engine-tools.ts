import type { RegisteredTool } from "../../../brain/types.js";
import type { KpiMetricKey } from "../models/kpi-metric.js";
import {
  getKpiByKey,
  getKpiDashboard,
  getKpiMetric,
  initializeKpiEngine,
  listKpiLifecycle,
  listKpiMetrics,
  listKpiObservations,
  recordKpiBatch,
  recordKpiObservation,
  syncKpisFromLedger,
  updateKpiTarget,
} from "../services/kpi-engine-service.js";

export const kpiEngineTools: RegisteredTool[] = [
  {
    name: "kpi_engine.list",
    description: "List all Empire KPI metrics for workspace",
    module: "kpi-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => ({
      metrics: listKpiMetrics(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
    }),
  },
  {
    name: "kpi_engine.get",
    description: "Get KPI metric by ID",
    module: "kpi-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { kpiId: { type: "string" } },
      required: ["kpiId"],
    },
    handler: async (args) => getKpiMetric(String(args.kpiId)),
  },
  {
    name: "kpi_engine.get_by_key",
    description: "Get KPI metric by key (visitors, orders, revenue, profit, etc.)",
    module: "kpi-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        metricKey: { type: "string" },
      },
      required: ["metricKey"],
    },
    handler: async (args) =>
      getKpiByKey(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.metricKey as KpiMetricKey,
      ),
  },
  {
    name: "kpi_engine.get_dashboard",
    description: "Get Empire KPI dashboard with deltas and progress to target",
    module: "kpi-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) =>
      getKpiDashboard(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
  },
  {
    name: "kpi_engine.record_observation",
    description: "Record a KPI observation — updates current value and history",
    module: "kpi-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        kpiId: { type: "string" },
        metricKey: { type: "string" },
        value: { type: "number" },
        source: { type: "string" },
        actor: { type: "string" },
        correlationId: { type: "string" },
        metadata: { type: "object" },
      },
      required: ["value"],
    },
    handler: async (args) =>
      recordKpiObservation({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        kpiId: args.kpiId ? String(args.kpiId) : undefined,
        metricKey: args.metricKey as KpiMetricKey | undefined,
        value: Number(args.value),
        source: args.source ? String(args.source) : undefined,
        actor: args.actor ? String(args.actor) : undefined,
        correlationId: args.correlationId ? String(args.correlationId) : undefined,
        metadata: args.metadata as Record<string, string> | undefined,
      }),
  },
  {
    name: "kpi_engine.record_batch",
    description: "Record multiple KPI observations in one call",
    module: "kpi-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        observations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              metricKey: { type: "string" },
              value: { type: "number" },
              source: { type: "string" },
            },
          },
        },
        actor: { type: "string" },
      },
      required: ["observations"],
    },
    handler: async (args) => ({
      metrics: recordKpiBatch(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.observations as Array<{ metricKey: KpiMetricKey; value: number; source?: string }>,
        args.actor ? String(args.actor) : undefined,
      ),
    }),
  },
  {
    name: "kpi_engine.update_target",
    description: "Set target value for a KPI metric",
    module: "kpi-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        kpiId: { type: "string" },
        targetValue: { type: "number" },
        actor: { type: "string" },
      },
      required: ["kpiId", "targetValue"],
    },
    handler: async (args) =>
      updateKpiTarget(
        String(args.kpiId),
        Number(args.targetValue),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "kpi_engine.sync_from_ledger",
    description: "Sync revenue, profit, EA profit, EC capital, and orders from financial ledger",
    module: "kpi-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actor: { type: "string" },
      },
    },
    handler: async (args) => ({
      metrics: syncKpisFromLedger(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.actor ? String(args.actor) : undefined,
      ),
    }),
  },
  {
    name: "kpi_engine.list_observations",
    description: "List KPI observation history for a metric",
    module: "kpi-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        kpiId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["kpiId"],
    },
    handler: async (args) => ({
      observations: listKpiObservations(
        String(args.kpiId),
        args.limit ? Number(args.limit) : undefined,
      ),
    }),
  },
  {
    name: "kpi_engine.list_lifecycle",
    description: "List KPI lifecycle events",
    module: "kpi-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        kpiId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["kpiId"],
    },
    handler: async (args) => ({
      lifecycle: listKpiLifecycle(
        String(args.kpiId),
        args.limit ? Number(args.limit) : undefined,
      ),
    }),
  },
  {
    name: "kpi_engine.initialize",
    description: "Initialize default Empire KPI metrics",
    module: "kpi-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => ({
      metrics: initializeKpiEngine(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
    }),
  },
];
