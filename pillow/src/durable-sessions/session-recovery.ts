import type {
  DurableSessionSnapshot,
  SessionRecoveryResult,
} from "./types.js";
import { SESSION_LAYER_REGISTRY } from "./session-registry.js";

/** Validate session integrity from live snapshot (P5-03). */
export function validateSessionIntegrity(snapshot: DurableSessionSnapshot): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (snapshot.authStoreMode === "in_memory" && snapshot.nodeEnv === "production") {
    issues.push("Auth sessions in-memory in production — lost on Brain restart");
  }
  if (!snapshot.redisConnected && snapshot.authStoreMode === "redis") {
    issues.push("Auth configured for Redis but Redis disconnected");
  }
  if (snapshot.pillowHostRunning && snapshot.pillowHostSessionCount === 0) {
    // Not an issue — zero sessions is valid
  }
  if (snapshot.browserSessionPersisted && !snapshot.pillowHostRunning) {
    issues.push("Browser session persisted but Pillow host not running — recovery on boot");
  }
  if (!snapshot.coiRuntimeReady && snapshot.pillowHostRunning) {
    issues.push("Pillow host running but COI runtime not ready");
  }

  return { valid: issues.length === 0, issues };
}

/** Execute recovery assessment per session layer (P5-03). */
export function executeSessionRecovery(input: {
  snapshot: DurableSessionSnapshot;
}): SessionRecoveryResult[] {
  const { snapshot } = input;
  const results: SessionRecoveryResult[] = [];

  for (const layer of SESSION_LAYER_REGISTRY) {
    let interrupted = false;
    let recovered = false;
    let resumed = false;
    let message = layer.recoveryStrategy;

    switch (layer.id) {
      case "DS-AUTH":
        interrupted = snapshot.authStoreMode === "in_memory";
        recovered = snapshot.authStoreMode === "redis" && snapshot.redisConnected;
        resumed = recovered;
        message = recovered
          ? "Auth sessions durable in Redis — survive Brain restart"
          : "Auth degraded — re-login required after Brain restart";
        break;
      case "DS-PILLOW-HOST":
        interrupted = !snapshot.pillowHostRunning;
        recovered = snapshot.pillowHostRunning;
        resumed = snapshot.browserSessionPersisted && snapshot.pillowHostRunning;
        message = resumed
          ? "Browser turns persisted · host re-bound on reconnect"
          : "Host chat ephemeral — client localStorage survives refresh";
        break;
      case "DS-PILLOW-COI":
        interrupted = !snapshot.coiRuntimeReady;
        recovered = snapshot.coiRuntimeReady;
        resumed = snapshot.coiRuntimeReady && snapshot.pillowHostRunning;
        message = recovered
          ? "COI runtime ready — full engine chain active"
          : "COI recovering — startPillow() chain in progress";
        break;
      case "DS-BROWSER":
        interrupted = false;
        recovered = snapshot.browserSessionPersisted;
        resumed = snapshot.browserSessionPersisted;
        message = "Browser refresh recovery via localStorage";
        break;
      case "DS-SUPERVISOR":
        interrupted = snapshot.supervisorMissionCount > 0 && !snapshot.coiRuntimeReady;
        recovered = !interrupted;
        resumed = snapshot.coiRuntimeReady;
        message = interrupted
          ? "Supervisor missions interrupted — re-launch from artifact"
          : "Supervisor ready for mission launch";
        break;
      case "DS-JOURNEY":
        recovered = snapshot.journeyEventsAvailable;
        resumed = snapshot.journeyEventsAvailable;
        message = snapshot.journeyEventsAvailable
          ? "Journey events available · synchronizer persists to JOURNEY.md"
          : "Journey awaiting Pillow init";
        break;
      default:
        recovered = layer.durabilityTier === "durable" || layer.durabilityTier === "recoverable";
        resumed = recovered;
        break;
    }

    results.push({
      layerId: layer.id,
      interrupted,
      integrityValid: !interrupted || layer.durabilityTier !== "ephemeral",
      recovered,
      resumed,
      message,
    });
  }

  return results;
}

/** Default snapshot for assessment when live bridge unavailable. */
export function buildDefaultSessionSnapshot(): DurableSessionSnapshot {
  const env = process.env;
  return {
    capturedAt: new Date().toISOString(),
    authStoreMode: env.REDIS_URL ? "redis" : "in_memory",
    authSessionCount: 0,
    pillowHostSessionCount: 0,
    pillowHostRunning: false,
    redisConnected: Boolean(env.REDIS_URL),
    browserSessionPersisted: true,
    supervisorMissionCount: 0,
    journeyEventsAvailable: false,
    coiRuntimeReady: false,
    nodeEnv: env.NODE_ENV ?? "development",
  };
}
