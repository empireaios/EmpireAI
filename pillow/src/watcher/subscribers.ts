import type {
  WatcherEventBatch,
  WatcherSubscriber,
  WatcherSubscriberId,
  SubscriberNotification,
} from "./types.js";

export const DEFAULT_SUBSCRIBER_IDS: WatcherSubscriberId[] = [
  "repository_memory",
  "mission_planner",
  "cursor_supervisor",
  "executive_audit_reviewer",
  "repository_synchronizer",
  "due_diligence_engine",
  "autonomous_improvement_engine",
  "empire_ai_orchestrator",
  "executive_direction",
];

export class SubscriberRegistry {
  private subscribers = new Map<WatcherSubscriberId, WatcherSubscriber>();
  private notificationLog: SubscriberNotification[] = [];

  register(subscriber: WatcherSubscriber): void {
    this.subscribers.set(subscriber.id, subscriber);
  }

  unregister(id: WatcherSubscriberId): void {
    this.subscribers.delete(id);
  }

  getSubscribers(): WatcherSubscriber[] {
    return [...this.subscribers.values()];
  }

  async notifyAll(batch: WatcherEventBatch): Promise<SubscriberNotification[]> {
    const notifications: SubscriberNotification[] = [];

    for (const sub of this.subscribers.values()) {
      await sub.onEvents(batch);
      const note: SubscriberNotification = {
        subscriberId: sub.id,
        eventCount: batch.events.length,
        notifiedAt: new Date().toISOString(),
      };
      notifications.push(note);
      this.notificationLog.push(note);
    }

    return notifications;
  }

  getNotificationLog(): SubscriberNotification[] {
    return [...this.notificationLog];
  }
}

export function createNoOpSubscriber(id: WatcherSubscriberId): WatcherSubscriber {
  const labels: Record<WatcherSubscriberId, string> = {
    repository_memory: "Repository Memory Engine",
    mission_planner: "Mission Planner",
    cursor_supervisor: "Cursor Supervisor",
    executive_audit_reviewer: "Executive Audit Reviewer",
    repository_synchronizer: "Repository Synchronizer",
    due_diligence_engine: "Continuous Due Diligence Engine",
    autonomous_improvement_engine: "Autonomous Improvement Engine",
    empire_ai_orchestrator: "EmpireAI Orchestrator",
    executive_direction: "Executive Direction Context",
  };
  return {
    id,
    label: labels[id],
    onEvents: () => {},
  };
}
