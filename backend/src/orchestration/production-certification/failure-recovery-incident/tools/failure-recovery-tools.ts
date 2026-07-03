/**
 * G6-08 — Failure recovery certification Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import { buildCockpitFailureRecoveryView } from "../contracts/failure-recovery-cockpit-contracts.js";
import {
  getFailureRecoveryOverview,
  getLastFailureRecoveryScan,
  runFailureRecoveryScan,
} from "../services/failure-recovery-certification-service.js";
import { validateRecoveryPath, validateRollbackPath } from "../validation/failure-recovery-certification-validator.js";
import { resolveFailureRecoveryRules } from "../registry/failure-recovery-registry-resolver.js";

export const failureRecoveryTools: RegisteredTool[] = [
  {
    name: "failure_recovery_overview",
    description: "G6-08 — Failure, recovery & incident certification overview",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getFailureRecoveryOverview({ workspaceId });
      const scan = getLastFailureRecoveryScan();
      return { overview, cockpitView: buildCockpitFailureRecoveryView({ overview, scan }) };
    },
  },
  {
    name: "failure_recovery_scan",
    description: "G6-08 — Run full failure recovery certification scan",
    module: "production-certification",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) =>
      runFailureRecoveryScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "incident_status",
    description: "G6-08 — Incident certification status",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runFailureRecoveryScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return {
        status: scan.status,
        incidentScore: scan.incidentScore,
        incidents: scan.incidents,
        escalationStatus: scan.escalationStatus,
      };
    },
  },
  {
    name: "incident_risk_register",
    description: "G6-08 — Incident risk register",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runFailureRecoveryScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { riskRegister: scan.riskRegister, blockers: scan.blockers, warnings: scan.warnings };
    },
  },
  {
    name: "recovery_path_validation",
    description: "G6-08 — Recovery path validation",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const rules = resolveFailureRecoveryRules({ workspaceId });
      const result = validateRecoveryPath(rules, { workspaceId });
      return { recoveryPaths: result.recoveryPaths, blockers: result.blockers, warnings: result.warnings };
    },
  },
  {
    name: "rollback_path_validation",
    description: "G6-08 — Rollback path validation",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const rules = resolveFailureRecoveryRules({ workspaceId });
      const result = validateRollbackPath(rules, { workspaceId });
      return { rollbackPaths: result.rollbackPaths, blockers: result.blockers, warnings: result.warnings };
    },
  },
  {
    name: "failure_recovery_recommendations",
    description: "G6-08 — Failure recovery executive recommendations",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runFailureRecoveryScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { executiveRecommendations: scan.executiveRecommendations, riskRegister: scan.riskRegister };
    },
  },
  {
    name: "failure_recovery_status",
    description: "G6-08 — Latest failure recovery certification status",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getFailureRecoveryOverview({ workspaceId });
      const scan = getLastFailureRecoveryScan();
      return {
        overview,
        lastScan: scan
          ? { scanId: scan.scanId, status: scan.status, incidentScore: scan.incidentScore, scannedAt: scan.scannedAt }
          : undefined,
        cockpitView: buildCockpitFailureRecoveryView({ overview, scan }),
      };
    },
  },
];
