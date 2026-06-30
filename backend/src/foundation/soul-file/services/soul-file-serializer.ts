import {
  soulFileDocumentSchema,
  createEmptyRuntimeMemory,
  SOUL_RUNTIME_MEMORY_KEYS,
  type SoulFileDocument,
  type SoulFileExportResult,
  type SoulRuntimeMemoryKey,
  validateSoulFileDocument,
} from "../models/soul-file-document.js";
import { attachSoulFileChecksum } from "./soul-file-integrity.js";

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function runtimeMemorySection(document: SoulFileDocument): string {
  const labels: Record<SoulRuntimeMemoryKey, string> = {
    missionCompletions: "Mission Completions",
    doctrineUpdates: "Doctrine Updates",
    architectureUpdates: "Architecture Updates",
    businessMilestones: "Business Milestones",
    capitalChanges: "Capital Changes",
    lessonsLearned: "Lessons Learned",
    promises: "Promises",
    kpis: "KPIs",
    futureRoadmap: "Future Roadmap",
  };

  return SOUL_RUNTIME_MEMORY_KEYS.map((key) => {
    const entries = document.runtimeMemory[key];
    if (entries.length === 0) return "";
    const lines = entries
      .slice(-10)
      .map((entry) => `- **${entry.title}** — ${entry.summary} _(${entry.recordedAt})_`)
      .join("\n");
    return `### ${labels[key]}\n\n${lines}\n`;
  })
    .filter(Boolean)
    .join("\n");
}

function metadataLines(metadata: Record<string, string>): string {
  return Object.entries(metadata)
    .map(([key, value]) => `- **${key}:** ${value}`)
    .join("\n");
}

/** Exports Soul File as canonical JSON string. */
export function exportSoulFileJson(document: SoulFileDocument): SoulFileExportResult {
  const content = JSON.stringify(document, null, 2);
  return {
    format: "json",
    version: document.version,
    versionLabel: document.versionLabel,
    content,
    checksum: document.checksum,
    exportedAt: new Date().toISOString(),
  };
}

/** Exports Soul File as human-readable Markdown — living identity document. */
export function exportSoulFileMarkdown(document: SoulFileDocument): SoulFileExportResult {
  const content = `# Empire Soul File

> The Soul File is the permanent living continuity of the Empire — not a backup.

**Version:** ${document.versionLabel} (v${document.version})
**Soul File ID:** ${document.soulFileId}
**Workspace:** ${document.workspaceId}
**Checksum:** \`${document.checksum}\`
**Created:** ${document.createdAt}
**Updated:** ${document.updatedAt}

---

## Identity

**Empire Name:** ${document.identity.empireName}

**Mission:** ${document.identity.mission}

**Vision:** ${document.identity.vision}

**Principles:**
${bulletList(document.identity.principles)}

---

## Continuity

**Founding Date:** ${document.continuity.foundingDate}
**Last Evolution:** ${document.continuity.lastEvolutionAt}

**Narrative:**

${document.continuity.narrative}

---

## Operational State

**Grand King's Account Status:** ${document.operationalState.grandKingsAccountStatus}

**Active Missions:**
${bulletList(document.operationalState.activeMissions)}

**Completed Missions:**
${bulletList(document.operationalState.completedMissions)}

---

## Runtime Memory

${runtimeMemorySection(document) || "_No runtime captures yet._\n"}

---

## Metadata

${metadataLines(document.metadata)}
`;

  return {
    format: "markdown",
    version: document.version,
    versionLabel: document.versionLabel,
    content,
    checksum: document.checksum,
    exportedAt: new Date().toISOString(),
  };
}

function extractSection(markdown: string, heading: string): string {
  const pattern = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
  const match = markdown.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function extractField(section: string, label: string): string {
  const pattern = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)$`, "im");
  const match = section.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function extractBulletItems(section: string, label: string): string[] {
  const pattern = new RegExp(
    `\\*\\*${label}:\\*\\*\\s*\\n([\\s\\S]*?)(?=\\n\\*\\*|\\n---|$)`,
    "i",
  );
  const match = section.match(pattern);
  if (!match?.[1]) return [];
  return match[1]
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

function extractNarrative(section: string): string {
  const pattern = /\*\*Narrative:\*\*\s*\n([\s\S]*?)(?=\n---|$)/i;
  const match = section.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function parseMetadataSection(section: string): Record<string, string> {
  const metadata: Record<string, string> = {};
  for (const line of section.split("\n")) {
    const match = line.match(/^-\s*\*\*(.+?):\*\*\s*(.+)$/);
    if (match?.[1] && match[2]) {
      metadata[match[1]] = match[2];
    }
  }
  return metadata;
}

/** Parses Markdown Soul File export back into a document payload (without checksum). */
export function parseSoulFileMarkdown(content: string): Omit<SoulFileDocument, "checksum"> {
  const identitySection = extractSection(content, "Identity");
  const continuitySection = extractSection(content, "Continuity");
  const operationalSection = extractSection(content, "Operational State");
  const metadataSection = extractSection(content, "Metadata");

  const versionMatch = content.match(/\*\*Version:\*\*\s*([^\s(]+)\s*\(v(\d+)\)/i);
  const soulFileId = extractField(content, "Soul File ID") || "soul-unknown";
  const workspaceId = extractField(content, "Workspace") || "ws-unknown";
  const createdAt = extractField(content, "Created") || new Date().toISOString();
  const updatedAt = extractField(content, "Updated") || new Date().toISOString();

  const document = {
    soulFileId,
    workspaceId,
    version: versionMatch ? Number(versionMatch[2]) : 1,
    versionLabel: versionMatch?.[1] ?? "1.0.0",
    identity: {
      empireName: extractField(identitySection, "Empire Name"),
      mission: extractField(identitySection, "Mission"),
      vision: extractField(identitySection, "Vision"),
      principles: extractBulletItems(identitySection, "Principles"),
    },
    continuity: {
      foundingDate: extractField(continuitySection, "Founding Date") || new Date().toISOString(),
      lastEvolutionAt: extractField(continuitySection, "Last Evolution") || new Date().toISOString(),
      narrative: extractNarrative(continuitySection),
    },
    operationalState: {
      grandKingsAccountStatus:
        extractField(operationalSection, "Grand King's Account Status") || "UNKNOWN",
      activeMissions: extractBulletItems(operationalSection, "Active Missions"),
      completedMissions: extractBulletItems(operationalSection, "Completed Missions"),
    },
    runtimeMemory: createEmptyRuntimeMemory(),
    metadata: parseMetadataSection(metadataSection),
    createdAt,
    updatedAt,
  };

  return soulFileDocumentSchema.omit({ checksum: true }).parse(document);
}

/** Parses JSON Soul File export and validates schema. */
export function parseSoulFileJson(content: string): SoulFileDocument {
  const parsed = JSON.parse(content) as unknown;
  return validateSoulFileDocument(parsed);
}

/** Recomputes checksum after import and returns validated document. */
export function finalizeImportedSoulFile(
  payload: Omit<SoulFileDocument, "checksum">,
): SoulFileDocument {
  return attachSoulFileChecksum(payload);
}
