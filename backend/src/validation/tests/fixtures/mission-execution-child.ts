import { DatabaseSync } from "node:sqlite";
import { MissionExecutionStore } from "../../../orchestration/pillow-host/mission-execution/store.js";
import { inspectActualAuthority } from "../../../orchestration/pillow-host/mission-execution/runner.js";
const file = process.argv[2]!; const mode = process.argv[3];
if (mode === "claim-once") {
 try {
  const store = new MissionExecutionStore(file, { workspaceId: "ws_empire_1", ownerEmail: "owner@invalid.test" });
  process.stdout.write(store.claim("a".repeat(40)) ? "claimed\n" : "empty\n");
 } catch { process.stdout.write("busy\n"); }
} else {
 if (mode === "transaction") {
  const db = new DatabaseSync(file); db.exec("BEGIN IMMEDIATE"); db.prepare("UPDATE execution_jobs SET document='uncommitted-corrupt-state'").run();
  process.stdout.write("transaction-open\n");
 } else {
  const store = new MissionExecutionStore(file, { workspaceId: "ws_empire_1", ownerEmail: "owner@invalid.test" });
  const claim = store.claim("a".repeat(40)); if (!claim) throw new Error("Claim unavailable");
  if (mode === "read-before-commit") { inspectActualAuthority(); process.stdout.write("read-not-committed\n"); }
  else if (mode === "complete-before-exit") { store.complete(claim, inspectActualAuthority()); process.stdout.write("receipt-committed\n"); }
  else process.stdout.write("claimed\n");
 }
 setInterval(() => {}, 1000);
}
