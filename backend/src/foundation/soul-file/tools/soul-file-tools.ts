import type { RegisteredTool } from "../../../brain/types.js";
import {
  diffSoulFile,
  evolveSoulFile,
  exportSoulFile,
  getSoulFile,
  getSoulFileByVersion,
  importSoulFile,
  initializeSoulFile,
  listSoulFileChangeHistory,
  listSoulFileVersions,
  verifySoulFileIntegrity,
} from "../services/soul-file-service.js";

export const soulFileTools: RegisteredTool[] = [
  {
    name: "soul_file.get",
    description: "Get the latest Soul File — permanent living identity of the Empire",
    module: "soul-file",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
      required: ["workspaceId"],
    },
    handler: async (args) => getSoulFile(String(args.workspaceId)),
  },
  {
    name: "soul_file.initialize",
    description: "Initialize Soul File for workspace if not yet established",
    module: "soul-file",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actor: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) =>
      initializeSoulFile(String(args.workspaceId), args.actor ? String(args.actor) : undefined),
  },
  {
    name: "soul_file.evolve",
    description: "Evolve the Soul File — continuous identity update, not a backup restore",
    module: "soul-file",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actor: { type: "string" },
        summary: { type: "string" },
        identity: { type: "object" },
        continuity: { type: "object" },
        operationalState: { type: "object" },
        metadata: { type: "object" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) =>
      evolveSoulFile({
        workspaceId: String(args.workspaceId),
        actor: args.actor ? String(args.actor) : undefined,
        summary: args.summary ? String(args.summary) : undefined,
        identity: args.identity as Parameters<typeof evolveSoulFile>[0]["identity"],
        continuity: args.continuity as Parameters<typeof evolveSoulFile>[0]["continuity"],
        operationalState: args.operationalState as Parameters<typeof evolveSoulFile>[0]["operationalState"],
        metadata: args.metadata as Record<string, string> | undefined,
      }),
  },
  {
    name: "soul_file.export",
    description: "Export Soul File as JSON or Markdown for Grand King's dashboard download",
    module: "soul-file",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        format: { type: "string", enum: ["json", "markdown"] },
      },
      required: ["workspaceId"],
    },
    handler: async (args) =>
      exportSoulFile(
        String(args.workspaceId),
        args.format === "markdown" ? "markdown" : "json",
      ),
  },
  {
    name: "soul_file.import",
    description: "Import Soul File from JSON or Markdown with integrity validation",
    module: "soul-file",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        format: { type: "string", enum: ["json", "markdown"] },
        content: { type: "string" },
        actor: { type: "string" },
      },
      required: ["workspaceId", "format", "content"],
    },
    handler: async (args) =>
      importSoulFile({
        workspaceId: String(args.workspaceId),
        format: args.format === "markdown" ? "markdown" : "json",
        content: String(args.content),
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "soul_file.verify_integrity",
    description: "Validate Soul File SHA-256 checksum integrity",
    module: "soul-file",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
      required: ["workspaceId"],
    },
    handler: async (args) => verifySoulFileIntegrity(String(args.workspaceId)),
  },
  {
    name: "soul_file.diff",
    description: "Diff two Soul File versions",
    module: "soul-file",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        fromVersion: { type: "number" },
        toVersion: { type: "number" },
      },
      required: ["workspaceId", "fromVersion", "toVersion"],
    },
    handler: async (args) =>
      diffSoulFile(
        String(args.workspaceId),
        Number(args.fromVersion),
        Number(args.toVersion),
      ),
  },
  {
    name: "soul_file.list_versions",
    description: "List all Soul File version snapshots",
    module: "soul-file",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
      required: ["workspaceId"],
    },
    handler: async (args) => listSoulFileVersions(String(args.workspaceId)),
  },
  {
    name: "soul_file.get_version",
    description: "Get Soul File snapshot by version number",
    module: "soul-file",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        version: { type: "number" },
      },
      required: ["workspaceId", "version"],
    },
    handler: async (args) =>
      getSoulFileByVersion(String(args.workspaceId), Number(args.version)),
  },
  {
    name: "soul_file.list_history",
    description: "List Soul File change history",
    module: "soul-file",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) =>
      listSoulFileChangeHistory(
        String(args.workspaceId),
        args.limit ? Number(args.limit) : undefined,
      ),
  },
];
