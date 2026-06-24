import type { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import type { EventBus } from "./event-bus.js";
import type { BrainEvent } from "../types.js";
import { logger } from "../../config/logger.js";

type StreamClient = {
  id: string;
  workspaceId: string;
  reply: FastifyReply;
};

export class EventStreamHub {
  private clients = new Map<string, StreamClient>();
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly eventBus: EventBus) {}

  start(): void {
    this.unsubscribe = this.eventBus.on("*", (event) => {
      this.broadcast(event);
    });
    logger.info("Event stream hub started");
  }

  stop(): void {
    this.unsubscribe?.();
    for (const client of this.clients.values()) {
      if (!client.reply.raw.destroyed) {
        client.reply.raw.end();
      }
    }
    this.clients.clear();
  }

  attach(request: FastifyRequest, reply: FastifyReply, workspaceId: string): string {
    const clientId = randomUUID();

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    reply.raw.write(`event: connected\ndata: ${JSON.stringify({ clientId, workspaceId })}\n\n`);

    this.clients.set(clientId, { id: clientId, workspaceId, reply });

    request.raw.on("close", () => {
      this.clients.delete(clientId);
    });

    return clientId;
  }

  private broadcast(event: BrainEvent): void {
    for (const client of this.clients.values()) {
      if (event.workspaceId !== client.workspaceId && event.workspaceId !== "system") {
        continue;
      }

      if (client.reply.raw.destroyed) {
        this.clients.delete(client.id);
        continue;
      }

      try {
        client.reply.raw.write(
          `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`,
        );
      } catch (error) {
        logger.warn({ error, clientId: client.id }, "Failed to write SSE event");
        this.clients.delete(client.id);
      }
    }
  }
}
