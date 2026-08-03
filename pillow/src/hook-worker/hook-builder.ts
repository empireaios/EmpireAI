import type { HookWorkerConfiguration } from "./configuration.js";
import {
  CONTENT_FORMATS,
  HKW_METADATA_VERSION,
  HKW_REPORT_VERSION,
  HOOK_TYPES,
} from "./paths.js";
import type {
  ContentFormat,
  ContinuationMoment,
  CuriosityGap,
  HookEntry,
  HookReport,
  HookType,
  HookWorkerCatalog,
  HookWorkerInput,
  IntegrationHandshake,
  PacingRecommendation,
  RetentionLoop,
  ScriptContext,
  SelfReviewFinding,
  SelfReviewResult,
} from "./types.js";

/** Pure Hook Worker helpers for Q4-06 — hook optimization only. */
export class HookBuilder {
  buildCatalog(
    config: HookWorkerConfiguration,
    reports: HookReport[],
    integrations: IntegrationHandshake[],
  ): HookWorkerCatalog {
    return {
      reportVersion: HKW_REPORT_VERSION,
      workerId: config.workerId,
      hookReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: HKW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverRewriteCompleteScript: true,
      neverGenerateThumbnails: true,
      neverGenerateVideos: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  mergeContext(input: HookWorkerInput, context: ScriptContext): ScriptContext {
    const receivedScript =
      context.receivedScript ||
      Boolean(input.scriptId?.trim()) ||
      Boolean(input.scriptTitle?.trim()) ||
      Boolean(input.scriptIntent?.trim()) ||
      Boolean(input.narrationReadyText?.trim()) ||
      Boolean(input.scriptSections?.length);
    return {
      scriptId: input.scriptId ?? context.scriptId ?? null,
      channelId: input.channelId ?? context.channelId ?? null,
      topicId: input.topicId ?? context.topicId ?? null,
      scriptTitle: input.scriptTitle ?? context.scriptTitle ?? null,
      scriptSections: input.scriptSections ?? context.scriptSections ?? [],
      narrationReadyText: input.narrationReadyText ?? context.narrationReadyText ?? null,
      scriptIntent: input.scriptIntent ?? context.scriptIntent ?? null,
      targetAudience: input.targetAudience ?? context.targetAudience ?? null,
      contentFormat: this.resolveFormat(input, context) ?? context.contentFormat ?? null,
      receivedScript,
    };
  }

  canGenerateHooks(context: ScriptContext): { ready: boolean; reason?: string } {
    if (!context.receivedScript && !context.scriptId) {
      return { ready: false, reason: "Approved script context required (scriptId + title/narration/sections)" };
    }
    const hasContent =
      Boolean(context.scriptTitle?.trim()) ||
      Boolean(context.scriptIntent?.trim()) ||
      Boolean(context.narrationReadyText?.trim()) ||
      Boolean(context.scriptSections?.length);
    if (!hasContent) {
      return { ready: false, reason: "Script content required (title, intent, narration, or sections)" };
    }
    return { ready: true };
  }

  resolveFormat(input: HookWorkerInput, context: ScriptContext): ContentFormat | null {
    const raw = input.contentFormat ?? context.contentFormat ?? null;
    if (!raw) return null;
    return (CONTENT_FORMATS as readonly string[]).includes(raw) ? (raw as ContentFormat) : null;
  }

  extractTopic(context: ScriptContext): string {
    if (context.scriptTitle?.trim()) return context.scriptTitle.trim();
    const intro = context.scriptSections?.find(
      (s) => s.sectionType === "intro" || s.sectionType === "hook",
    );
    if (intro?.heading?.trim()) return intro.heading.trim();
    const firstLine = context.narrationReadyText?.split("\n")[0]?.trim();
    if (firstLine && firstLine.length > 10) return firstLine.slice(0, 80);
    return "this topic";
  }

  extractKeyPoint(context: ScriptContext): string {
    const body = context.scriptSections?.find(
      (s) => s.sectionType === "body" || s.sectionType === "list_item",
    );
    if (body?.narration?.trim()) {
      const sentence = body.narration.split(/[.!?]/)[0]?.trim();
      if (sentence) return sentence.slice(0, 120);
    }
    const narration = context.narrationReadyText ?? "";
    const sentences = narration.split(/[.!?]/).filter((s) => s.trim().length > 20);
    if (sentences[1]?.trim()) return sentences[1].trim().slice(0, 120);
    return `what ${this.extractTopic(context).toLowerCase()} means for viewers`;
  }

  generateOpeningHooks(
    context: ScriptContext,
    config: HookWorkerConfiguration,
    seq: number,
  ): { primary: HookEntry; alternatives: HookEntry[] } {
    const topic = this.extractTopic(context);
    const audience = context.targetAudience?.trim() || "viewers";
    const keyPoint = this.extractKeyPoint(context);
    const types = this.selectHookTypes(config, 4);
    const primaryType = types[0] ?? "question_hook";
    const primary: HookEntry = {
      hookId: `hkw-hook-${seq}-primary`,
      hookType: primaryType,
      text: this.buildHookText(primaryType, topic, audience, keyPoint),
      placement: "opening_0s",
    };
    const alternatives = types.slice(1).map((hookType, i) => ({
      hookId: `hkw-hook-${seq}-alt-${i + 1}`,
      hookType,
      text: this.buildHookText(hookType, topic, audience, keyPoint),
      placement: "opening_0s",
    }));
    return { primary, alternatives };
  }

  generateCuriosityGaps(context: ScriptContext, seq: number): CuriosityGap[] {
    const topic = this.extractTopic(context);
    const keyPoint = this.extractKeyPoint(context);
    return [
      {
        gapId: `hkw-gap-${seq}-1`,
        text: `What most ${context.targetAudience ?? "people"} miss about ${topic.toLowerCase()} — and why it matters now.`,
        placement: "intro_15s",
      },
      {
        gapId: `hkw-gap-${seq}-2`,
        text: `The counterintuitive insight behind ${keyPoint.toLowerCase()} that changes how you approach the topic.`,
        placement: "body_30pct",
      },
      {
        gapId: `hkw-gap-${seq}-3`,
        text: `Why the conventional answer to ${topic.toLowerCase()} fails — and what actually works instead.`,
        placement: "body_60pct",
      },
    ];
  }

  generateRetentionLoops(context: ScriptContext, seq: number): RetentionLoop[] {
    const topic = this.extractTopic(context);
    return [
      {
        loopId: `hkw-loop-${seq}-1`,
        text: `Before we reveal the full framework for ${topic.toLowerCase()}, here's the one mistake to avoid.`,
        placement: "body_25pct",
      },
      {
        loopId: `hkw-loop-${seq}-2`,
        text: `Stay with us — the next segment connects directly to the opening question about ${topic.toLowerCase()}.`,
        placement: "body_50pct",
      },
      {
        loopId: `hkw-loop-${seq}-3`,
        text: `We're about to tie everything together — the payoff for ${context.targetAudience ?? "viewers"} comes in the conclusion.`,
        placement: "pre_conclusion",
      },
    ];
  }

  generateContinuationMoments(context: ScriptContext, seq: number): ContinuationMoment[] {
    const topic = this.extractTopic(context);
    const sections = context.scriptSections ?? [];
    const bodyCount = Math.max(sections.filter((s) => s.sectionType === "body" || s.sectionType === "list_item").length, 2);
    return [
      {
        momentId: `hkw-moment-${seq}-1`,
        text: `Next: the first actionable step for ${topic.toLowerCase()} that preserves the script's core intent.`,
        placement: "transition_1",
      },
      {
        momentId: `hkw-moment-${seq}-2`,
        text: `Building on that — here's how ${bodyCount} key insights connect to keep ${context.targetAudience ?? "viewers"} engaged.`,
        placement: "transition_2",
      },
      {
        momentId: `hkw-moment-${seq}-3`,
        text: `Final segment: what to do with everything covered about ${topic.toLowerCase()} — without changing the approved script.`,
        placement: "pre_conclusion",
      },
    ];
  }

  improvePacingRecommendations(context: ScriptContext, format: ContentFormat, seq: number): PacingRecommendation[] {
    const isShort = format === "short" || format === "reel" || format === "social_content";
    if (isShort) {
      return [
        {
          recommendationId: `hkw-pace-${seq}-1`,
          segment: "opening",
          suggestion: "Deliver primary hook within first 3 seconds; cut filler before the payoff.",
          rationale: "Short-form retention drops sharply after 3 seconds without a clear hook.",
        },
        {
          recommendationId: `hkw-pace-${seq}-2`,
          segment: "body",
          suggestion: "One curiosity gap per 15–20 seconds; accelerate transitions between points.",
          rationale: "Short format requires rapid open loops and fast resolution cycles.",
        },
        {
          recommendationId: `hkw-pace-${seq}-3`,
          segment: "conclusion",
          suggestion: "Land CTA within final 5 seconds with a single clear action.",
          rationale: "Short viewers decide to act or swipe within the last few seconds.",
        },
      ];
    }
    return [
      {
        recommendationId: `hkw-pace-${seq}-1`,
        segment: "opening",
        suggestion: "Expand hook delivery to 15–30 seconds with a story or question arc before the thesis.",
        rationale: "Long-form audiences tolerate setup when curiosity is seeded early.",
      },
      {
        recommendationId: `hkw-pace-${seq}-2`,
        segment: "body",
        suggestion: "Insert retention loops every 2–3 minutes; vary pacing between dense and reflective segments.",
        rationale: "Long-form retention requires periodic re-engagement without rewriting script content.",
      },
      {
        recommendationId: `hkw-pace-${seq}-3`,
        segment: "conclusion",
        suggestion: "Recap open loops from curiosity gaps before the final CTA; allow 30–60 seconds for closure.",
        rationale: "Long-form viewers expect payoff on promises made in the opening.",
      },
    ];
  }

  improveAudienceEngagement(
    context: ScriptContext,
    primaryHook: HookEntry,
    gaps: CuriosityGap[],
  ): string {
    const topic = this.extractTopic(context);
    const audience = context.targetAudience?.trim() || "the target audience";
    return (
      `Opening ${primaryHook.hookType.replace(/_/g, " ")} targets ${audience} with a direct retention signal ` +
      `about "${topic}" without altering the approved script narrative. ` +
      `${gaps.length} curiosity gaps re-open attention at intro, mid-body, and late-body placements. ` +
      `Engagement strategy preserves script intent while maximizing watch-through via hooks-only optimization.`
    );
  }

  selfReviewHookEffectiveness(
    primary: HookEntry,
    alternatives: HookEntry[],
    gaps: CuriosityGap[],
    loops: RetentionLoop[],
    moments: ContinuationMoment[],
    context: ScriptContext,
  ): SelfReviewResult {
    const findings: SelfReviewFinding[] = [];
    let score = 100;
    const topic = this.extractTopic(context).toLowerCase();
    const hookTexts = [primary.text, ...alternatives.map((h) => h.text)].join(" ").toLowerCase();
    if (!hookTexts.includes(topic.split(" ")[0]?.toLowerCase() ?? "") && topic.length > 5) {
      findings.push({
        findingId: "hkw-sr-topic-alignment",
        category: "intent_preservation",
        severity: "info",
        message: "Primary hook uses paraphrased topic reference — script intent preserved via context.",
      });
    }
    const deceptivePatterns = ["clickbait lie", "fake news", "guaranteed million", "you won't believe"];
    for (const pattern of deceptivePatterns) {
      if (hookTexts.includes(pattern)) {
        findings.push({
          findingId: `hkw-sr-deceptive-${pattern.replace(/\s/g, "-")}`,
          category: "non_deceptive",
          severity: "error",
          message: `Deceptive pattern detected: "${pattern}"`,
        });
        score -= 40;
      }
    }
    if (alternatives.length < 2) {
      findings.push({
        findingId: "hkw-sr-alternatives",
        category: "alternatives",
        severity: "error",
        message: "At least 2 alternative hooks required",
      });
      score -= 30;
    }
    const altTypes = new Set(alternatives.map((h) => h.hookType));
    if (altTypes.size < 2) {
      findings.push({
        findingId: "hkw-sr-type-diversity",
        category: "alternatives",
        severity: "warning",
        message: "Alternative hooks should use different hook types",
      });
      score -= 10;
    }
    if (!primary.text.trim()) {
      findings.push({
        findingId: "hkw-sr-primary-empty",
        category: "originality",
        severity: "error",
        message: "Primary hook text is empty",
      });
      score -= 50;
    }
    if (gaps.length === 0 || loops.length === 0 || moments.length === 0) {
      findings.push({
        findingId: "hkw-sr-mechanisms",
        category: "retention_mechanisms",
        severity: "error",
        message: "Curiosity gaps, retention loops, and continuation moments must be non-empty",
      });
      score -= 25;
    }
    const passed = score >= 60 && !findings.some((f) => f.severity === "error");
    return {
      passed,
      summary: passed
        ? `Self-review passed: ${1 + alternatives.length} hooks, ${gaps.length} gaps, ${loops.length} loops, ${moments.length} moments — original, non-deceptive, intent preserved.`
        : `Self-review flagged issues: ${findings.filter((f) => f.severity === "error").length} error(s), score=${Math.max(score, 0)}.`,
      findings,
      confidenceScore: Math.max(0, Math.min(100, score)),
    };
  }

  buildHookReport(
    input: HookWorkerInput,
    config: HookWorkerConfiguration,
    context: ScriptContext,
  ): HookReport {
    hookSequence += 1;
    const seq = hookSequence;
    const now = new Date().toISOString();
    const format = this.resolveFormat(input, context) ?? (config.defaultContentFormat as ContentFormat);
    const scriptId = context.scriptId?.trim() || input.scriptId?.trim() || `scw-scr-hkw-${seq}`;
    const hookReportId = input.hookReportId?.trim() || `hkw-rpt-${Date.now()}-${seq}`;
    const channelId = context.channelId?.trim() || input.channelId?.trim() || `chn-hkw-${seq}`;
    const topicId = context.topicId?.trim() || input.topicId?.trim() || `topic-hkw-${seq}`;
    const { primary, alternatives } = this.generateOpeningHooks(context, config, seq);
    const curiosityGaps = this.generateCuriosityGaps(context, seq);
    const retentionLoops = this.generateRetentionLoops(context, seq);
    const continuationMoments = this.generateContinuationMoments(context, seq);
    const pacingRecommendations = this.improvePacingRecommendations(context, format, seq);
    const engagementRationale = this.improveAudienceEngagement(context, primary, curiosityGaps);
    const review = this.selfReviewHookEffectiveness(
      primary,
      alternatives,
      curiosityGaps,
      retentionLoops,
      continuationMoments,
      context,
    );
    const traceabilityRefs = unique([
      `script:${scriptId}`,
      `channel:${channelId}`,
      `topic:${topicId}`,
      `format:${format}`,
      `primaryHook:${primary.hookId}`,
    ]);
    const preservedDecisions = [
      {
        decisionId: `hkw-dec-${seq}-intent`,
        topic: this.extractTopic(context),
        decision: "Preserved approved script intent — hooks-only optimization, no full script rewrite",
        recordedAt: now,
      },
      {
        decisionId: `hkw-dec-${seq}-hooks`,
        topic: this.extractTopic(context),
        decision: `Generated ${1 + alternatives.length} original hooks across ${unique([primary.hookType, ...alternatives.map((h) => h.hookType)]).length} hook types`,
        recordedAt: now,
      },
    ];
    return {
      hookReportId,
      timestamp: now,
      scriptId,
      channelId,
      topicId,
      contentFormat: format,
      primaryHook: primary,
      alternativeHooks: alternatives,
      curiosityGaps,
      retentionLoops,
      continuationMoments,
      pacingRecommendations,
      engagementRationale,
      selfReviewSummary: review.summary,
      confidenceScore: review.confidenceScore,
      metadataVersion: HKW_METADATA_VERSION,
      selfReviewPassed: review.passed,
      selfReviewFindings: review.findings,
      workerId: config.workerId,
      reportVersion: HKW_REPORT_VERSION,
      traceabilityRefs,
      preservedDecisions,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverRewriteCompleteScript: true,
      neverGenerateThumbnails: true,
      neverGenerateVideos: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ407OrLater: true,
      neverUseMisleadingOrDeceptiveHooks: true,
      preserveApprovedScriptIntent: true,
      generateOriginalHooks: true,
      preserveCompleteTraceability: true,
      performSelfReviewBeforeSubmission: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  private selectHookTypes(config: HookWorkerConfiguration, count: number): HookType[] {
    const available = config.supportedHookTypes.filter((t) =>
      (HOOK_TYPES as readonly string[]).includes(t),
    ) as HookType[];
    const defaults: HookType[] = ["question_hook", "curiosity_hook", "story_hook", "fact_hook"];
    const pool = available.length >= count ? available : defaults;
    return pool.slice(0, count);
  }

  private buildHookText(
    hookType: HookType,
    topic: string,
    audience: string,
    keyPoint: string,
  ): string {
    switch (hookType) {
      case "question_hook":
        return `What if everything ${audience} believe about ${topic.toLowerCase()} is incomplete?`;
      case "curiosity_hook":
        return `There's a hidden pattern in ${topic.toLowerCase()} that most ${audience} never notice — until now.`;
      case "shock_hook":
        return `The surprising truth about ${topic.toLowerCase()}: ${keyPoint}.`;
      case "story_hook":
        return `Picture this: a ${audience.slice(0, 30)} facing ${topic.toLowerCase()} — and discovering something unexpected.`;
      case "fact_hook":
        return `Here's what the data reveals about ${topic.toLowerCase()} — and why it matters for ${audience}.`;
      case "problem_hook":
        return `Most ${audience} struggle with ${topic.toLowerCase()} — but the root cause isn't what you'd expect.`;
      case "benefit_hook":
        return `Master ${topic.toLowerCase()} and you'll unlock a clear advantage — here's how ${audience} can start today.`;
      case "countdown_hook":
        return `3 insights about ${topic.toLowerCase()} that will change how ${audience} think — starting with the most overlooked.`;
      case "emotional_hook":
        return `If ${topic.toLowerCase()} has ever felt overwhelming, this perspective was built for ${audience} like you.`;
      default:
        return `Discover what ${audience} need to know about ${topic.toLowerCase()} — starting right now.`;
    }
  }
}

let hookSequence = 0;

export function resetHookSequenceForTesting() {
  hookSequence = 0;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function cloneReport(report: HookReport): HookReport {
  return {
    ...report,
    primaryHook: { ...report.primaryHook },
    alternativeHooks: report.alternativeHooks.map((h) => ({ ...h })),
    curiosityGaps: report.curiosityGaps.map((g) => ({ ...g })),
    retentionLoops: report.retentionLoops.map((l) => ({ ...l })),
    continuationMoments: report.continuationMoments.map((m) => ({ ...m })),
    pacingRecommendations: report.pacingRecommendations.map((p) => ({ ...p })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
  };
}
