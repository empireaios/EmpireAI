import fs from "node:fs";
import path from "node:path";

import type { AssistantEvidence, AssistantScreenContext } from "../models/global-assistant.js";
import { resolveScreenContext } from "../screen-registry.js";

function resolveRepoRoot(): string {
  const candidates = [
    path.resolve(process.cwd()),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "../.."),
  ];
  for (const root of candidates) {
    if (fs.existsSync(path.join(root, "JOURNEY.md"))) return root;
  }
  return process.cwd();
}

function parseJourneyRows(content: string, markers: string[]): Array<{ id: string; description: string; status: string }> {
  const rows: Array<{ id: string; description: string; status: string }> = [];
  for (const line of content.split("\n")) {
    if (!line.startsWith("|")) continue;
    for (const marker of markers) {
      if (!line.includes(marker)) continue;
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        rows.push({
          id: marker,
          description: cells.slice(1, -1).join(" — "),
          status: cells[cells.length - 1] ?? "—",
        });
      }
    }
  }
  return rows;
}

function readRepositoryIndex(root: string, screen: AssistantScreenContext): string[] {
  const indexPath = path.join(root, "EMPIREAI_REPOSITORY_MASTER_INDEX.md");
  if (!fs.existsSync(indexPath)) return [];
  const content = fs.readFileSync(indexPath, "utf8");
  const snippets: string[] = [];
  const needles = [screen.screenTitle, screen.uxId ?? "", ...(screen.journeyMarkers ?? [])].filter(Boolean);
  for (const line of content.split("\n")) {
    if (needles.some((needle) => line.includes(needle))) {
      snippets.push(line.trim());
    }
  }
  return snippets.slice(0, 8);
}

export function buildAssistantContextBundle(
  workspaceId: string,
  companyId: string,
  screenPath: string,
  kpiLabel?: string,
) {
  const screen = resolveScreenContext(screenPath);
  const root = resolveRepoRoot();
  const journeyPath = path.join(root, "JOURNEY.md");
  let journeyRows: Array<{ id: string; description: string; status: string }> = [];
  if (fs.existsSync(journeyPath)) {
    const journeyContent = fs.readFileSync(journeyPath, "utf8");
    const markers = [
      ...(screen.journeyMarkers ?? []),
      "GC-05",
      screen.uxId ?? "",
    ].filter(Boolean);
    journeyRows = parseJourneyRows(journeyContent, markers);
  }

  const repositorySnippets = readRepositoryIndex(root, screen);

  return {
    missionId: "GC-05",
    moduleId: "global-assistant",
    workspaceId,
    companyId,
    screen,
    kpiLabel: kpiLabel ?? null,
    journey: {
      markers: screen.journeyMarkers ?? [],
      rows: journeyRows,
    },
    repository: {
      root,
      snippets: repositorySnippets,
    },
    computedAt: new Date().toISOString(),
  };
}

export function journeyEvidenceFromContext(
  journeyRows: Array<{ id: string; description: string; status: string }>,
): AssistantEvidence[] {
  const now = new Date().toISOString();
  return journeyRows.map((row) => ({
    evidenceId: `journey-${row.id}`,
    source: "journey" as const,
    title: `Journey ${row.id}`,
    summary: `${row.description} (${row.status})`,
    moduleId: row.id,
    recordedAt: now,
  }));
}

export function repositoryEvidenceFromContext(snippets: string[]): AssistantEvidence[] {
  const now = new Date().toISOString();
  return snippets.slice(0, 5).map((snippet, index) => ({
    evidenceId: `repo-${index}`,
    source: "repository" as const,
    title: "Repository index",
    summary: snippet.replace(/\|/g, " · "),
    recordedAt: now,
  }));
}
