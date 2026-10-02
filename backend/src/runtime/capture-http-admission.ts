import type { FastifyInstance, FastifyRequest } from "fastify";

/** One-process HTTP admission and drain boundary for an isolated capture.
 * Workers, other processes and non-HTTP writers require separate fences.
 */
export class CaptureHttpAdmission {
  private closed = false;
  private active = 0;
  private idle: (() => void) | undefined;

  admit(): () => void {
    if (this.closed) throw new Error("HTTP admission quiesced for capture");
    this.active++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.active--;
      if (this.active === 0) this.idle?.();
    };
  }

  async withDrainedAdmission<T>(capture: () => T | Promise<T>, timeoutMs = 30_000): Promise<T> {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000 || this.closed) {
      throw new Error("HTTP capture admission unavailable or timeout invalid");
    }
    // Close before the first await: no new request can enter during drain.
    this.closed = true;
    try {
      if (this.active > 0) {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            this.idle = undefined;
            reject(new Error("HTTP capture drain timed out; no snapshot taken"));
          }, timeoutMs);
          this.idle = () => { clearTimeout(timeout); this.idle = undefined; resolve(); };
        });
      }
      return await capture();
    } finally { this.closed = false; this.idle = undefined; }
  }
}

/** Health liveness alone remains responsive; no business request can enter
 * while the gate is closed. onResponse releases both normal and error replies.
 */
export function installCaptureHttpAdmission(app: FastifyInstance): CaptureHttpAdmission {
  const gate = new CaptureHttpAdmission();
  const releases = new WeakMap<FastifyRequest, () => void>();
  app.addHook("onRequest", async (request, reply) => {
    if (request.method === "GET" && request.url === "/health/live") return;
    try { releases.set(request, gate.admit()); }
    catch { reply.code(503).send({ error: "CAPTURE_QUIESCE", message: "Application admission temporarily paused" }); }
  });
  app.addHook("onResponse", async request => {
    releases.get(request)?.();
    releases.delete(request);
  });
  return gate;
}
