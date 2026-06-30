import { randomUUID } from "node:crypto";
import type {
  DetectedRepositoryChange,
  RepositoryDriftSignal,
  WatcherEvent,
  WatcherEventType,
} from "./types.js";

const PATH_TO_EVENT: Array<{
  match: (path: string, kind: string) => boolean;
  type: WatcherEventType;
}> = [
  {
    match: (p) => p === "JOURNEY.md" || p === "JOURNEY_AUDIT.md",
    type: "JourneyUpdated",
  },
  {
    match: (p) => p.startsWith("docs/executive-audits"),
    type: "ExecutiveAuditAdded",
  },
  {
    match: (_, k) => k === "mission_completion",
    type: "MissionCompleted",
  },
  {
    match: (_, k) => k === "doctrine_addition",
    type: "DoctrineUpdated",
  },
  {
    match: (_, k) => k === "architecture_modification",
    type: "ArchitectureChanged",
  },
  {
    match: (_, k) => k === "synchronization",
    type: "SynchronizationCompleted",
  },
];

export function generateEvents(
  changes: DetectedRepositoryChange[],
  driftSignals: RepositoryDriftSignal[],
): WatcherEvent[] {
  const events: WatcherEvent[] = [];
  const now = new Date().toISOString();
  const grouped = new Map<WatcherEventType, DetectedRepositoryChange[]>();

  for (const change of changes) {
    const type =
      PATH_TO_EVENT.find((r) => r.match(change.path, change.kind))?.type ??
      "RepositoryUpdated";
    const list = grouped.get(type) ?? [];
    list.push(change);
    grouped.set(type, list);
  }

  for (const [type, group] of grouped) {
    events.push({
      eventId: randomUUID(),
      type,
      classification: group[0]!.classification,
      paths: group.map((c) => c.path),
      summary: `${type}: ${group.length} change(s)`,
      changes: group,
      emittedAt: now,
    });
  }

  if (driftSignals.length > 0) {
    events.push({
      eventId: randomUUID(),
      type: "RepositoryHealthChanged",
      classification: "repository",
      paths: [],
      summary: `Repository drift: ${driftSignals.length} signal(s)`,
      changes: [],
      emittedAt: now,
    });
    events.push({
      eventId: randomUUID(),
      type: "DriftDetected",
      classification: "repository",
      paths: [],
      summary: driftSignals.map((d) => d.label).join("; "),
      changes: [],
      emittedAt: now,
    });
  }

  return events;
}

export function dedupeEvents(
  events: WatcherEvent[],
  seenFingerprints: Set<string>,
): { events: WatcherEvent[]; suppressed: number } {
  const unique: WatcherEvent[] = [];
  let suppressed = 0;

  for (const event of events) {
    const fp = `${event.type}:${event.paths.sort().join(",")}:${event.summary}`;
    if (seenFingerprints.has(fp)) {
      suppressed++;
      continue;
    }
    seenFingerprints.add(fp);
    unique.push(event);
  }

  return { events: unique, suppressed };
}

export function batchRelatedEvents(events: WatcherEvent[]): WatcherEvent[] {
  if (events.length <= 1) return events;

  const repoUpdates = events.filter((e) => e.type === "RepositoryUpdated");
  const others = events.filter((e) => e.type !== "RepositoryUpdated");

  if (repoUpdates.length <= 1) return events;

  const merged: WatcherEvent = {
    eventId: randomUUID(),
    type: "RepositoryUpdated",
    classification: "repository",
    paths: repoUpdates.flatMap((e) => e.paths),
    summary: `RepositoryUpdated: ${repoUpdates.length} batched change group(s)`,
    changes: repoUpdates.flatMap((e) => e.changes),
    emittedAt: new Date().toISOString(),
  };

  return [merged, ...others];
}
