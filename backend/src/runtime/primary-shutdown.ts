import type { ChildProcess } from "node:child_process";

/** A deadline is a failed shutdown, never evidence that the child's writes saved. */
export function primaryShutdownTimeoutMs(raw = process.env.EMPIRE_SHUTDOWN_TIMEOUT_MS): number {
  const value = Number(raw ?? 30_000);
  return Number.isFinite(value) ? Math.max(1_000, Math.min(120_000, value)) : 30_000;
}

export function installPrimaryShutdown(options: {
  getChild: () => ChildProcess | null;
  stopBackground: () => Promise<void>;
  closeServer: () => Promise<void>;
  disconnect: () => void;
  report: (event: string, error?: unknown) => void;
  timeoutMs?: number;
}) {
  let stopping = false;
  let shutdownPromise: Promise<void> | null = null;
  const timers = new Set<NodeJS.Timeout>();
  const schedule = (callback: () => void, delay: number): void => {
    if (stopping) return;
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!stopping) callback();
    }, delay);
    timers.add(timer);
  };

  const shutdown = (): Promise<void> => {
    if (shutdownPromise) return shutdownPromise;
    // Change synchronously before child exit/error handlers can schedule a respawn.
    stopping = true;
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    shutdownPromise = (async () => {
      const child = options.getChild();
      const force = setTimeout(() => {
        options.report("primary_shutdown_deadline_exceeded");
        if (child && child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
        try { options.disconnect(); }
        finally { process.exit(1); }
      }, options.timeoutMs ?? primaryShutdownTimeoutMs());
      let exitCode = 0;
      try {
        // Stop acceptance immediately. Keep Redis connected while a cancelled
        // reasoning attempt settles its durable receipt and the child drains.
        const serverClosed = options.closeServer();
        // Attach immediately: a server close failure must not become unhandled.
        const closeOutcome = serverClosed.then(() => null, (error: unknown) => error);
        await options.stopBackground();
        if (child && child.exitCode === null && child.signalCode === null) {
          const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
            child.once("exit", (code, signal) => resolve({ code, signal }));
          });
          if (!child.kill("SIGTERM")) throw new Error("Could not signal Brain worker shutdown");
          const result = await exited;
          if (result.code !== 0 || result.signal !== null) {
            throw new Error(`Brain worker shutdown failed: code=${result.code}; signal=${result.signal}`);
          }
        } else if (child && (child.exitCode !== 0 || child.signalCode !== null)) {
          throw new Error("Brain worker had already exited without a successful shutdown");
        }
        const closeError = await closeOutcome;
        if (closeError) throw closeError;
        options.report("primary_shutdown_complete");
      } catch (error) {
        exitCode = 1;
        options.report("primary_shutdown_failed", error);
        // Never leave an orphan if preparation failed before graceful signalling.
        if (child && child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
      } finally {
        clearTimeout(force);
        process.off("SIGTERM", handleSignal);
        process.off("SIGINT", handleSignal);
        try { options.disconnect(); }
        catch (error) {
          exitCode = 1;
          options.report("primary_shutdown_disconnect_failed", error);
        }
      }
      process.exit(exitCode);
    })();
    return shutdownPromise;
  };
  const handleSignal = () => { void shutdown(); };
  process.on("SIGTERM", handleSignal);
  process.on("SIGINT", handleSignal);
  return { isStopping: () => stopping, schedule, shutdown };
}
