import { MissionManager } from "../../../mission-runtime/mission-manager.js";
import { DEFAULT_MISSION_RUNTIME_CONFIGURATION } from "../../../mission-runtime/configuration.js";

const [phase, filename] = process.argv.slice(2);
if (!filename) throw new Error("Missing disposable test snapshot");
const manager = new MissionManager(filename);
manager.ensureSeeded(DEFAULT_MISSION_RUNTIME_CONFIGURATION);
if (phase === "create") {
  const report = manager.createMission({ missionName: "unapproved restart marker", validated: true,
    pillowConfirmed: false, grandKingApproved: false }, DEFAULT_MISSION_RUNTIME_CONFIGURATION);
  if (report.decision !== "pass") throw new Error("Test mission creation failed");
  process.send?.({ mission: report.mission, history: manager.getHistory(), audit: manager.getAuditTrail() });
  // Parent uses SIGKILL: no shutdown/save hook can help this acknowledged write.
  setInterval(() => {}, 1000);
} else if (phase === "read") {
  process.send?.({ history: manager.getHistory(), audit: manager.getAuditTrail(), record: manager.getEngineRecord() });
  process.disconnect?.();
} else throw new Error("Unknown test phase");
