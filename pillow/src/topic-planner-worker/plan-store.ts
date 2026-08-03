import type { TopicPlan } from "./types.js";

/** Authoritative in-memory topic plan store — planning tracking only. */
export class PlanStore {
  private plans = new Map<string, TopicPlan>();
  private latestTopicPlanId: string | null = null;
  private publishedDates = new Set<string>();
  private auditTrail: Array<{
    timestamp: string;
    topicPlanId: string;
    action: string;
    details: string;
  }> = [];

  seed(plans: TopicPlan[]) {
    this.plans.clear();
    this.latestTopicPlanId = null;
    this.publishedDates.clear();
    this.auditTrail = [];
    for (const plan of plans) {
      this.plans.set(plan.topicPlanId, clone(plan));
      this.latestTopicPlanId = plan.topicPlanId;
      this.publishedDates.add(`${plan.channelId}:${plan.publishingDate}`);
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        topicPlanId: plan.topicPlanId,
        action: "seed",
        details: `seeded plan=${plan.topicPlanId} date=${plan.publishingDate}`,
      });
    }
  }

  count() {
    return this.plans.size;
  }

  list() {
    return [...this.plans.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(topicPlanId: string) {
    const plan = this.plans.get(topicPlanId);
    return plan ? clone(plan) : null;
  }

  getLatestTopicPlanId() {
    return this.latestTopicPlanId;
  }

  getPublishedDates(channelId: string) {
    return [...this.publishedDates]
      .filter((k) => k.startsWith(`${channelId}:`))
      .map((k) => k.split(":").slice(1).join(":"));
  }

  hasPublishedOn(channelId: string, publishingDate: string) {
    return this.publishedDates.has(`${channelId}:${publishingDate}`);
  }

  getExistingTitles(channelId: string) {
    const titles = new Set<string>();
    for (const plan of this.plans.values()) {
      if (plan.channelId !== channelId) continue;
      for (const topic of plan.selectedTopics) {
        titles.add(normalizeTitle(topic.title));
      }
    }
    return titles;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(plan: TopicPlan, action = "save") {
    this.plans.set(plan.topicPlanId, clone(plan));
    this.latestTopicPlanId = plan.topicPlanId;
    this.publishedDates.add(`${plan.channelId}:${plan.publishingDate}`);
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      topicPlanId: plan.topicPlanId,
      action,
      details: `topics=${plan.selectedTopics.length} cadence=${plan.cadenceStatus} confidence=${plan.confidenceScore}`,
    });
    return clone(plan);
  }

  markSubmitted(topicPlanId: string, executiveReportId: string) {
    const current = this.plans.get(topicPlanId);
    if (!current) return null;
    const updated: TopicPlan = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_plan");
  }
}

function normalizeTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function clone(plan: TopicPlan): TopicPlan {
  return {
    ...plan,
    selectedTopics: plan.selectedTopics.map((t) => ({ ...t })),
    rankedTopics: plan.rankedTopics.map((t) => ({ ...t })),
    trendReportIds: [...plan.trendReportIds],
    traceabilityRefs: [...plan.traceabilityRefs],
    preservedDecisions: plan.preservedDecisions.map((d) => ({ ...d })),
  };
}
