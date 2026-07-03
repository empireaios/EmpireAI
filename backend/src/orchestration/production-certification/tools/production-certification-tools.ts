/**
 * G6-00 — Production certification Brain tools.
 */

import type { RegisteredTool } from "../../../brain/types.js";
import {
  getCertificationBlockers,
  getCertificationEvidence,
  getCertificationOverview,
  getCertificationRiskRegister,
  getCertificationStatus,
  listCertificationDomains,
  listCertificationGates,
  listCertificationRegistryIds,
  runCertificationCheck,
  runCertificationDomain,
  runFullCertification,
} from "../services/certification-runner-service.js";
import { resolveCertificationRegistrySnapshot } from "../registry/certification-registry-resolver.js";
import { buildCockpitCertificationCentreView } from "../contract/cockpit-certification-module.js";

export const productionCertificationTools: RegisteredTool[] = [
  {
    name: "certification_overview",
    description: "G6-00 — Production certification framework overview",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => {
      const overview = getCertificationOverview({ workspaceId: String(args.workspaceId ?? "ws-foundation") });
      return { overview, cockpitView: buildCockpitCertificationCentreView({ overview, blockers: [], risks: [] }) };
    },
  },
  {
    name: "run_certification_check",
    description: "G6-00 — Run a single registry-defined certification check",
    module: "production-certification",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        checkId: { type: "string" },
      },
      required: ["workspaceId", "actorId", "checkId"],
    },
    handler: async (args) =>
      runCertificationCheck({
        context: { workspaceId: String(args.workspaceId) },
        checkId: String(args.checkId),
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "run_certification_domain",
    description: "G6-00 — Run all checks for a certification domain",
    module: "production-certification",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        domainId: { type: "string" },
      },
      required: ["workspaceId", "actorId", "domainId"],
    },
    handler: async (args) =>
      runCertificationDomain({
        context: { workspaceId: String(args.workspaceId) },
        domainId: String(args.domainId),
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "run_full_certification",
    description: "G6-00 — Run full EmpireAI production certification across all domains",
    module: "production-certification",
    authorityLevel: "L3",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
      },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) =>
      runFullCertification({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "certification_status",
    description: "G6-00 — Get certification run status",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        runId: { type: "string" },
      },
    },
    handler: async (args) => getCertificationStatus(args.runId ? String(args.runId) : undefined),
  },
  {
    name: "certification_blockers",
    description: "G6-00 — List certification blockers",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { runId: { type: "string" } },
    },
    handler: async (args) => ({
      blockers: getCertificationBlockers(args.runId ? String(args.runId) : undefined),
    }),
  },
  {
    name: "certification_risk_register",
    description: "G6-00 — List certification risks",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { runId: { type: "string" } },
    },
    handler: async (args) => ({
      risks: getCertificationRiskRegister(args.runId ? String(args.runId) : undefined),
    }),
  },
  {
    name: "certification_evidence",
    description: "G6-00 — List redacted certification evidence",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { runId: { type: "string" } },
    },
    handler: async (args) => ({
      evidence: getCertificationEvidence(args.runId ? String(args.runId) : undefined),
    }),
  },
  {
    name: "production_certification.list_domains",
    description: "G6-00 — List certification domains from registry",
    module: "production-certification",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => ({
      domains: listCertificationDomains({ workspaceId: String(args.workspaceId ?? "ws-foundation") }),
    }),
  },
  {
    name: "production_certification.list_checks",
    description: "G6-00 — List certification checks from registry",
    module: "production-certification",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => {
      const snapshot = resolveCertificationRegistrySnapshot({
        workspaceId: String(args.workspaceId ?? "ws-foundation"),
      });
      return { checks: snapshot.checks.map((row) => ({ id: row.id, name: row.name })) };
    },
  },
  {
    name: "production_certification.list_gates",
    description: "G6-00 — List certification gates from registry",
    module: "production-certification",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => ({
      gates: listCertificationGates({ workspaceId: String(args.workspaceId ?? "ws-foundation") }),
      registryIds: listCertificationRegistryIds(),
    }),
  },
];
