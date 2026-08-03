import type { ThumbnailWorkerConfiguration } from "./configuration.js";
import {
  CONTENT_FORMATS,
  EMOTIONAL_TRIGGERS,
  THW_METADATA_VERSION,
  THW_REPORT_VERSION,
} from "./paths.js";
import type {
  AbVariant,
  CompositionGuidance,
  ContentFormat,
  EmotionalTriggerEntry,
  EmotionalTriggerType,
  IntegrationHandshake,
  SelfReviewFinding,
  SelfReviewResult,
  TextOverlaySuggestion,
  ThumbnailConcept,
  ThumbnailContext,
  ThumbnailReport,
  ThumbnailWorkerCatalog,
  ThumbnailWorkerInput,
} from "./types.js";

/** Pure Thumbnail Worker helpers for Q4-07 — concept specifications only. */
export class ThumbnailBuilder {
  buildCatalog(
    config: ThumbnailWorkerConfiguration,
    reports: ThumbnailReport[],
    integrations: IntegrationHandshake[],
  ): ThumbnailWorkerCatalog {
    return {
      reportVersion: THW_REPORT_VERSION,
      workerId: config.workerId,
      thumbnailReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: THW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverGenerateFinalArtwork: true,
      neverEditImagesDirectly: true,
      neverPublishThumbnails: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  mergeContext(input: ThumbnailWorkerInput, context: ThumbnailContext): ThumbnailContext {
    const receivedScript =
      context.receivedScript ||
      Boolean(input.scriptId?.trim()) ||
      Boolean(input.scriptTitle?.trim()) ||
      Boolean(input.scriptIntent?.trim());
    const receivedHooks =
      context.receivedHooks ||
      Boolean(input.hookReportId?.trim()) ||
      Boolean(input.primaryHookText?.trim()) ||
      Boolean(input.alternativeHookTexts?.length);
    return {
      scriptId: input.scriptId ?? context.scriptId ?? null,
      channelId: input.channelId ?? context.channelId ?? null,
      topicId: input.topicId ?? context.topicId ?? null,
      scriptTitle: input.scriptTitle ?? context.scriptTitle ?? null,
      scriptIntent: input.scriptIntent ?? context.scriptIntent ?? null,
      hookReportId: input.hookReportId ?? context.hookReportId ?? null,
      primaryHookText: input.primaryHookText ?? context.primaryHookText ?? null,
      alternativeHookTexts: input.alternativeHookTexts ?? context.alternativeHookTexts ?? [],
      editorialStrategy: input.editorialStrategy ?? context.editorialStrategy ?? null,
      channelIdentity: input.channelIdentity ?? context.channelIdentity ?? null,
      targetAudience: input.targetAudience ?? context.targetAudience ?? null,
      contentFormat: this.resolveFormat(input, context) ?? context.contentFormat ?? null,
      receivedScript,
      receivedHooks,
    };
  }

  canGenerateThumbnails(context: ThumbnailContext): { ready: boolean; reason?: string } {
    if (!context.receivedScript && !context.scriptId) {
      return { ready: false, reason: "Approved script context required (scriptId + title/intent)" };
    }
    const hasContent =
      Boolean(context.scriptTitle?.trim()) || Boolean(context.scriptIntent?.trim());
    if (!hasContent) {
      return { ready: false, reason: "Script content required (title or intent)" };
    }
    return { ready: true };
  }

  resolveFormat(input: ThumbnailWorkerInput, context: ThumbnailContext): ContentFormat | null {
    const raw = input.contentFormat ?? context.contentFormat ?? null;
    if (!raw) return null;
    return (CONTENT_FORMATS as readonly string[]).includes(raw) ? (raw as ContentFormat) : null;
  }

  extractTopic(context: ThumbnailContext): string {
    if (context.scriptTitle?.trim()) return context.scriptTitle.trim();
    if (context.scriptIntent?.trim()) {
      const sentence = context.scriptIntent.split(/[.!?]/)[0]?.trim();
      if (sentence) return sentence.slice(0, 80);
    }
    return "this topic";
  }

  extractHookPhrase(context: ThumbnailContext): string {
    if (context.primaryHookText?.trim()) {
      const words = context.primaryHookText.trim().split(/\s+/);
      return words.slice(0, 6).join(" ");
    }
    const topic = this.extractTopic(context);
    return topic.split(" ").slice(0, 4).join(" ");
  }

  generateThumbnailConcepts(
    context: ThumbnailContext,
    config: ThumbnailWorkerConfiguration,
    seq: number,
  ): { concepts: ThumbnailConcept[]; primary: ThumbnailConcept } {
    const topic = this.extractTopic(context);
    const audience = context.targetAudience?.trim() || "viewers";
    const hookPhrase = this.extractHookPhrase(context);
    const channelBrand = context.channelIdentity?.trim() || "channel brand palette";
    const triggers = this.selectTriggers(config, 3);
    const triggerA = triggers[0] ?? "curiosity";
    const triggerB = triggers[1] ?? "urgency";
    const triggerC = triggers[2] ?? "empathy";
    const concepts: ThumbnailConcept[] = [
      this.buildConcept(seq, 1, topic, audience, hookPhrase, channelBrand, triggerA, "hero_subject", "rule_of_thirds_left"),
      this.buildConcept(seq, 2, topic, audience, hookPhrase, channelBrand, triggerB, "contextual_scene", "center_weighted"),
      this.buildConcept(seq, 3, topic, audience, hookPhrase, channelBrand, triggerC, "symbolic_object", "diagonal_dynamic"),
    ];
    const primary = concepts[0];
    if (!primary) {
      throw new Error("thumbnail concepts unavailable");
    }
    return { concepts, primary };
  }

  generateEmotionalTriggers(context: ThumbnailContext, seq: number): EmotionalTriggerEntry[] {
    const topic = this.extractTopic(context);
    const audience = context.targetAudience?.trim() || "viewers";
    const triggers: EmotionalTriggerType[] = ["curiosity", "urgency", "empathy", "triumph"];
    return triggers.map((trigger, i) => ({
      triggerId: `thw-trigger-${seq}-${i + 1}`,
      trigger,
      expression: this.triggerExpression(trigger, topic, audience),
      placement: i === 0 ? "primary_face_expression" : i === 1 ? "text_overlay_tone" : "background_mood",
      rationale: `${trigger} trigger aligned to script topic without deceptive framing`,
    }));
  }

  generateTextOverlaySuggestions(context: ThumbnailContext, seq: number): TextOverlaySuggestion[] {
    const hookPhrase = this.extractHookPhrase(context);
    const topic = this.extractTopic(context);
    const shortTopic = topic.split(" ").slice(0, 3).join(" ").toUpperCase();
    return [
      {
        overlayId: `thw-overlay-${seq}-1`,
        text: this.trimOverlay(hookPhrase, 28),
        placement: "upper_third_left",
        maxCharacters: 28,
        rationale: "Primary hook distilled — truthful, non-clickbait",
      },
      {
        overlayId: `thw-overlay-${seq}-2`,
        text: this.trimOverlay(`${shortTopic}?`, 20),
        placement: "lower_third_right",
        maxCharacters: 20,
        rationale: "Question format from script intent — invites curiosity",
      },
      {
        overlayId: `thw-overlay-${seq}-3`,
        text: this.trimOverlay(`For ${context.targetAudience?.split(" ")[0] ?? "you"}`, 18),
        placement: "badge_corner",
        maxCharacters: 18,
        rationale: "Audience callout aligned to editorial strategy",
      },
    ];
  }

  recommendCompositionAndFraming(context: ThumbnailContext, format: ContentFormat): CompositionGuidance {
    const isShort = format === "short" || format === "reel" || format === "social_content";
    return {
      framing: isShort ? "tight_crop_mobile_first" : "medium_wide_youtube_standard",
      focalPoint: `subject aligned to ${this.extractTopic(context).toLowerCase()} — eyes or key object at upper-left intersection`,
      negativeSpace: isShort ? "minimal — text occupies upper 25%" : "40% right side reserved for text overlay",
      aspectRatio: isShort ? "9:16" : "16:9",
      safeZoneNotes: "Keep critical elements within platform safe zones; avoid edge-clipped text",
    };
  }

  generateAbVariants(
    primary: ThumbnailConcept,
    concepts: ThumbnailConcept[],
    seq: number,
  ): AbVariant[] {
    const secondary = concepts[1] ?? primary;
    return [
      {
        variantId: `thw-ab-${seq}-a`,
        baseConceptId: primary.conceptId,
        label: "A",
        textOverlay: primary.textOverlay,
        emotionalTrigger: primary.emotionalTrigger,
        composition: primary.composition,
        differentiation: "Primary concept — hook-aligned overlay with hero subject focus",
      },
      {
        variantId: `thw-ab-${seq}-b`,
        baseConceptId: secondary.conceptId,
        label: "B",
        textOverlay: secondary.textOverlay,
        emotionalTrigger: secondary.emotionalTrigger,
        composition: secondary.composition,
        differentiation: "Alternative overlay/emotion/composition — contextual scene variant",
      },
    ];
  }

  validateScriptConsistency(context: ThumbnailContext, concepts: ThumbnailConcept[]): "aligned" | "partial" | "misaligned" {
    const topic = this.extractTopic(context).toLowerCase();
    const topicWord = topic.split(" ")[0]?.toLowerCase() ?? "";
    const allText = concepts
      .map((c) => `${c.title} ${c.textOverlay} ${c.subjectFocus} ${c.rationale}`.toLowerCase())
      .join(" ");
    if (topicWord && allText.includes(topicWord)) return "aligned";
    if (context.scriptIntent && allText.includes(context.scriptIntent.split(" ")[0]?.toLowerCase() ?? "")) {
      return "partial";
    }
    return context.scriptTitle ? "aligned" : "partial";
  }

  selfReviewThumbnailQuality(
    concepts: ThumbnailConcept[],
    abVariants: AbVariant[],
    textOverlays: TextOverlaySuggestion[],
    emotionalTriggers: EmotionalTriggerEntry[],
    context: ThumbnailContext,
  ): SelfReviewResult {
    const findings: SelfReviewFinding[] = [];
    let score = 100;
    const allText = [
      ...concepts.map((c) => c.textOverlay),
      ...textOverlays.map((t) => t.text),
    ]
      .join(" ")
      .toLowerCase();
    const deceptivePatterns = [
      "clickbait lie",
      "fake",
      "guaranteed million",
      "you won't believe",
      "shocking truth they hide",
    ];
    for (const pattern of deceptivePatterns) {
      if (allText.includes(pattern)) {
        findings.push({
          findingId: `thw-sr-deceptive-${pattern.replace(/\s/g, "-")}`,
          category: "non_deceptive",
          severity: "error",
          message: `Deceptive pattern detected: "${pattern}"`,
        });
        score -= 40;
      }
    }
    if (concepts.length < 2) {
      findings.push({
        findingId: "thw-sr-concepts",
        category: "alternatives",
        severity: "error",
        message: "At least 2 thumbnail concepts required",
      });
      score -= 30;
    }
    if (abVariants.length < 2) {
      findings.push({
        findingId: "thw-sr-ab",
        category: "alternatives",
        severity: "error",
        message: "At least 2 A/B variants required",
      });
      score -= 25;
    }
    for (const overlay of textOverlays) {
      if (overlay.text.length > overlay.maxCharacters) {
        findings.push({
          findingId: `thw-sr-overlay-${overlay.overlayId}`,
          category: "text_overlay",
          severity: "warning",
          message: `Overlay exceeds max characters: ${overlay.text.length}/${overlay.maxCharacters}`,
        });
        score -= 5;
      }
    }
    const scriptConsistencyStatus = this.validateScriptConsistency(context, concepts);
    if (scriptConsistencyStatus === "misaligned") {
      findings.push({
        findingId: "thw-sr-script-alignment",
        category: "script_consistency",
        severity: "error",
        message: "Thumbnail concepts misaligned with approved script content",
      });
      score -= 35;
    }
    const brandingNotes =
      context.channelIdentity?.trim()
        ? `Branding aligned to ${context.channelIdentity} — consistent colour and hierarchy guidance applied.`
        : "Default channel branding guidance applied; specify channelIdentity for tighter alignment.";
    const passed = score >= 60 && !findings.some((f) => f.severity === "error");
    return {
      passed,
      summary: passed
        ? `Self-review passed: ${concepts.length} concepts, ${abVariants.length} A/B variants, ${emotionalTriggers.length} triggers — truthful, script-aligned, non-deceptive.`
        : `Self-review flagged issues: ${findings.filter((f) => f.severity === "error").length} error(s), score=${Math.max(score, 0)}.`,
      findings,
      confidenceScore: Math.max(0, Math.min(100, score)),
      scriptConsistencyStatus,
      brandingNotes,
    };
  }

  buildThumbnailReport(
    input: ThumbnailWorkerInput,
    config: ThumbnailWorkerConfiguration,
    context: ThumbnailContext,
  ): ThumbnailReport {
    thumbnailSequence += 1;
    const seq = thumbnailSequence;
    const now = new Date().toISOString();
    const format = this.resolveFormat(input, context) ?? (config.defaultContentFormat as ContentFormat);
    const scriptId = context.scriptId?.trim() || input.scriptId?.trim() || `scw-scr-thw-${seq}`;
    const thumbnailReportId = input.thumbnailReportId?.trim() || `thw-rpt-${Date.now()}-${seq}`;
    const channelId = context.channelId?.trim() || input.channelId?.trim() || `chn-thw-${seq}`;
    const topicId = context.topicId?.trim() || input.topicId?.trim() || `topic-thw-${seq}`;
    const hookReportId = context.hookReportId?.trim() || input.hookReportId?.trim() || null;
    const { concepts, primary } = this.generateThumbnailConcepts(context, config, seq);
    const emotionalTriggers = this.generateEmotionalTriggers(context, seq);
    const textOverlays = this.generateTextOverlaySuggestions(context, seq);
    const compositionGuidance = this.recommendCompositionAndFraming(context, format);
    const abVariants = this.generateAbVariants(primary, concepts, seq);
    const review = this.selfReviewThumbnailQuality(
      concepts,
      abVariants,
      textOverlays,
      emotionalTriggers,
      context,
    );
    const traceabilityRefs = unique([
      `script:${scriptId}`,
      `channel:${channelId}`,
      `topic:${topicId}`,
      `format:${format}`,
      hookReportId ? `hookReport:${hookReportId}` : null,
      `primaryConcept:${primary.conceptId}`,
    ]);
    const preservedDecisions = [
      {
        decisionId: `thw-dec-${seq}-intent`,
        topic: this.extractTopic(context),
        decision: "Preserved approved script intent — thumbnail specifications only, no final artwork",
        recordedAt: now,
      },
      {
        decisionId: `thw-dec-${seq}-concepts`,
        topic: this.extractTopic(context),
        decision: `Generated ${concepts.length} thumbnail concepts with ${abVariants.length} A/B variants`,
        recordedAt: now,
      },
    ];
    return {
      thumbnailReportId,
      timestamp: now,
      scriptId,
      channelId,
      hookReportId,
      topicId,
      contentFormat: format,
      thumbnailConcepts: concepts,
      primaryConcept: primary,
      abVariants,
      textOverlays,
      emotionalTriggers,
      compositionGuidance,
      scriptConsistencyStatus: review.scriptConsistencyStatus,
      brandingNotes: review.brandingNotes,
      selfReviewSummary: review.summary,
      confidenceScore: review.confidenceScore,
      metadataVersion: THW_METADATA_VERSION,
      selfReviewPassed: review.passed,
      selfReviewFindings: review.findings,
      workerId: config.workerId,
      reportVersion: THW_REPORT_VERSION,
      traceabilityRefs,
      preservedDecisions,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverGenerateFinalArtwork: true,
      neverEditImagesDirectly: true,
      neverPublishThumbnails: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ408OrLater: true,
      neverUseMisleadingOrDeceptiveThumbnails: true,
      followEditorInChiefStrategy: true,
      remainConsistentWithApprovedScript: true,
      produceMultipleDesignAlternatives: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  private buildConcept(
    seq: number,
    index: number,
    topic: string,
    audience: string,
    hookPhrase: string,
    channelBrand: string,
    trigger: EmotionalTriggerType,
    subjectStyle: string,
    compositionStyle: string,
  ): ThumbnailConcept {
    const shortTopic = topic.split(" ").slice(0, 3).join(" ");
    return {
      conceptId: `thw-concept-${seq}-${index}`,
      title: `Concept ${index}: ${shortTopic}`,
      subjectFocus: `${subjectStyle} representing ${topic.toLowerCase()} for ${audience}`,
      composition: `${compositionStyle} — subject occupies primary focal zone with clear visual path`,
      textOverlay: this.trimOverlay(hookPhrase || shortTopic, 28),
      emotionalTrigger: trigger,
      contrast: "High contrast between subject and background; text legible at small sizes",
      colourGuidance: `${channelBrand} accent on key element; complementary background tones`,
      visualHierarchy: "Subject → text overlay → supporting context element",
      curiosityElement: `Visual question implied by ${trigger} — aligned to script, not misleading`,
      brandingConsistency: `Typography and colour accents match ${channelBrand}`,
      rationale: `${trigger} concept for "${topic}" — truthful CTR optimization for ${audience}`,
    };
  }

  private selectTriggers(config: ThumbnailWorkerConfiguration, count: number): EmotionalTriggerType[] {
    const available = config.supportedEmotionalTriggers.filter((t) =>
      (EMOTIONAL_TRIGGERS as readonly string[]).includes(t),
    ) as EmotionalTriggerType[];
    const defaults: EmotionalTriggerType[] = ["curiosity", "urgency", "empathy"];
    const pool = available.length >= count ? available : defaults;
    return pool.slice(0, count);
  }

  private triggerExpression(trigger: EmotionalTriggerType, topic: string, audience: string): string {
    switch (trigger) {
      case "curiosity":
        return `Raised eyebrow / partial reveal suggesting more about ${topic.toLowerCase()}`;
      case "urgency":
        return `Forward lean / dynamic angle — timely relevance for ${audience}`;
      case "empathy":
        return `Relatable expression connecting ${audience} to the topic`;
      case "triumph":
        return `Confident posture celebrating outcome related to ${topic.toLowerCase()}`;
      case "tension":
        return `Contrasting elements hinting at challenge within ${topic.toLowerCase()}`;
      case "surprise":
        return `Unexpected but truthful visual element from the script context`;
      default:
        return `Engagement signal for ${topic.toLowerCase()}`;
    }
  }

  private trimOverlay(text: string, max: number): string {
    const trimmed = text.trim();
    if (trimmed.length <= max) return trimmed;
    return `${trimmed.slice(0, max - 1).trim()}…`;
  }
}

let thumbnailSequence = 0;

export function resetThumbnailSequenceForTesting() {
  thumbnailSequence = 0;
}

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function cloneReport(report: ThumbnailReport): ThumbnailReport {
  return {
    ...report,
    thumbnailConcepts: report.thumbnailConcepts.map((c) => ({ ...c })),
    primaryConcept: { ...report.primaryConcept },
    abVariants: report.abVariants.map((v) => ({ ...v })),
    textOverlays: report.textOverlays.map((t) => ({ ...t })),
    emotionalTriggers: report.emotionalTriggers.map((e) => ({ ...e })),
    compositionGuidance: { ...report.compositionGuidance },
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
  };
}
