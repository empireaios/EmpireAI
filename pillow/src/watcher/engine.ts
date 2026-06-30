import { randomUUID } from "node:crypto";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import { inspectRepositoryState } from "../recovery/inspector.js";
import {
  mergeGitInspection,
  toDetectedChanges,
} from "./classifier.js";
import { detectRepositoryDrift } from "./drift-detector.js";
import {
  batchRelatedEvents,
  dedupeEvents,
  generateEvents,
} from "./event-generator.js";
import { OBSERVATION_PATHS } from "./observation-scope.js";
import {
  captureSnapshot,
  diffSnapshots,
  snapshotChanged,
} from "./snapshot.js";
import type { RepositorySnapshot } from "./types.js";
import {
  createNoOpSubscriber,
  DEFAULT_SUBSCRIBER_IDS,
  SubscriberRegistry,
} from "./subscribers.js";
import type {
  ObservationResult,
  WatcherEngineOptions,
  WatcherEngineState,
  WatcherEventBatch,
  WatcherSubscriber,
  WatcherSubscriberId,
} from "./types.js";

export const WATCHER_CONTRACT_PATH = "PILLOW_ARCHITECTURE_CONTRACT.md";

/**
 * Live Repository Watcher (PILLOW-014).
 * Continuous repository sensing — read-only observation, events, and subscriber notification.
 */
export class LiveRepositoryWatcherEngine {
  private initializedAt: string | null = null;
  private lastSnapshot: RepositorySnapshot | null = null;
  private history: WatcherEventBatch[] = [];
  private totalEvents = 0;
  private subscribers = new SubscriberRegistry();
  private seenEventFingerprints = new Set<string>();
  private reader: RepositoryReader;
  private paused = false;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private intelligence: RepositoryIntelligenceContext,
    private memory: RepositoryMemoryEngine,
    private options: WatcherEngineOptions = {},
  ) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<WatcherEngineState> {
    const text = await this.reader.readText(WATCHER_CONTRACT_PATH);
    if (!text?.includes("Pillow Architecture Contract")) {
      throw new Error(
        `${WATCHER_CONTRACT_PATH} missing — Live Repository Watcher requires Pillow Architecture Contract.`,
      );
    }

    for (const id of DEFAULT_SUBSCRIBER_IDS) {
      this.subscribers.register(createNoOpSubscriber(id));
    }

    this.lastSnapshot = await captureSnapshot(this.reader);
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WatcherEngineState {
    if (!this.initializedAt) {
      throw new Error(
        "Live Repository Watcher not initialized. Call initialize() first.",
      );
    }
    return {
      engineVersion: "PILLOW-014",
      status: this.paused ? "paused" : "ready",
      initializedAt: this.initializedAt,
      contractPath: WATCHER_CONTRACT_PATH,
      totalObservations: this.history.length,
      totalEvents: this.totalEvents,
      subscriberCount: this.subscribers.getSubscribers().length,
      lastObservation: this.history.at(-1) ?? null,
    };
  }

  registerSubscriber(subscriber: WatcherSubscriber): void {
    this.subscribers.register(subscriber);
  }

  unregisterSubscriber(id: WatcherSubscriberId): void {
    this.subscribers.unregister(id);
  }

  getSubscribers(): WatcherSubscriber[] {
    return this.subscribers.getSubscribers();
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  /** Perform one observation cycle — detect changes, emit events, notify subscribers. */
  async observe(options: { forceNotify?: boolean } = {}): Promise<ObservationResult> {
    if (this.paused) {
      throw new Error("Live Repository Watcher is paused");
    }

    const started = performance.now();
    const startedAt = new Date().toISOString();

    this.memory.ensureFresh();
    const mem = this.memory.getMemory();
    const inspection = await inspectRepositoryState(this.bootstrap.repositoryRoot);
    const currentSnapshot = await captureSnapshot(this.reader);
    const snapshotChanges = diffSnapshots(this.lastSnapshot, currentSnapshot);
    const merged = mergeGitInspection(inspection, snapshotChanges);
    const changes = toDetectedChanges(merged);
    const driftSignals = detectRepositoryDrift(mem, this.intelligence, inspection);

    let events = generateEvents(changes, driftSignals);

    if (this.options.batchRelatedEvents !== false) {
      events = batchRelatedEvents(events);
    }

    let duplicateSuppressed = 0;
    if (this.options.suppressDuplicates !== false) {
      const deduped = dedupeEvents(events, this.seenEventFingerprints);
      events = deduped.events;
      duplicateSuppressed = deduped.suppressed;
    }

    const hasChanges =
      changes.length > 0 ||
      snapshotChanged(this.lastSnapshot, currentSnapshot);

    const driftFp =
      driftSignals.length > 0
        ? `drift:${driftSignals.map((d) => d.id).sort().join(",")}`
        : null;
    const driftIsNew = driftFp !== null && !this.seenEventFingerprints.has(driftFp);
    if (driftIsNew && driftFp) {
      this.seenEventFingerprints.add(driftFp);
    }

    const batch: WatcherEventBatch = {
      batchId: randomUUID(),
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - started),
      events:
        hasChanges || options.forceNotify
          ? events
          : driftIsNew
            ? events
            : [],
      driftSignals,
      duplicateSuppressed,
    };

    this.lastSnapshot = currentSnapshot;
    this.history.push(batch);
    this.totalEvents += batch.events.length;

    const shouldNotify = batch.events.length > 0 || driftIsNew;
    const notifications = shouldNotify
      ? await this.subscribers.notifyAll(batch)
      : [];

    return {
      batch,
      notifications,
      scannedPaths: currentSnapshot.entries.length,
      recommendation:
        batch.events.length > 0
          ? `${batch.events.length} event(s) emitted — ${notifications.length} subscriber(s) notified`
          : driftSignals.length > 0
            ? `Drift detected — ${driftSignals.length} signal(s); subscribers notified`
            : "Repository unchanged — no notifications sent",
    };
  }

  /** Lightweight tick — skips when snapshot fingerprint and git state are stable. */
  async tick(): Promise<ObservationResult | null> {
    const currentSnapshot = await captureSnapshot(this.reader);
    const inspection = await inspectRepositoryState(this.bootstrap.repositoryRoot);
    const gitActive =
      inspection.modifiedFiles.length > 0 || inspection.createdFiles.length > 0;
    if (!snapshotChanged(this.lastSnapshot, currentSnapshot) && !gitActive) {
      return null;
    }
    return this.observe();
  }

  getHistory(): WatcherEventBatch[] {
    return [...this.history];
  }

  getLastBatch(): WatcherEventBatch | null {
    return this.history.at(-1) ?? null;
  }

  getObservationScopeSize(): number {
    return OBSERVATION_PATHS.length;
  }
}

export function createLiveRepositoryWatcherEngine(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
  memory: RepositoryMemoryEngine,
  options?: WatcherEngineOptions,
): LiveRepositoryWatcherEngine {
  return new LiveRepositoryWatcherEngine(
    bootstrap,
    intelligence,
    memory,
    options,
  );
}
