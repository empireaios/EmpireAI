import { randomUUID } from "node:crypto";
import {
  attachRedisErrorHandlerOnce,
  type RedisClient,
} from "../../config/redis-client.js";
import { logger } from "../../config/logger.js";
import type { BrainEvent, BrainEventType } from "../types.js";

export type EventHandler = (event: BrainEvent) => void | Promise<void>;

const EMPIREAI_EVENT_CHANNEL = "empireai:brain:events";

export class EventBus {
  private readonly handlers = new Map<BrainEventType | "*", Set<EventHandler>>();
  private subscriber: RedisClient | null = null;
  private publisher: RedisClient | null = null;
  private readonly localOnly: boolean;

  constructor(
    private readonly redis: RedisClient | null,
    options?: { localOnly?: boolean },
  ) {
    this.localOnly = options?.localOnly ?? false;

    if (!this.localOnly && redis) {
      this.publisher = redis.duplicate();
      this.subscriber = redis.duplicate();
      attachRedisErrorHandlerOnce(this.publisher);
      attachRedisErrorHandlerOnce(this.subscriber);
    }
  }

  async start(): Promise<void> {
    if (this.localOnly) {
      logger.info("Event bus started (local in-memory mode)");
      return;
    }

    await this.subscriber!.subscribe(EMPIREAI_EVENT_CHANNEL);
    this.subscriber!.on("message", (_channel: string, message: string) => {
      try {
        const event = JSON.parse(message) as BrainEvent;
        void this.dispatchLocal(event);
      } catch (error) {
        logger.error({ error }, "Failed to parse event bus message");
      }
    });
    logger.info("Event bus started");
  }

  async stop(): Promise<void> {
    if (this.localOnly) return;

    await this.subscriber?.unsubscribe(EMPIREAI_EVENT_CHANNEL);
    await this.subscriber?.quit();
    await this.publisher?.quit();
    this.subscriber = null;
    this.publisher = null;
  }

  on(type: BrainEventType | "*", handler: EventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  async publish<TPayload extends Record<string, unknown>>(
    event: Omit<BrainEvent<TPayload>, "id" | "timestamp">,
  ): Promise<BrainEvent<TPayload>> {
    const fullEvent: BrainEvent<TPayload> = {
      ...event,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    if (!this.localOnly) {
      await this.publisher!.publish(
        EMPIREAI_EVENT_CHANNEL,
        JSON.stringify(fullEvent),
      );
    }

    await this.dispatchLocal(fullEvent);
    return fullEvent;
  }

  private async dispatchLocal(event: BrainEvent): Promise<void> {
    const typeHandlers = this.handlers.get(event.type) ?? new Set();
    const wildcardHandlers = this.handlers.get("*") ?? new Set();

    for (const handler of [...typeHandlers, ...wildcardHandlers]) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(
          { error, eventType: event.type, eventId: event.id },
          "Event handler failed",
        );
      }
    }
  }
}
