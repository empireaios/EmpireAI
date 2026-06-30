import type { RegisteredTool } from "../../../brain/types.js";
import {
  getAdvertisingLifecycleSnapshot,
  getCapitalLifecycleSnapshot,
  getGrandKingsRevenueCycleById,
  getKpiLifecycleSnapshot,
  getLatestGrandKingsRevenueCycle,
  getOrderLifecycleSnapshot,
  getRevenueLifecycleSnapshot,
  listGrandKingsRevenueCycles,
  runGrandKingsRevenueCycle,
} from "../services/grand-kings-revenue-engine-service.js";

export const grandKingsRevenueTools: RegisteredTool[] = [
  {
    name: "grand_kings_revenue.run_cycle",
    description: "Run full Grand King's operational cycle across all lifecycles",
    module: "grand-kings-revenue-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        correlationId: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      runGrandKingsRevenueCycle({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        correlationId: args.correlationId ? String(args.correlationId) : undefined,
      }),
  },
  {
    name: "grand_kings_revenue.get_revenue_lifecycle",
    description: "Get revenue lifecycle snapshot for Grand King's Account",
    module: "grand-kings-revenue-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      getRevenueLifecycleSnapshot(String(args.workspaceId), String(args.companyId)),
  },
  {
    name: "grand_kings_revenue.get_advertising_lifecycle",
    description: "Get advertising lifecycle snapshot for Grand King's Account",
    module: "grand-kings-revenue-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      getAdvertisingLifecycleSnapshot(String(args.workspaceId), String(args.companyId)),
  },
  {
    name: "grand_kings_revenue.get_order_lifecycle",
    description: "Get order lifecycle snapshot for Grand King's Account",
    module: "grand-kings-revenue-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      getOrderLifecycleSnapshot(String(args.workspaceId), String(args.companyId)),
  },
  {
    name: "grand_kings_revenue.get_capital_lifecycle",
    description: "Get capital lifecycle snapshot for Grand King's Account",
    module: "grand-kings-revenue-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      getCapitalLifecycleSnapshot(String(args.workspaceId), String(args.companyId)),
  },
  {
    name: "grand_kings_revenue.get_kpi_snapshot",
    description: "Get KPI lifecycle snapshot for Grand King's Account",
    module: "grand-kings-revenue-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      getKpiLifecycleSnapshot(String(args.workspaceId), String(args.companyId)),
  },
  {
    name: "grand_kings_revenue.list_cycles",
    description: "List Grand King's revenue operational cycles",
    module: "grand-kings-revenue-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) =>
      listGrandKingsRevenueCycles(
        String(args.workspaceId),
        args.companyId ? String(args.companyId) : undefined,
      ),
  },
  {
    name: "grand_kings_revenue.get_cycle",
    description: "Get a Grand King's revenue cycle by ID or latest",
    module: "grand-kings-revenue-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        cycleId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => {
      if (args.cycleId) {
        return getGrandKingsRevenueCycleById(String(args.cycleId));
      }
      return getLatestGrandKingsRevenueCycle(
        String(args.workspaceId),
        args.companyId ? String(args.companyId) : undefined,
      );
    },
  },
];
