import { fileURLToPath } from "node:url";

const membershipPreload = fileURLToPath(
  new URL("../../../deployment/runtime-membership-bootstrap.mjs", import.meta.url),
);

/** Process admission belongs to the admitted parent, not its heartbeat thread.
 * Remove only the exact pair emitted by MembershipController.launch.
 * The approved exact V8 flag is represented through Worker.resourceLimits.
 * Never alter the parent arguments, bootstrap, or unrelated execution options. */
export function watchdogWorkerArguments(args: readonly string[]): string[] {
  const result: string[] = [];
  let removed = false;
  let memoryRemoved = false;
  for (let index = 0; index < args.length; index++) {
    const argument = args[index]!;
    if (argument === "--max-old-space-size=1536") {
      if (memoryRemoved) throw new Error("DUPLICATE_WATCHDOG_MEMORY_ARGUMENT");
      memoryRemoved = true;
      continue;
    }
    if (argument === `--import=${membershipPreload}`) {
      throw new Error("AMBIGUOUS_MEMBERSHIP_PRELOAD_ARGUMENT");
    }
    if (argument === "--import" && args[index + 1] === membershipPreload) {
      if (removed) throw new Error("DUPLICATE_MEMBERSHIP_PRELOAD_ARGUMENT");
      removed = true;
      index++;
      continue;
    }
    result.push(argument);
  }
  return result;
}
