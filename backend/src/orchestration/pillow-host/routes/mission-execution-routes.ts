import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AUTHORITY_ACTION, ExecutionConflict } from "../mission-execution/contract.js";
import type { MissionExecutionService } from "../mission-execution/service.js";

type MissionAuth = (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>;
/** This endpoint never accepts caller-supplied receipts, effects, owner identity or worker implementations. */
export async function registerMissionExecutionRoutes(app: FastifyInstance, service: MissionExecutionService | null,
  authenticate: MissionAuth): Promise<void> {
  if (service) {
    app.addHook("onReady", async () => { service.runner.start(); });
    app.addHook("onClose", async () => { await service.runner.stop(); });
  }
  app.post("/api/pillow/mission-runtime/authority-executions", { preHandler: authenticate }, async (request, reply) => {
    if (!service) return reply.code(503).send({ error: "Readonly mission executor is not configured", code: "MISSION_EXECUTOR_UNAVAILABLE" });
    const body = request.body as Record<string, unknown> | null;
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).sort().join() !== "action,dispatchId,missionId" ||
      body.action !== AUTHORITY_ACTION || typeof body.missionId !== "string" || typeof body.dispatchId !== "string" ||
      !/^[a-zA-Z0-9._-]{1,160}$/.test(body.missionId) || !/^[a-zA-Z0-9._-]{1,240}$/.test(body.dispatchId)) {
      return reply.code(400).send({ error: "Only recorded mission/dispatch and authority.snapshot.v1 are accepted", code: "MISSION_EXECUTION_INPUT_INVALID" });
    }
    try {
      const { job, created } = service.enqueue(body.missionId, body.dispatchId);
      return reply.code(created ? 202 : 200).send({ jobId: job.jobId, status: job.status, acceptedDurably: true,
        resultAvailable: job.receipt !== null, certificationCredit: false, commerceExecution: false });
    } catch (error) {
      return reply.code(error instanceof ExecutionConflict ? 409 : 503).send({ error: error instanceof ExecutionConflict ? "Mission or immutable execution binding conflicts" : "Durable execution admission unavailable",
        code: error instanceof ExecutionConflict ? "MISSION_EXECUTION_CONFLICT" : "MISSION_EXECUTION_UNAVAILABLE" });
    }
  });
  app.get<{ Params: { jobId: string } }>("/api/pillow/mission-runtime/authority-executions/:jobId", { preHandler: authenticate }, async (request, reply) => {
    if (!service) return reply.code(503).send({ error: "Readonly mission executor is not configured" });
    if (!/^mae_[a-f0-9]{64}$/.test(request.params.jobId)) return reply.code(400).send({ error: "Invalid execution identifier" });
    try {
      const job = service.get(request.params.jobId);
      if (!job) return reply.code(404).send({ error: "Execution not found" });
      return reply.send({ jobId: job.jobId, missionId: job.missionId, status: job.status, attempts: job.attempts,
        missionReconciled: job.reconciled, executionBuildSha: job.buildSha, output: job.receipt?.output ?? null,
        outputHash: job.receipt?.outputHash ?? null, lastError: job.lastError, runner: service.runner.status(),
        certificationCredit: false, commerceExecution: false });
    } catch { return reply.code(503).send({ error: "Execution history unavailable; no completion inferred" }); }
  });
}
