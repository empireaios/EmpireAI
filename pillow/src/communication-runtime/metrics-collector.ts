import type { CommunicationStore } from "./communication-store.js";
import type {
  DeliverySummary,
  MessageStatistics,
  RetrySummary,
} from "./types.js";

export class MetricsCollector {
  collect(store: CommunicationStore) {
    return {
      totalChannels: store.listChannels().length,
      activeChannels: store.listActiveChannels().length,
      totalMessages: store.listMessages().length,
      totalSessions: store.listSessions().length,
      totalDeliveries: store.listDeliveries().length,
      totalReports: store.listReports().length,
    };
  }

  buildMessageStatistics(store: CommunicationStore): MessageStatistics {
    const messages = store.listMessages();
    const last = [...messages].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).at(-1);
    return {
      totalMessages: messages.length,
      pendingMessages: messages.filter((m) => m.deliveryStatus === "pending").length,
      routedMessages: messages.filter((m) => m.deliveryStatus === "routed").length,
      deliveredMessages: messages.filter((m) => m.deliveryStatus === "delivered").length,
      acknowledgedMessages: messages.filter((m) => m.deliveryStatus === "acknowledged").length,
      failedMessages: messages.filter((m) => m.deliveryStatus === "failed").length,
      retryingMessages: messages.filter((m) => m.deliveryStatus === "retrying").length,
      deadLetteredMessages: messages.filter((m) => m.deliveryStatus === "dead_lettered").length,
      syncMessages: messages.filter((m) => m.syncMode === "sync").length,
      asyncMessages: messages.filter((m) => m.syncMode === "async").length,
      lastMessageAt: last?.timestamp ?? null,
    };
  }

  buildDeliverySummary(store: CommunicationStore): DeliverySummary {
    const deliveries = store.listDeliveries();
    const byChannelType: Record<string, number> = {};
    for (const d of deliveries) {
      const channel = store.getChannel(d.channelId);
      const key = channel?.channelType ?? "unknown";
      byChannelType[key] = (byChannelType[key] ?? 0) + 1;
    }
    return {
      totalDeliveries: deliveries.length,
      successfulDeliveries: deliveries.filter(
        (d) => d.status === "delivered" || d.status === "acknowledged",
      ).length,
      failedDeliveries: deliveries.filter(
        (d) => d.status === "failed" || d.status === "dead_lettered",
      ).length,
      acknowledgedDeliveries: deliveries.filter((d) => d.status === "acknowledged").length,
      byChannelType,
    };
  }

  buildRetrySummary(store: CommunicationStore): RetrySummary {
    const messages = store.listMessages();
    const retried = messages.filter((m) => m.retryCount > 0);
    const exhausted = messages.filter((m) => m.deliveryStatus === "dead_lettered");
    const avg =
      messages.length === 0
        ? 0
        : messages.reduce((sum, m) => sum + m.retryCount, 0) / messages.length;
    return {
      totalRetries: retried.reduce((sum, m) => sum + m.retryCount, 0),
      exhaustedRetries: exhausted.length,
      deadLettered: exhausted.length,
      averageAttempts: avg,
    };
  }
}
