import { z } from "zod";

import {
  CANONICAL_ENTITY_IDS,
  initializeIdentityRegistry,
  resolveIdentityDisplayName,
} from "../../identity-registry/index.js";

export const soulFileIdentitySchema = z.object({
  empireName: z.string().min(1),
  mission: z.string().min(1),
  vision: z.string().min(1),
  principles: z.array(z.string()).min(1),
});

export const soulFileContinuitySchema = z.object({
  foundingDate: z.string().datetime({ offset: true }),
  lastEvolutionAt: z.string().datetime({ offset: true }),
  narrative: z.string().min(1),
});

export const soulFileOperationalStateSchema = z.object({
  activeMissions: z.array(z.string()),
  completedMissions: z.array(z.string()),
  grandKingsAccountStatus: z.string().min(1),
});

export const soulRuntimeEntrySchema = z.object({
  entryId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  correlationId: z.string().optional(),
  source: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
  recordedAt: z.string().datetime({ offset: true }),
});

export const SOUL_RUNTIME_MEMORY_KEYS = [
  "missionCompletions",
  "doctrineUpdates",
  "architectureUpdates",
  "businessMilestones",
  "capitalChanges",
  "lessonsLearned",
  "promises",
  "kpis",
  "futureRoadmap",
] as const;

export type SoulRuntimeMemoryKey = (typeof SOUL_RUNTIME_MEMORY_KEYS)[number];

export const soulFileRuntimeMemorySchema = z.object({
  missionCompletions: z.array(soulRuntimeEntrySchema).default([]),
  doctrineUpdates: z.array(soulRuntimeEntrySchema).default([]),
  architectureUpdates: z.array(soulRuntimeEntrySchema).default([]),
  businessMilestones: z.array(soulRuntimeEntrySchema).default([]),
  capitalChanges: z.array(soulRuntimeEntrySchema).default([]),
  lessonsLearned: z.array(soulRuntimeEntrySchema).default([]),
  promises: z.array(soulRuntimeEntrySchema).default([]),
  kpis: z.array(soulRuntimeEntrySchema).default([]),
  futureRoadmap: z.array(soulRuntimeEntrySchema).default([]),
});

/** Permanent living identity document for the Empire — not a backup. */
export const soulFileDocumentSchema = z.object({
  soulFileId: z.string().min(1),
  workspaceId: z.string().min(1),
  version: z.number().int().min(1),
  versionLabel: z.string().min(1),
  identity: soulFileIdentitySchema,
  continuity: soulFileContinuitySchema,
  operationalState: soulFileOperationalStateSchema,
  runtimeMemory: soulFileRuntimeMemorySchema,
  metadata: z.record(z.string()),
  checksum: z.string().length(64),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type SoulFileIdentity = z.infer<typeof soulFileIdentitySchema>;
export type SoulFileContinuity = z.infer<typeof soulFileContinuitySchema>;
export type SoulFileOperationalState = z.infer<typeof soulFileOperationalStateSchema>;
export type SoulRuntimeEntry = z.infer<typeof soulRuntimeEntrySchema>;
export type SoulFileRuntimeMemory = z.infer<typeof soulFileRuntimeMemorySchema>;
export type SoulFileDocument = z.infer<typeof soulFileDocumentSchema>;

export const SOUL_FILE_CHANGE_TYPES = [
  "INITIALIZE",
  "EVOLVE",
  "IMPORT_JSON",
  "IMPORT_MARKDOWN",
  "RUNTIME_CAPTURE",
] as const;

export type SoulFileChangeType = (typeof SOUL_FILE_CHANGE_TYPES)[number];

export type SoulFileChangeRecord = {
  changeId: string;
  workspaceId: string;
  fromVersion: number | null;
  toVersion: number;
  changeType: SoulFileChangeType;
  summary: string;
  actor: string;
  createdAt: string;
};

export type SoulFileDiffEntry = {
  path: string;
  before: string | null;
  after: string | null;
};

export type SoulFileDiffResult = {
  fromVersion: number;
  toVersion: number;
  entries: SoulFileDiffEntry[];
  summary: string;
};

export type SoulFileIntegrityResult = {
  valid: boolean;
  expectedChecksum: string;
  actualChecksum: string;
  message: string;
};

export type SoulFileExportResult = {
  format: "json" | "markdown";
  version: number;
  versionLabel: string;
  content: string;
  checksum: string;
  exportedAt: string;
};

export function validateSoulFileDocument(value: unknown): SoulFileDocument {
  return soulFileDocumentSchema.parse(value);
}

export function createEmptyRuntimeMemory(): SoulFileRuntimeMemory {
  return {
    missionCompletions: [],
    doctrineUpdates: [],
    architectureUpdates: [],
    businessMilestones: [],
    capitalChanges: [],
    lessonsLearned: [],
    promises: [],
    kpis: [],
    futureRoadmap: [],
  };
}

/** Ensures legacy Soul File snapshots include runtime memory fields. */
export function normalizeSoulFileDocument(document: SoulFileDocument): SoulFileDocument {
  return {
    ...document,
    runtimeMemory: {
      ...createEmptyRuntimeMemory(),
      ...document.runtimeMemory,
    },
  };
}

export function createDefaultSoulFileDocument(workspaceId: string): Omit<
  SoulFileDocument,
  "checksum" | "createdAt" | "updatedAt"
> {
  const timestamp = new Date().toISOString();
  initializeIdentityRegistry(workspaceId);

  const empireDisplayName = resolveIdentityDisplayName(
    CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT,
    workspaceId,
    "Grand King's Account",
  );
  const platformDisplayName = resolveIdentityDisplayName(
    CANONICAL_ENTITY_IDS.EMPIRE_AI,
    workspaceId,
    "EmpireAI",
  );

  return {
    soulFileId: `soul-${workspaceId}`,
    workspaceId,
    version: 1,
    versionLabel: "1.0.0",
    identity: {
      empireName: empireDisplayName,
      mission: "Build autonomous revenue-generating ecommerce empires with founder-gated live operations.",
      vision: `A sovereign AI-operated commerce empire (${platformDisplayName}) that evolves continuously while protecting the founder's kingdom.`,
      principles: [
        "Protect The Empire — no destructive live actions without founder approval",
        "Continuous evolution — the Soul File is living identity, not a backup",
        "Revenue truth — ledger-backed financial continuity",
        "Operational orchestration — every mission serves Grand King's Account",
      ],
    },
    continuity: {
      foundingDate: timestamp,
      lastEvolutionAt: timestamp,
      narrative:
        "EmpireAI was forged to manufacture, deploy, market, sell, fulfill, and profit — with the Soul File as permanent memory of who we are.",
    },
    operationalState: {
      activeMissions: ["S002"],
      completedMissions: ["M101", "M102", "M103", "M104", "M105", "M106", "M107", "M108", "M109", "M110", "S001"],
      grandKingsAccountStatus: "SOUL_FILE_FOUNDATION_ACTIVE — runtime engine initializing",
    },
    runtimeMemory: createEmptyRuntimeMemory(),
    metadata: {
      schema: "empireai.soul-file/v2",
      empireId: CANONICAL_ENTITY_IDS.EMPIRE_AI,
      accountId: CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT,
      capitalId: CANONICAL_ENTITY_IDS.EMPIRE_CAPITAL,
      founderId: CANONICAL_ENTITY_IDS.FOUNDER_ACCOUNTS,
      vennyaId: CANONICAL_ENTITY_IDS.VENNYA,
      owner: CANONICAL_ENTITY_IDS.FOUNDER_ACCOUNTS,
    },
  };
}
