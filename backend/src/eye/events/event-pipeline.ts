export type EyeConnectorEventType =
  | "connector.registered"
  | "connector.unregistered"
  | "connector.connected"
  | "connector.disconnected"
  | "poll.started"
  | "poll.completed"
  | "poll.failed"
  | "signal.emitted"
  | "health.updated";

export type EyeConnectorEvent<TPayload = Record<string, unknown>> = {
  eventId: string;
  type: EyeConnectorEventType;
  workspaceId: string;
  providerId: string;
  timestamp: string;
  payload: TPayload;
};

export type EyeEventHandler = (event: EyeConnectorEvent) => void | Promise<void>;

let eventCounter = 0;

function nextEventId(): string {
  eventCounter += 1;
  return `eye-event-${eventCounter}-${Date.now()}`;
}

/** Internal event bus for connector lifecycle and poll events. */
export class EyeEventPipeline {
  private readonly handlers = new Map<EyeConnectorEventType, Set<EyeEventHandler>>();
  private readonly wildcardHandlers = new Set<EyeEventHandler>();
  private readonly history: EyeConnectorEvent[] = [];
  private readonly maxHistory: number;

  constructor(options?: { maxHistory?: number }) {
    this.maxHistory = options?.maxHistory ?? 500;
  }

  on(type: EyeConnectorEventType, handler: EyeEventHandler): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  onAny(handler: EyeEventHandler): () => void {
    this.wildcardHandlers.add(handler);
    return () => this.wildcardHandlers.delete(handler);
  }

  async emit<TPayload extends Record<string, unknown>>(
    type: EyeConnectorEventType,
    params: {
      workspaceId: string;
      providerId: string;
      payload?: TPayload;
    },
  ): Promise<EyeConnectorEvent<TPayload>> {
    const event: EyeConnectorEvent<TPayload> = {
      eventId: nextEventId(),
      type,
      workspaceId: params.workspaceId,
      providerId: params.providerId,
      timestamp: new Date().toISOString(),
      payload: (params.payload ?? {}) as TPayload,
    };

    this.history.push(event as EyeConnectorEvent);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const typeHandlers = this.handlers.get(type);
    const promises: Promise<void>[] = [];
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        promises.push(Promise.resolve(handler(event as EyeConnectorEvent)));
      }
    }
    for (const handler of this.wildcardHandlers) {
      promises.push(Promise.resolve(handler(event as EyeConnectorEvent)));
    }
    await Promise.all(promises);
    return event;
  }

  getHistory(filter?: {
    type?: EyeConnectorEventType;
    workspaceId?: string;
    providerId?: string;
  }): EyeConnectorEvent[] {
    return this.history.filter((event) => {
      if (filter?.type && event.type !== filter.type) return false;
      if (filter?.workspaceId && event.workspaceId !== filter.workspaceId) return false;
      if (filter?.providerId && event.providerId !== filter.providerId) return false;
      return true;
    });
  }

  clearHistory(): void {
    this.history.length = 0;
  }
}
