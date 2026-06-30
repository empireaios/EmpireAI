export {
  LiveRepositoryWatcherEngine,
  createLiveRepositoryWatcherEngine,
  WATCHER_CONTRACT_PATH,
} from "./engine.js";
export { OBSERVATION_PATHS, OBSERVATION_DIRECTORIES } from "./observation-scope.js";
export {
  captureSnapshot,
  diffSnapshots,
  snapshotChanged,
} from "./snapshot.js";
export { classifyPath, inferChangeKind, toDetectedChanges } from "./classifier.js";
export {
  generateEvents,
  dedupeEvents,
  batchRelatedEvents,
} from "./event-generator.js";
export { detectRepositoryDrift } from "./drift-detector.js";
export {
  SubscriberRegistry,
  createNoOpSubscriber,
  DEFAULT_SUBSCRIBER_IDS,
} from "./subscribers.js";
export type {
  ChangeKind,
  ChangeClassification,
  WatcherEventType,
  DetectedRepositoryChange,
  RepositoryDriftSignal,
  WatcherEvent,
  WatcherEventBatch,
  WatcherSubscriberId,
  WatcherSubscriber,
  SubscriberNotification,
  ObservationResult,
  WatcherEngineState,
  WatcherEngineOptions,
  FileSnapshotEntry,
  RepositorySnapshot,
} from "./types.js";
