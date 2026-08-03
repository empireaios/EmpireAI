import type { ScriptWorkerConfiguration } from "./configuration.js";
import {
  CONTENT_FORMATS,
  SCW_METADATA_VERSION,
  SCW_REPORT_VERSION,
} from "./paths.js";
import type {
  ContentFormat,
  EditorialComplianceLevel,
  IntegrationHandshake,
  ScriptContext,
  ScriptReport,
  ScriptSection,
  ScriptWorkerCatalog,
  ScriptWorkerInput,
  SelfReviewFinding,
  SelfReviewResult,
} from "./types.js";

/** Pure Script Worker helpers for Q4-05 — script creation only. */
export class ScriptBuilder {
  buildCatalog(
    config: ScriptWorkerConfiguration,
    scripts: ScriptReport[],
    integrations: IntegrationHandshake[],
  ): ScriptWorkerCatalog {
    return {
      reportVersion: SCW_REPORT_VERSION,
      workerId: config.workerId,
      scripts: scripts.map(cloneScript),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: SCW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverGenerateVisuals: true,
      neverGenerateVoiceovers: true,
      neverAssembleVideos: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  mergeContext(input: ScriptWorkerInput, context: ScriptContext): ScriptContext {
    const topicReceived =
      context.receivedTopicPlan ||
      Boolean(input.topicPlanId?.trim()) ||
      Boolean(input.topicId?.trim()) ||
      Boolean(input.topicTitle?.trim());
    const editorialReceived =
      context.receivedEditorial || Boolean(input.editorialStrategy?.trim());
    return {
      topicPlanId: input.topicPlanId ?? context.topicPlanId ?? null,
      topicId: input.topicId ?? context.topicId ?? null,
      topicTitle: input.topicTitle ?? context.topicTitle ?? null,
      editorialStrategy: input.editorialStrategy ?? context.editorialStrategy ?? null,
      editorialReportId: input.editorialReportId ?? context.editorialReportId ?? null,
      channelIdentity: input.channelIdentity ?? context.channelIdentity ?? null,
      targetAudience: input.targetAudience ?? context.targetAudience ?? null,
      editorialTone: input.editorialTone ?? context.editorialTone ?? null,
      contentPriorities: input.contentPriorities ?? context.contentPriorities ?? [],
      contentFormat: this.resolveFormat(input, context) ?? context.contentFormat ?? null,
      receivedTopicPlan: topicReceived,
      receivedEditorial: editorialReceived,
    };
  }

  canGenerateScript(context: ScriptContext): { ready: boolean; reason?: string } {
    if (!context.receivedTopicPlan && !context.topicId && !context.topicTitle) {
      return { ready: false, reason: "Approved topic plan context required (topicId/title or topicPlanId)" };
    }
    if (!context.receivedEditorial && !context.editorialStrategy) {
      return { ready: false, reason: "Editorial strategy required before script generation" };
    }
    return { ready: true };
  }

  determineContentFormat(input: ScriptWorkerInput, context: ScriptContext): ContentFormat {
    return this.resolveFormat(input, context) ?? "explainer";
  }

  buildScript(
    input: ScriptWorkerInput,
    config: ScriptWorkerConfiguration,
    context: ScriptContext,
  ): ScriptReport {
    scriptSequence += 1;
    const now = new Date().toISOString();
    const format = this.determineContentFormat(input, context);
    const topicTitle = context.topicTitle?.trim() || input.topicTitle?.trim() || "Untitled Topic";
    const topicId = context.topicId?.trim() || input.topicId?.trim() || `topic-scw-${scriptSequence}`;
    const scriptId = input.scriptId?.trim() || `scw-scr-${Date.now()}-${scriptSequence}`;
    const channelId = input.channelId?.trim() || `chn-scw-${scriptSequence}`;
    const mediaBusinessId = input.mediaBusinessId?.trim() || `mbiz-scw-${scriptSequence}`;
    const topicPlanId = context.topicPlanId?.trim() || input.topicPlanId?.trim() || `tpw-pln-scw-${scriptSequence}`;
    const targetAudience =
      input.targetAudience?.trim() || context.targetAudience?.trim() || "channel audience";
    const editorialStrategy = context.editorialStrategy?.trim() || input.editorialStrategy?.trim() || "";
    const channelIdentity = context.channelIdentity?.trim() || input.channelIdentity?.trim() || channelId;
    const editorialTone = context.editorialTone?.trim() || input.editorialTone?.trim() || "informative";
    const contentPriorities = context.contentPriorities ?? input.contentPriorities ?? [];
    const writingStyleNotes = this.buildWritingStyleNotes(channelIdentity, editorialTone, format);
    const sections = this.structureScriptSections(
      topicTitle,
      format,
      editorialStrategy,
      channelIdentity,
      editorialTone,
      contentPriorities,
      targetAudience,
    );
    const narrationReadyText = sections.map((s) => s.narration).join("\n\n");
    const estimatedDuration = sections.reduce((sum, s) => sum + s.estimatedSeconds, 0);
    const selfReview = this.selfReviewScript(
      sections,
      narrationReadyText,
      editorialStrategy,
      contentPriorities,
      topicTitle,
    );
    const traceabilityRefs = unique([
      `channel:${channelId}`,
      `topic:${topicId}`,
      `topicPlan:${topicPlanId}`,
      ...(context.editorialReportId ? [`editorial:${context.editorialReportId}`] : []),
      `format:${format}`,
    ]);
    const preservedDecisions = [
      {
        decisionId: `scw-dec-${scriptSequence}-format`,
        topic: topicTitle,
        decision: `Selected ${format} format aligned with channel identity — script only, no visuals/voiceover/video`,
        recordedAt: now,
      },
      {
        decisionId: `scw-dec-${scriptSequence}-tone`,
        topic: topicTitle,
        decision: `Applied ${editorialTone} tone for ${targetAudience}`,
        recordedAt: now,
      },
    ];
    return {
      scriptId,
      timestamp: now,
      channelId,
      topicId,
      contentFormat: format,
      targetAudience,
      scriptTitle: this.buildScriptTitle(topicTitle, format),
      scriptSections: sections,
      estimatedDuration,
      editorialCompliance: selfReview.editorialCompliance,
      editorialComplianceNotes: selfReview.editorialComplianceNotes,
      selfReviewSummary: selfReview.summary,
      confidenceScore: selfReview.complianceScore,
      metadataVersion: SCW_METADATA_VERSION,
      topicPlanId,
      mediaBusinessId,
      editorialReportId: context.editorialReportId ?? input.editorialReportId?.trim() ?? null,
      writingStyleNotes,
      narrationReadyText,
      selfReviewPassed: selfReview.passed,
      selfReviewFindings: selfReview.findings,
      workerId: config.workerId,
      reportVersion: SCW_REPORT_VERSION,
      traceabilityRefs,
      preservedDecisions,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      pillowGovernanceConfirmed: input.pillowGovernanceConfirmed !== false,
      neverGenerateVisuals: true,
      neverGenerateVoiceovers: true,
      neverAssembleVideos: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ406OrLater: true,
      followApprovedTopicPlan: true,
      followEditorInChiefStrategy: true,
      produceOriginalContent: true,
      preserveScriptTraceability: true,
      performSelfReviewBeforeSubmission: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  structureScriptSections(
    topicTitle: string,
    format: ContentFormat,
    editorialStrategy: string,
    channelIdentity: string,
    editorialTone: string,
    contentPriorities: string[],
    targetAudience: string,
  ): ScriptSection[] {
    const durationProfile = FORMAT_DURATION[format];
    const priorityPhrase =
      contentPriorities.length > 0
        ? contentPriorities.slice(0, 2).join(" and ")
        : editorialStrategy.split(/[.,]/)[0]?.trim() || "core channel themes";
    const toneAdjective = TONE_ADJECTIVES[editorialTone.toLowerCase()] ?? editorialTone;
    const sections: ScriptSection[] = [];
    if (format === "short" || format === "reel" || format === "social_content") {
      sections.push({
        sectionId: `sec-hook-${scriptSequence}`,
        sectionType: "hook",
        heading: "Hook",
        narration: `${toneAdjective} opening for ${targetAudience}: ${topicTitle}. ${this.extractStrategyHook(editorialStrategy, topicTitle)}`,
        estimatedSeconds: durationProfile.hook,
      });
      sections.push({
        sectionId: `sec-body-${scriptSequence}`,
        sectionType: "body",
        heading: "Core Message",
        narration: `On ${channelIdentity}, we explore ${topicTitle} through the lens of ${priorityPhrase}. ${this.buildBodyParagraph(topicTitle, editorialStrategy, format, 1)}`,
        estimatedSeconds: durationProfile.body,
      });
      sections.push({
        sectionId: `sec-cta-${scriptSequence}`,
        sectionType: "cta",
        heading: "Call to Action",
        narration: `If ${topicTitle} matters to you, follow along for more ${priorityPhrase} insights tailored for ${targetAudience}.`,
        estimatedSeconds: durationProfile.conclusion,
      });
    } else if (format === "list_video") {
      sections.push({
        sectionId: `sec-intro-${scriptSequence}`,
        sectionType: "intro",
        heading: "Introduction",
        narration: `Welcome to ${channelIdentity}. Today we count down essential points about ${topicTitle} for ${targetAudience}, aligned with our ${editorialTone} editorial approach.`,
        estimatedSeconds: durationProfile.intro,
      });
      for (let i = 1; i <= 3; i++) {
        sections.push({
          sectionId: `sec-list-${scriptSequence}-${i}`,
          sectionType: "list_item",
          heading: `Point ${i}`,
          narration: `Number ${i}: ${this.buildListItem(topicTitle, priorityPhrase, i, editorialStrategy)}`,
          estimatedSeconds: Math.round(durationProfile.body / 3),
        });
      }
      sections.push({
        sectionId: `sec-conclusion-${scriptSequence}`,
        sectionType: "conclusion",
        heading: "Conclusion",
        narration: `These insights on ${topicTitle} reflect ${editorialStrategy.slice(0, 120)}${editorialStrategy.length > 120 ? "..." : ""} Stay subscribed for more.`,
        estimatedSeconds: durationProfile.conclusion,
      });
    } else {
      sections.push({
        sectionId: `sec-intro-${scriptSequence}`,
        sectionType: "intro",
        heading: "Introduction",
        narration: `${toneAdjective} welcome to ${channelIdentity}. In this ${format.replace(/_/g, " ")}, we examine ${topicTitle} for ${targetAudience}. ${this.extractStrategyHook(editorialStrategy, topicTitle)}`,
        estimatedSeconds: durationProfile.intro,
      });
      sections.push({
        sectionId: `sec-body-1-${scriptSequence}`,
        sectionType: "body",
        heading: "Context and Background",
        narration: this.buildBodyParagraph(topicTitle, editorialStrategy, format, 1),
        estimatedSeconds: Math.round(durationProfile.body * 0.4),
      });
      sections.push({
        sectionId: `sec-body-2-${scriptSequence}`,
        sectionType: "body",
        heading: "Deep Dive",
        narration: this.buildBodyParagraph(topicTitle, editorialStrategy, format, 2),
        estimatedSeconds: Math.round(durationProfile.body * 0.35),
      });
      sections.push({
        sectionId: `sec-body-3-${scriptSequence}`,
        sectionType: "body",
        heading: "Practical Takeaways",
        narration: `For ${targetAudience}, the key takeaway on ${topicTitle} connects directly to ${priorityPhrase}. ${this.buildBodyParagraph(topicTitle, editorialStrategy, format, 3)}`,
        estimatedSeconds: Math.round(durationProfile.body * 0.25),
      });
      sections.push({
        sectionId: `sec-conclusion-${scriptSequence}`,
        sectionType: "conclusion",
        heading: "Conclusion",
        narration: `To summarize ${topicTitle}: our ${editorialTone} perspective on ${channelIdentity} emphasizes ${priorityPhrase}. Thank you for watching — script prepared for narration, not final production.`,
        estimatedSeconds: durationProfile.conclusion,
      });
    }
    return sections;
  }

  adaptWritingStyle(
    sections: ScriptSection[],
    channelIdentity: string,
    editorialTone: string,
  ): { sections: ScriptSection[]; notes: string } {
    const tonePrefix = TONE_PREFIX[editorialTone.toLowerCase()] ?? "";
    const adapted = sections.map((s) => ({
      ...s,
      narration: tonePrefix
        ? `${tonePrefix}${s.narration.charAt(0).toLowerCase()}${s.narration.slice(1)}`
        : s.narration,
    }));
    return {
      sections: adapted,
      notes: `Adapted to ${editorialTone} tone for ${channelIdentity}`,
    };
  }

  generateNarrationReadyOutput(sections: ScriptSection[]): string {
    return sections.map((s) => s.narration.trim()).filter(Boolean).join("\n\n");
  }

  selfReviewScript(
    sections: ScriptSection[],
    narrationReadyText: string,
    editorialStrategy: string,
    contentPriorities: string[],
    topicTitle: string,
  ): SelfReviewResult {
    const findings: SelfReviewFinding[] = [];
    let score = 100;
    const hasIntro = sections.some((s) => s.sectionType === "intro" || s.sectionType === "hook");
    const hasBody = sections.some((s) => s.sectionType === "body" || s.sectionType === "list_item");
    const hasConclusion = sections.some(
      (s) => s.sectionType === "conclusion" || s.sectionType === "cta",
    );
    if (!hasIntro) {
      findings.push({
        findingId: `scw-find-intro-${Date.now()}`,
        category: "structure",
        severity: "error",
        message: "Missing introduction or hook section",
      });
      score -= 25;
    }
    if (!hasBody) {
      findings.push({
        findingId: `scw-find-body-${Date.now()}`,
        category: "structure",
        severity: "error",
        message: "Missing body section",
      });
      score -= 25;
    }
    if (!hasConclusion) {
      findings.push({
        findingId: `scw-find-conclusion-${Date.now()}`,
        category: "structure",
        severity: "error",
        message: "Missing conclusion or CTA section",
      });
      score -= 20;
    }
    const emptyNarration = sections.filter((s) => !s.narration.trim());
    if (emptyNarration.length) {
      findings.push({
        findingId: `scw-find-narration-${Date.now()}`,
        category: "narration",
        severity: "error",
        message: `${emptyNarration.length} section(s) have empty narration`,
      });
      score -= 20;
    }
    const strategyKeywords = this.extractKeywords(editorialStrategy);
    const priorityKeywords = contentPriorities.flatMap((p) => this.extractKeywords(p));
    const allKeywords = unique([...strategyKeywords, ...priorityKeywords]).slice(0, 5);
    const narrationLower = narrationReadyText.toLowerCase();
    const matchedKeywords = allKeywords.filter((kw) => narrationLower.includes(kw.toLowerCase()));
    if (allKeywords.length > 0 && matchedKeywords.length === 0) {
      findings.push({
        findingId: `scw-find-editorial-${Date.now()}`,
        category: "editorial",
        severity: "warning",
        message: "Editorial strategy keywords not detected in narration",
      });
      score -= 10;
    } else if (matchedKeywords.length < Math.ceil(allKeywords.length / 2)) {
      findings.push({
        findingId: `scw-find-editorial-partial-${Date.now()}`,
        category: "editorial",
        severity: "info",
        message: "Partial editorial keyword alignment",
      });
      score -= 5;
    }
    const isTemplateOnly =
      narrationReadyText.trim().length < 50 ||
      /^welcome to \. today we explore \./i.test(narrationReadyText);
    if (isTemplateOnly) {
      findings.push({
        findingId: `scw-find-originality-${Date.now()}`,
        category: "originality",
        severity: "error",
        message: "Script appears to be empty template only",
      });
      score -= 30;
    }
    if (!narrationReadyText.includes(topicTitle.split(" ")[0] ?? topicTitle)) {
      findings.push({
        findingId: `scw-find-topic-${Date.now()}`,
        category: "topic_alignment",
        severity: "warning",
        message: "Topic title not clearly referenced in narration",
      });
      score -= 5;
    }
    score = clamp(score, 0, 100);
    const errorCount = findings.filter((f) => f.severity === "error").length;
    const passed = errorCount === 0 && score >= 60;
    let editorialCompliance: EditorialComplianceLevel = "compliant";
    let editorialComplianceNotes = "Script aligns with editorial strategy and topic plan";
    if (errorCount > 0 || score < 50) {
      editorialCompliance = "non_compliant";
      editorialComplianceNotes = "Self-review detected structural or originality failures";
    } else if (score < 75 || findings.some((f) => f.severity === "warning")) {
      editorialCompliance = "partial";
      editorialComplianceNotes = "Script partially aligns with editorial strategy";
    }
    return {
      passed,
      summary: passed
        ? `Self-review passed with score ${score}/100 for "${topicTitle}"`
        : `Self-review flagged ${findings.length} finding(s); score ${score}/100`,
      findings,
      complianceScore: score,
      editorialCompliance,
      editorialComplianceNotes,
    };
  }

  private resolveFormat(input: ScriptWorkerInput, context: ScriptContext): ContentFormat | null {
    const explicit = (input.contentFormat ?? context.contentFormat)?.toString().trim().toLowerCase();
    if (explicit && isContentFormat(explicit)) return explicit;
    const title = (context.topicTitle ?? input.topicTitle ?? "").toLowerCase();
    const channel = (context.channelIdentity ?? input.channelIdentity ?? "").toLowerCase();
    if (/\b(reel|tiktok|shorts?)\b/.test(title) || /\bshort-form\b/.test(channel)) return "reel";
    if (/\bshort\b/.test(title) || /\bquick\b/.test(title)) return "short";
    if (/\blist\b|\btop \d+\b/.test(title)) return "list_video";
    if (/\bdocumentary\b/.test(title)) return "documentary";
    if (/\bnews\b|\bbreaking\b/.test(title)) return "news";
    if (/\beducational\b|\btutorial\b|\bhow to\b/.test(title)) return "educational";
    if (/\blong.form\b|\bdeep dive\b|\bfull\b/.test(title)) return "long_form_video";
    if (/\bsocial\b/.test(title)) return "social_content";
    return null;
  }

  private buildScriptTitle(topicTitle: string, format: ContentFormat): string {
    const prefix = FORMAT_TITLE_PREFIX[format] ?? "";
    return prefix ? `${prefix}: ${topicTitle}` : topicTitle;
  }

  private buildWritingStyleNotes(
    channelIdentity: string,
    editorialTone: string,
    format: ContentFormat,
  ): string {
    return `${editorialTone} voice for ${channelIdentity}; ${format.replace(/_/g, " ")} pacing; narration-ready prose`;
  }

  private extractStrategyHook(strategy: string, topicTitle: string): string {
    const firstSentence = strategy.split(/[.!?]/)[0]?.trim();
    if (firstSentence && firstSentence.length > 20) {
      return `Our editorial mission: ${firstSentence}.`;
    }
    return `This piece connects ${topicTitle} to our channel strategy.`;
  }

  private buildBodyParagraph(
    topicTitle: string,
    editorialStrategy: string,
    format: ContentFormat,
    index: number,
  ): string {
    const strategySnippet = editorialStrategy.slice(0, 100).trim();
    const depth = format === "long_form_video" || format === "documentary" ? "comprehensive" : "focused";
    const angles = [
      `Understanding ${topicTitle} requires examining how it fits within ${strategySnippet || "our strategic framework"}.`,
      `The ${depth} analysis reveals why ${topicTitle} matters now — drawing from editorial priorities that emphasize actionable insight.`,
      `Practical implications of ${topicTitle} include measurable outcomes aligned with our content standards and audience expectations.`,
    ];
    return angles[(index - 1) % angles.length]!;
  }

  private buildListItem(
    topicTitle: string,
    priorityPhrase: string,
    index: number,
    editorialStrategy: string,
  ): string {
    const items = [
      `${topicTitle} connects to ${priorityPhrase} through proven frameworks.`,
      `Editorial strategy highlights: ${editorialStrategy.slice(0, 80)}.`,
      `Audience-first perspective on ${topicTitle} delivers immediate value.`,
    ];
    return items[(index - 1) % items.length]!;
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s,;.!?]+/)
      .filter((w) => w.length > 4)
      .slice(0, 8);
  }
}

let scriptSequence = 0;

export function resetScriptSequenceForTesting() {
  scriptSequence = 0;
}

const FORMAT_DURATION: Record<
  ContentFormat,
  { intro: number; hook: number; body: number; conclusion: number }
> = {
  short: { intro: 5, hook: 8, body: 35, conclusion: 12 },
  reel: { intro: 3, hook: 5, body: 25, conclusion: 7 },
  social_content: { intro: 4, hook: 6, body: 20, conclusion: 10 },
  long_form_video: { intro: 45, hook: 15, body: 480, conclusion: 60 },
  documentary: { intro: 60, hook: 20, body: 600, conclusion: 90 },
  explainer: { intro: 20, hook: 10, body: 180, conclusion: 30 },
  educational: { intro: 25, hook: 12, body: 240, conclusion: 35 },
  news: { intro: 15, hook: 8, body: 120, conclusion: 25 },
  list_video: { intro: 18, hook: 10, body: 150, conclusion: 22 },
};

const FORMAT_TITLE_PREFIX: Partial<Record<ContentFormat, string>> = {
  long_form_video: "Deep Dive",
  short: "Quick Take",
  reel: "Reel",
  explainer: "Explained",
  educational: "Learn",
  news: "Update",
  list_video: "Top Points",
  social_content: "Social Snippet",
};

const TONE_ADJECTIVES: Record<string, string> = {
  authoritative: "An authoritative",
  conversational: "A conversational",
  informative: "An informative",
  energetic: "An energetic",
  professional: "A professional",
  casual: "A casual",
};

const TONE_PREFIX: Record<string, string> = {
  authoritative: "Clearly, ",
  conversational: "So, ",
  informative: "Notably, ",
  energetic: "Let's go — ",
};

function isContentFormat(value: string): value is ContentFormat {
  return (CONTENT_FORMATS as readonly string[]).includes(value);
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cloneScript(script: ScriptReport): ScriptReport {
  return {
    ...script,
    scriptSections: script.scriptSections.map((s) => ({ ...s })),
    traceabilityRefs: [...script.traceabilityRefs],
    preservedDecisions: script.preservedDecisions.map((d) => ({ ...d })),
    selfReviewFindings: script.selfReviewFindings.map((f) => ({ ...f })),
  };
}
