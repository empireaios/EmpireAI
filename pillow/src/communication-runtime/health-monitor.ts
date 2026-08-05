import type { CommunicationStore } from "./communication-store.js";
import type { MetricsCollector } from "./metrics-collector.js";
import type { RuntimeHealth } from "./types.js";

export class HealthMonitor {
  assess(store: CommunicationStore, metricsCollector: MetricsCollector): RuntimeHealth {
    const metrics = metricsCollector.collect(store);
    const stats = metricsCollector.buildMessageStatistics(store);
    const failed = stats.failedMessages + stats.deadLetteredMessages;
    const total = Math.max(1, stats.totalMessages);
    const failedDeliveryRate = failed / total;

    let status: RuntimeHealth["status"] = "healthy";
    let healthScore = 90;

    if (metrics.totalChannels === 0) {
      status = "standby";
      healthScore = 50;
    } else if (failedDeliveryRate > 0.5) {
      status = "failed";
      healthScore = 30;
    } else if (failedDeliveryRate > 0.2) {
      status = "degraded";
      healthScore = 60;
    }

    return {
      status,
      healthScore,
      activeChannels: metrics.activeChannels,
      openSessions: store.listSessions().filter((s) => s.status === "open" || s.status === "idle")
        .length,
      failedDeliveryRate,
      notes: [
        "Runtime health derived from observed delivery evidence only",
        "Acknowledged messages remain in history",
        "No fabricated deliveries",
      ],
    };
  }
}
