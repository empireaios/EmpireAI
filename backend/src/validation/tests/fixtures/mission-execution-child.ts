import { DatabaseSync } from "node:sqlite";
import { setTimeout as wait } from "node:timers/promises";
import { MissionExecutionStore } from "../../../orchestration/pillow-host/mission-execution/store.js";
import { inspectActualAuthority } from "../../../orchestration/pillow-host/mission-execution/runner.js";
const file = process.argv[2]!; const mode = process.argv[3];
if (mode === "claim-once") {
 // busy_timeout=0 intentionally fails closed when SQLite is held by another
 // process. A real worker retries the next tick; model that bounded polling
 // instead of treating transient lock contention as a terminal claim result.
 const deadline = Date.now() + 2_000;
 let result = "busy";
 while (Date.now() < deadline) {
  try {
   const store = new MissionExecutionStore(file, { workspaceId: "ws_empire_1", ownerEmail: "owner@invalid.test" });
   result = store.claim("a".repeat(40)) ? "claimed" : "empty";
   break;
  } catch { await wait(20); }
 }
 process.stdout.write(`${result}\n`);
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
