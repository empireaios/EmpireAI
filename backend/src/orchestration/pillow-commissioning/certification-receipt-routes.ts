import type { FastifyInstance } from "fastify";
import type { createAuthMiddleware } from "../../auth/middleware.js";
import { ZodError } from "zod";
import { ingestCertificationReceipt, readCertificationReceipt, ReceiptConflict } from "./certification-receipt-intake.js";

/** Evidence intake only. No route accepts certification or changes operational authority. */
export async function registerCertificationReceiptRoutes(app: FastifyInstance, deps: { authenticate: ReturnType<typeof createAuthMiddleware> }) {
  const preHandler: ReturnType<typeof createAuthMiddleware> = async (request, reply) => {
    await deps.authenticate(request, reply);
    if (reply.sent) return;
    if (!request.user) return reply.code(401).send({ error: "Authentication required" });
    if (!["founder", "admin"].includes(request.user.role)) return reply.code(403).send({ error: "Founder access required" });
    if (!request.user.workspaceId || !request.user.id) return reply.code(403).send({ error: "Explicit authenticated workspace required" });
  };
  const errorResponse = (error: unknown) => error instanceof ZodError
    ? { status: 400, code: "INVALID_CERTIFICATION_RECEIPT" }
    : error instanceof ReceiptConflict
      ? { status: 409, code: "CERTIFICATION_RECEIPT_CONFLICT" }
      : { status: 503, code: "CERTIFICATION_EVIDENCE_UNAVAILABLE" };
  app.post("/pillow-commissioning/certification/receipts", { preHandler, bodyLimit: 16384 }, async (request, reply) => {
    try {
      const result = await ingestCertificationReceipt(request.user!.workspaceId!, request.user!.id, request.body);
      return reply.code(result.created ? 201 : 200).send(result);
    } catch (error) { const e = errorResponse(error); return reply.code(e.status).send({ error: e.code, certificationAccepted: false }); }
  });
  app.get<{ Params: { receiptId: string } }>("/pillow-commissioning/certification/receipts/:receiptId", { preHandler }, async (request, reply) => {
    try {
      const result = await readCertificationReceipt(request.user!.workspaceId!, request.params.receiptId);
      return result ? reply.send(result) : reply.code(404).send({ error: "Receipt not found" });
    } catch (error) { const e = errorResponse(error); return reply.code(e.status).send({ error: e.code, certificationAccepted: false }); }
  });
}
