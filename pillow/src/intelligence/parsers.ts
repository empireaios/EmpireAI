import type { ClassifiedEntity } from "./types.js";
import { classifyById } from "./classifier.js";

const JOURNEY_ROW =
  /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^||]+?)\s*\|/;

const ENTITY_ID =
  /\b(REAL-\d{3}|UX-\d{3}|GC-\d{2}|PILLOW-\d{3}|BL-[A-C]|ADR-\d{3}|CTD-\d{3}|SUCCESS-001|COS-\d{3})\b/g;

function phaseToClassification(phase: string): ClassifiedEntity["classification"] {
  const p = phase.toLowerCase();
  if (p.includes("ux screen") || p.includes("ux)")) return "ux";
  if (p.includes("pillow program")) return "pillow";
  if (p.includes("real") || p.includes("reality")) return "reality_owner";
  if (p.includes("governance") || p.includes("milestone")) return "governance";
  if (p.includes("constitution") || p.includes("ctd")) return "constitution";
  if (p.includes("philosophy")) return "constitution";
  if (p.includes("commercial")) return "commercial_spine";
  if (p.includes("doctrine")) return "doctrine";
  if (p.includes("vision")) return "operational_document";
  return "unknown";
}

function normalizeStatus(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function parseJourneyEntities(journeyText: string): ClassifiedEntity[] {
  const entities: ClassifiedEntity[] = [];
  const seen = new Set<string>();

  for (const line of journeyText.split("\n")) {
    const match = line.match(JOURNEY_ROW);
    if (!match) continue;

    const phase = match[1]?.trim() ?? "";
    const label = match[2]?.trim() ?? "";
    const description = match[3]?.trim() ?? "";
    const status = normalizeStatus(match[4] ?? "");

    if (phase === "Phase" || phase.startsWith("---")) continue;

    const idMatch = label.match(
      /^(REAL-\d{3}|UX-\d{3}|GC-\d{2}|PILLOW-\d{3}|BL-[A-C]|CTD-\d{3}|SUCCESS-001|COS-\d{3}|[A-Z]{2,4}-\d{3}[A-Z]?)$/,
    );
    const id = idMatch?.[1] ?? label.replace(/\s+/g, "-").slice(0, 64);
    const entityKey = `${phase}::${id}`;

    if (seen.has(entityKey)) continue;
    seen.add(entityKey);

    const classification =
      classifyById(id) !== "unknown"
        ? classifyById(id)
        : phaseToClassification(phase);

    entities.push({
      id,
      classification,
      label,
      phase,
      status,
      description,
      path: classification === "journey" ? undefined : "JOURNEY.md",
      metadata: { journeyRow: "true" },
    });
  }

  return entities;
}

export function extractReferencedIds(text: string): string[] {
  const ids = new Set<string>();
  for (const match of text.matchAll(ENTITY_ID)) {
    if (match[1]) ids.add(match[1]);
  }
  return [...ids].sort();
}

export interface UxContractRow {
  id: string;
  dependsOn: string[];
  usesComponents: string[];
  owners: string[];
}

export function parseUxContractDependencies(
  contractText: string,
): UxContractRow[] {
  const rows: UxContractRow[] = [];
  let inTable = false;

  for (const line of contractText.split("\n")) {
    if (line.includes("| UX-001 |") || line.includes("| GC-01 |")) {
      inTable = true;
    }
    if (!inTable) continue;
    if (!line.startsWith("| UX-") && !line.startsWith("| GC-")) continue;
    if (line.includes("---")) continue;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length < 2) continue;

    const id = cells[0] ?? "";
    if (!/^(UX-\d{3}|GC-\d{2})$/.test(id)) continue;

    const mustExistRaw = cells[1] ?? "";
    const dependsRaw = cells[2] ?? "";
    const componentsRaw = cells[3] ?? "";
    const ownersRaw = cells[4] ?? "";

    rows.push({
      id,
      dependsOn: [
        ...extractReferencedIds(mustExistRaw),
        ...extractReferencedIds(dependsRaw),
      ],
      usesComponents: extractReferencedIds(componentsRaw),
      owners: extractReferencedIds(ownersRaw).concat(
        ownersRaw
          .split(/[,+]/g)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.includes(" ")),
      ),
    });
  }

  return rows;
}

export interface AdrRecord {
  id: string;
  title: string;
  owners: string[];
  references: string[];
}

export function parseDecisionRecords(decisionsText: string): AdrRecord[] {
  const records: AdrRecord[] = [];
  const sections = decisionsText.split(/^## ADR-/m);

  for (const section of sections.slice(1)) {
    const idMatch = section.match(/^(\d{3})/);
    if (!idMatch?.[1]) continue;
    const id = `ADR-${idMatch[1]}`;
    const titleLine = section.split("\n")[0]?.replace(/^\d{3}:\s*/, "") ?? "";
    const body = section;
    const ownerMatch = body.match(/\*\*Owner[s]?:\*\*\s*([^\n]+)/i);
    const owners = ownerMatch?.[1]
      ? ownerMatch[1]
          .split(/[·,]/g)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    records.push({
      id,
      title: titleLine.trim(),
      owners,
      references: extractReferencedIds(body),
    });
  }

  return records;
}

export function parseExecutiveComponentExports(
  indexSource: string,
): string[] {
  const exports: string[] = [];
  for (const match of indexSource.matchAll(
    /export\s+\{([^}]+)\}/g,
  )) {
    const names = match[1]
      ?.split(",")
      .map((s) => s.trim().split(/\s+/)[0])
      .filter(Boolean) as string[] | undefined;
    if (names) exports.push(...names);
  }
  for (const match of indexSource.matchAll(
    /export\s+(?:type\s+)?\{?\s*(\w+)/g,
  )) {
    if (match[1] && !exports.includes(match[1])) {
      exports.push(match[1]);
    }
  }
  return [...new Set(exports)].sort();
}
