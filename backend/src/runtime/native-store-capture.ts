import path from "node:path";
import {createRequire} from "node:module";
import {getActiveMembershipCapture,finalizeActiveMembershipCapture} from "./work8-primary-capture.js";
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";

const holderPath = fileURLToPath(new URL("./native-store-capture-lock.cjs", import.meta.url));

/** A separate process owns native SQLite locks while this process copies the
 * files. Closing a source descriptor here must never release the lock holder's
 * POSIX locks. Only the two named native stores are covered by this boundary.
 */
export async function withExclusiveNativeMissionCapture<T>(primaryPath: string,
  captureAndVerify: () => T | Promise<T>): Promise<T> {
  return withNativeCaptureLocks([primaryPath], captureAndVerify);
}

/** Nine named Work8 SQLite domains only. Callers must drain application writers
 * first; this does not fence Redis, SQL.js RAM, JSON or another process admission.
 * WAL files must be captured with a SQLite-aware reader, never a main-file copy. */
export async function withExclusiveWork8DomainCapture<T>(root: string,
  captureAndVerify: () => T | Promise<T>): Promise<T> {
  return withNativeCaptureLocks([root, "work8-domains"], captureAndVerify);
}

async function withNativeCaptureLocks<T>(args: string[], captureAndVerify: () => T | Promise<T>): Promise<T> {
  if(process.env.WORK8_REAL_GRAPH==='1') {
    const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;
    const scope=args.length===1&&root&&args[0]===path.join(root,'commissioning/empireai-brain.db')?'missions':args.length===2&&args[0]===root&&args[1]==='work8-domains'?'domains':null;
    if(!scope)throw Error('FIXED_NATIVE_LOCK_SCOPE_REQUIRED');
    const context=getActiveMembershipCapture();
    const {command}=createRequire(import.meta.url)('../../../deployment/runtime-native-lock-client.cjs');
    const receipt=await command('acquire',scope,context);
    if(scope==='domains')finalizeActiveMembershipCapture(receipt);
    try { return await captureAndVerify(); }
    finally { await command('release',scope,context); }
  }
  const child = fork(holderPath, args, { execArgv: [], stdio: ["ignore", "ignore", "ignore", "ipc"] });
  let alive = true;
  let finished = false;
  const exited = new Promise<number | null>(resolve => child.once("exit", code => { alive = false; resolve(code); }));
  const ready = new Promise<void>((resolve, reject) => {
    child.once("message", message => {
      if (typeof message === "object" && message !== null && "kind" in message && message.kind === "ready") resolve();
      else reject(new Error("Native capture lock refused: " +
        (typeof message === "object" && message !== null && "reason" in message ? String(message.reason) : "unknown")));
    });
    child.once("error", reject);
    child.once("exit", () => reject(new Error("Native capture lock holder exited before ready")));
  });
  const timeout = setTimeout(() => child.kill(), 5_000);
  try {
    await ready;
    clearTimeout(timeout);
    const result = await captureAndVerify();
    // Detect a holder that died during a synchronous copy before claiming success.
    await new Promise<void>(resolve => setImmediate(resolve));
    if (!alive) throw new Error("Native capture lock holder lost during readback");
    child.send({ kind: "release" });
    if (await exited !== 0) throw new Error("Native capture lock release failed");
    finished = true;
    return result;
  } finally {
    clearTimeout(timeout);
    if (!finished) {
      child.kill();
      await exited;
    }
  }
}
