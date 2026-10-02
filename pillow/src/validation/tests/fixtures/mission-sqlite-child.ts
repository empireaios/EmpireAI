import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { MissionManager } from "../../../mission-runtime/mission-manager.js";
import { DEFAULT_MISSION_RUNTIME_CONFIGURATION as config } from "../../../mission-runtime/configuration.js";

const [phase, filename] = process.argv.slice(2);
if (!filename) throw new Error("Missing disposable SQLite snapshot");
const manager = new MissionManager(filename);
if (phase === "hold-uncommitted") {
  const execute = DatabaseSync.prototype.exec;
  DatabaseSync.prototype.exec = function (sql: string) {
    if (sql === "COMMIT") {
      // Actual adapter UPDATE has occurred, but COMMIT has not. This large payload
      // exceeds SQLite's default page cache and leaves a real rollback journal.
      process.send?.({ phase: "uncommitted", journalBytes: fs.statSync(`${filename}-journal`).size });
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
      throw new Error("Test child should have been killed");
    }
    return execute.call(this, sql);
  };
  manager.createMission({ missionName: "not-acknowledged-" + "x".repeat(3 * 1024 * 1024) }, config);
  throw new Error("Uncommitted child unexpectedly returned");
} else if (phase === "recover-and-write") {
  const recovered = manager.getHistory();
  const result = manager.createMission({ missionName: "accepted after killed writer" }, config);
  process.send?.({ recovered, accepted: result.mission, history: manager.getHistory() });
  process.disconnect?.();
} else if (phase === "stale") {
  process.send?.({ phase: "loaded" });
  process.once("message", () => {
    try {
      manager.createMission({ missionName: "stale must not replace history" }, config);
      process.send?.({ unexpectedSuccess: true });
    } catch (error) { process.send?.({ error: (error as Error).message, history: manager.getHistory() }); }
    process.disconnect?.();
  });
} else throw new Error("Unknown test phase");
