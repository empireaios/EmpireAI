import type { TopicPlannerWorkerConfiguration } from "./configuration.js";
import type { PlanStore } from "./plan-store.js";
import {
  TOPIC_PLAN_VERSION,
  TPW_METADATA_VERSION,
} from "./paths.js";
import type {
  AlignmentLevel,
  CadenceStatus,
  ContentMix,
  IntegrationHandshake,
  PlanningContext,
  SelectedTopic,
  TopicPlan,
  TopicPlannerWorkerCatalog,
  TopicPlannerWorkerInput,
  TopicPriority,
} from "./types.js";

/** Pure Topic Planner Worker helpers for Q4-04 — planning only. */
export class PlanBuilder {
  buildCatalog(
    config: TopicPlannerWorkerConfiguration,
    plans: TopicPlan[],
    integrations: IntegrationHandshake[],
  ): TopicPlannerWorkerCatalog {
    return {
      planVersion: TOPIC_PLAN_VERSION,
      workerId: config.workerId,
      topicPlans: plans.map(clonePlan),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: TPW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverWriteScripts: true,
      neverGenerateVisuals: true,
      neverProduceVideos: true,
      neverPublishContent: true,
      neverBypassPillowGovernance: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  buildPlan(
    input: TopicPlannerWorkerInput,
    config: TopicPlannerWorkerConfiguration,
    context: PlanningContext,
    store: PlanStore,
  ): TopicPlan {
    planSequence += 1;
    const now = new Date().toISOString();
    const topicPlanId = input.topicPlanId?.trim() || `tpw-pln-${Date.now()}-${planSequence}`;
    const channelId = input.channelId?.trim() || `chn-tpw-${planSequence}`;
    const mediaBusinessId = input.mediaBusinessId?.trim() || `mbiz-tpw-${planSequence}`;
    const publishingDate = this.resolvePublishingDate(input.publishingDate);
    const dailyCount = Math.max(1, input.dailyTopicCount ?? config.defaultDailyTopicCount);
    const evergreenRatio = clamp(input.evergreenRatio ?? config.defaultEvergreenRatio, 0, 1);
    const candidates = this.collectCandidates(input, context);
    const deduped = this.deduplicateTopics(candidates, store, channelId);
    const ranked = this.rankTopics(deduped, input, context, config);
    const balanced = this.balanceEvergreenTrending(ranked, dailyCount, evergreenRatio);
    const selected = balanced.slice(0, dailyCount);
    const evergreenCount = selected.filter((t) => t.contentMix === "evergreen").length;
    const trendingCount = selected.filter(
      (t) => t.contentMix === "trending" || t.contentMix === "hybrid",
    ).length;
    const avgConfidence =
      selected.length > 0
        ? Math.round(selected.reduce((s, t) => s + t.confidenceScore, 0) / selected.length)
        : 0;
    const editorialAlignment = this.scoreAlignment(
      selected.map((t) => t.editorialAlignmentScore),
    );
    const trendAlignment = this.scoreAlignment(selected.map((t) => t.trendAlignmentScore));
    const topicPriority = this.overallPriority(selected, avgConfidence, config);
    const cadenceStatus = this.assessCadence(channelId, publishingDate, store);
    const trendReportIds = (context.trendReports ?? [])
      .map((r) => r.trendReportId?.trim())
      .filter(Boolean) as string[];
    const traceabilityRefs = unique([
      `channel:${channelId}`,
      `date:${publishingDate}`,
      ...(context.editorialReportId ? [`editorial:${context.editorialReportId}`] : []),
      ...trendReportIds.map((id) => `trend:${id}`),
    ]);
    const preservedDecisions = selected.map((t, i) => ({
      decisionId: `tpw-dec-${planSequence}-${i + 1}`,
      topic: t.title,
      decision: `Selected ${t.contentMix} topic with ${t.priority} priority — planning only, no content creation`,
      recordedAt: now,
    }));
    return {
      topicPlanId,
      timestamp: now,
      channelId,
      publishingDate,
      selectedTopics: selected,
      topicPriority,
      selectionReason: this.buildSelectionReason(selected, context, editorialAlignment, trendAlignment),
      editorialAlignment,
      trendAlignment,
      expectedAudience: input.targetAudience?.trim() || context.targetAudience?.trim() || "channel audience",
      confidenceScore: avgConfidence,
      metadataVersion: TPW_METADATA_VERSION,
      mediaBusinessId,
      editorialReportId: context.editorialReportId ?? input.editorialReportId?.trim() ?? null,
      trendReportIds,
      cadenceStatus,
      evergreenCount,
      trendingCount,
      duplicatePreventionApplied: deduped.length < candidates.length,
      rankedTopics: ranked,
      workerId: config.workerId,
      planVersion: TOPIC_PLAN_VERSION,
      traceabilityRefs,
      preservedDecisions,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      pillowGovernanceConfirmed: input.pillowGovernanceConfirmed !== false,
      neverWriteScripts: true,
      neverGenerateVisuals: true,
      neverProduceVideos: true,
      neverPublishContent: true,
      neverBypassPillowGovernance: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ405OrLater: true,
      neverRequireGrandKingDailyPrompts: true,
      followEditorInChiefStrategy: true,
      useTrendResearchEvidence: true,
      preserveCompletePlanningTraceability: true,
      avoidDuplicateOrConflictingTopics: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  mergeContext(input: TopicPlannerWorkerInput, context: PlanningContext): PlanningContext {
    return {
      editorialStrategy: input.editorialStrategy ?? context.editorialStrategy ?? null,
      editorialReportId: input.editorialReportId ?? context.editorialReportId ?? null,
      channelIdentity: input.channelIdentity ?? context.channelIdentity ?? null,
      targetAudience: input.targetAudience ?? context.targetAudience ?? null,
      editorialTone: input.editorialTone ?? context.editorialTone ?? null,
      contentPriorities: input.contentPriorities ?? context.contentPriorities ?? [],
      trendReports: [...(context.trendReports ?? []), ...(input.trendReports ?? [])],
      channelObjectives: input.channelObjectives ?? context.channelObjectives ?? [],
      receivedEditorial:
        context.receivedEditorial ||
        Boolean(input.editorialStrategy?.trim() || input.editorialReportId?.trim()),
      receivedTrends:
        context.receivedTrends ||
        Boolean((input.trendReports?.length ?? 0) > 0 || (input.trendTopics?.length ?? 0) > 0),
    };
  }

  canProducePlan(context: PlanningContext): { ready: boolean; reason?: string } {
    if (!context.receivedEditorial && !context.editorialStrategy?.trim()) {
      return { ready: false, reason: "Editorial strategy required before topic selection" };
    }
    if (!context.receivedTrends && !(context.trendReports?.length ?? 0)) {
      return { ready: false, reason: "At least one trend research report required before topic selection" };
    }
    return { ready: true };
  }

  private collectCandidates(input: TopicPlannerWorkerInput, context: PlanningContext): SelectedTopic[] {
    const candidates: SelectedTopic[] = [];
    let seq = 0;
    const add = (title: string, mix: ContentMix, trendScore: number, editorialScore: number) => {
      seq += 1;
      candidates.push({
        topicId: `tpw-top-${planSequence}-${seq}`,
        title,
        priority: "medium",
        contentMix: mix,
        selectionReason: "Candidate topic from planning pipeline",
        editorialAlignmentScore: editorialScore,
        trendAlignmentScore: trendScore,
        expectedAudience: input.targetAudience?.trim() || "channel audience",
        confidenceScore: Math.round((editorialScore + trendScore) / 2),
      });
    };
    for (const t of input.candidateTopics ?? []) {
      if (typeof t === "string") {
        add(t, "evergreen", 50, 70);
      } else if (t.title?.trim()) {
        const mix = normalizeMix(t.contentMix);
        add(t.title.trim(), mix, mix === "evergreen" ? 40 : 75, 65);
      }
    }
    for (const trend of context.trendReports ?? []) {
      if (trend.trendTopic?.trim()) {
        const conf = trend.confidenceScore ?? 60;
        add(trend.trendTopic.trim(), "trending", conf, 55);
      }
    }
    for (const topic of input.trendTopics ?? []) {
      if (topic?.trim()) add(topic.trim(), "trending", 70, 50);
    }
    for (const priority of context.contentPriorities ?? input.contentPriorities ?? []) {
      if (priority?.trim()) add(priority.trim(), "hybrid", 60, 80);
    }
    if (!candidates.length) {
      add("Evergreen channel pillar content", "evergreen", 45, 75);
      add("Trending opportunity from research signals", "trending", 72, 55);
      add("Hybrid editorial + trend alignment topic", "hybrid", 65, 70);
    }
    return candidates;
  }

  private deduplicateTopics(
    candidates: SelectedTopic[],
    store: PlanStore,
    channelId: string,
  ): SelectedTopic[] {
    const seen = new Set(store.getExistingTitles(channelId));
    const result: SelectedTopic[] = [];
    for (const c of candidates) {
      const key = normalizeTitle(c.title);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(c);
    }
    return result;
  }

  private rankTopics(
    topics: SelectedTopic[],
    input: TopicPlannerWorkerInput,
    context: PlanningContext,
    config: TopicPlannerWorkerConfiguration,
  ): SelectedTopic[] {
    const strategy = (input.editorialStrategy ?? context.editorialStrategy ?? "").toLowerCase();
    return [...topics]
      .map((t) => {
        let editorial = t.editorialAlignmentScore;
        let trend = t.trendAlignmentScore;
        if (strategy && t.title.toLowerCase().includes(strategy.split(" ")[0] ?? "")) {
          editorial += 15;
        }
        for (const obj of context.channelObjectives ?? []) {
          if (obj && t.title.toLowerCase().includes(obj.toLowerCase().slice(0, 8))) {
            editorial += 10;
          }
        }
        const combined = editorial * 0.5 + trend * 0.5;
        const priority = this.topicPriority(combined, config);
        return {
          ...t,
          editorialAlignmentScore: clamp(editorial, 0, 100),
          trendAlignmentScore: clamp(trend, 0, 100),
          confidenceScore: Math.round(combined),
          priority,
        };
      })
      .sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  private balanceEvergreenTrending(
    ranked: SelectedTopic[],
    dailyCount: number,
    evergreenRatio: number,
  ): SelectedTopic[] {
    const targetEvergreen = Math.round(dailyCount * evergreenRatio);
    const evergreen = ranked.filter((t) => t.contentMix === "evergreen");
    const trending = ranked.filter((t) => t.contentMix === "trending" || t.contentMix === "hybrid");
    const selected: SelectedTopic[] = [];
    selected.push(...evergreen.slice(0, targetEvergreen));
    selected.push(...trending.slice(0, dailyCount - selected.length));
    for (const t of ranked) {
      if (selected.length >= dailyCount) break;
      if (!selected.some((s) => s.topicId === t.topicId)) selected.push(t);
    }
    return selected.slice(0, dailyCount);
  }

  private assessCadence(channelId: string, publishingDate: string, store: PlanStore): CadenceStatus {
    const today = new Date().toISOString().slice(0, 10);
    if (store.hasPublishedOn(channelId, publishingDate)) return "on_schedule";
    if (publishingDate < today) return "behind";
    if (publishingDate > today) return "ahead";
    return "on_schedule";
  }

  private scoreAlignment(scores: number[]): AlignmentLevel {
    if (!scores.length) return "weak";
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    if (avg >= 75) return "strong";
    if (avg >= 55) return "moderate";
    if (avg >= 35) return "weak";
    return "misaligned";
  }

  private topicPriority(combined: number, config: TopicPlannerWorkerConfiguration): TopicPriority {
    if (combined >= config.criticalConfidenceThreshold) return "critical";
    if (combined >= config.highConfidenceThreshold) return "high";
    if (combined >= config.mediumConfidenceThreshold) return "medium";
    if (combined >= 30) return "low";
    return "backlog";
  }

  private overallPriority(
    selected: SelectedTopic[],
    avgConfidence: number,
    config: TopicPlannerWorkerConfiguration,
  ): TopicPriority {
    const top = selected[0];
    if (top) return top.priority;
    return this.topicPriority(avgConfidence, config);
  }

  private buildSelectionReason(
    selected: SelectedTopic[],
    context: PlanningContext,
    editorial: AlignmentLevel,
    trend: AlignmentLevel,
  ): string {
    const titles = selected.map((t) => t.title).join("; ");
    return `Selected ${selected.length} topics aligned to editorial strategy (${editorial}) and trend evidence (${trend}): ${titles}. Planning only under Pillow governance — no content creation.`;
  }

  private resolvePublishingDate(date?: string | null): string {
    if (date?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return date.trim();
    return new Date().toISOString().slice(0, 10);
  }
}

let planSequence = 0;

export function resetPlanSequenceForTesting() {
  planSequence = 0;
}

function normalizeTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeMix(mix?: ContentMix | string | null): ContentMix {
  if (mix === "evergreen" || mix === "trending" || mix === "hybrid") return mix;
  return "hybrid";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function clonePlan(plan: TopicPlan): TopicPlan {
  return {
    ...plan,
    selectedTopics: plan.selectedTopics.map((t) => ({ ...t })),
    rankedTopics: plan.rankedTopics.map((t) => ({ ...t })),
    trendReportIds: [...plan.trendReportIds],
    traceabilityRefs: [...plan.traceabilityRefs],
    preservedDecisions: plan.preservedDecisions.map((d) => ({ ...d })),
  };
}
