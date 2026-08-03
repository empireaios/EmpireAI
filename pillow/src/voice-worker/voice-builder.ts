import type { VoiceWorkerConfiguration } from "./configuration.js";
import {
  EMOTIONAL_STYLES,
  VOICE_CAPABILITIES_CATALOG,
  VOICE_LANGUAGES,
  VOICE_PROFILES,
  VOICE_TONES,
  VOW_METADATA_VERSION,
  VOW_REPORT_VERSION,
} from "./paths.js";
import type {
  EmotionalStyle,
  IntegrationHandshake,
  NarrationSegment,
  QualityStatus,
  VoiceAssetRef,
  VoiceConfigHistoryEntry,
  VoiceContext,
  VoiceGenerationSettings,
  VoiceLanguage,
  VoiceProfile,
  VoiceReport,
  VoiceTone,
  VoiceVariant,
  VoiceWorkerCatalog,
  VoiceWorkerInput,
} from "./types.js";

/** Pure Voice Worker helpers for Q4-10 — structural signals only. */
export class VoiceBuilder {
  buildCatalog(
    config: VoiceWorkerConfiguration,
    reports: VoiceReport[],
    integrations: IntegrationHandshake[],
  ): VoiceWorkerCatalog {
    return {
      reportVersion: VOW_REPORT_VERSION,
      workerId: config.workerId,
      voiceReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      supportedVoiceProfiles: [...VOICE_PROFILES],
      supportedLanguages: [...VOICE_LANGUAGES],
      voiceCapabilities: [...VOICE_CAPABILITIES_CATALOG],
      metadataVersion: VOW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverRewriteScripts: true,
      neverAssembleVideos: true,
      neverPublishMedia: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  mergeContext(input: VoiceWorkerInput, context: VoiceContext): VoiceContext {
    const receivedApprovedScript =
      context.receivedApprovedScript ||
      Boolean(input.scriptId?.trim()) ||
      Boolean(input.narrationReadyText?.trim()) ||
      Boolean(input.scriptSections?.length);
    return {
      scriptId: input.scriptId ?? context.scriptId ?? null,
      channelId: input.channelId ?? context.channelId ?? null,
      topicId: input.topicId ?? context.topicId ?? null,
      voiceProfile: this.resolveVoiceProfile(input, context) ?? context.voiceProfile ?? null,
      language: this.resolveLanguage(input, context) ?? context.language ?? null,
      speakingSpeed: input.speakingSpeed ?? context.speakingSpeed ?? null,
      tone: this.resolveTone(input, context) ?? context.tone ?? null,
      emotionalStyle: this.resolveEmotionalStyle(input, context) ?? context.emotionalStyle ?? null,
      pauseControlMs: input.pauseControlMs ?? context.pauseControlMs ?? null,
      pronunciationControls:
        input.pronunciationControls ?? context.pronunciationControls ?? [],
      narrationText: input.narrationText ?? context.narrationText ?? null,
      scriptSections: input.scriptSections ?? context.scriptSections ?? [],
      narrationReadyText: input.narrationReadyText ?? context.narrationReadyText ?? null,
      receivedApprovedScript,
      narrationSegments: context.narrationSegments ?? [],
      voiceGenerationSettings: context.voiceGenerationSettings ?? null,
      configurationHistory: context.configurationHistory ?? [],
      voiceAssetReferences: context.voiceAssetReferences ?? [],
    };
  }

  canGenerateVoice(context: VoiceContext): { ready: boolean; reason?: string } {
    if (!context.receivedApprovedScript) {
      return {
        ready: false,
        reason: "Approved script required before voice generation",
      };
    }
    if (!context.scriptId) {
      return { ready: false, reason: "Script ID required for voice generation" };
    }
    return { ready: true };
  }

  resolveVoiceProfile(input: VoiceWorkerInput, context: VoiceContext): VoiceProfile | null {
    const raw = input.voiceProfile ?? context.voiceProfile ?? null;
    if (!raw) return null;
    return (VOICE_PROFILES as readonly string[]).includes(raw) ? (raw as VoiceProfile) : null;
  }

  resolveLanguage(input: VoiceWorkerInput, context: VoiceContext): VoiceLanguage | null {
    const raw = input.language ?? context.language ?? null;
    if (!raw) return null;
    return (VOICE_LANGUAGES as readonly string[]).includes(raw) ? (raw as VoiceLanguage) : null;
  }

  resolveTone(input: VoiceWorkerInput, context: VoiceContext): VoiceTone | null {
    const raw = input.tone ?? context.tone ?? null;
    if (!raw) return null;
    return (VOICE_TONES as readonly string[]).includes(raw) ? (raw as VoiceTone) : null;
  }

  resolveEmotionalStyle(
    input: VoiceWorkerInput,
    context: VoiceContext,
  ): EmotionalStyle | null {
    const raw = input.emotionalStyle ?? context.emotionalStyle ?? null;
    if (!raw) return null;
    return (EMOTIONAL_STYLES as readonly string[]).includes(raw)
      ? (raw as EmotionalStyle)
      : null;
  }

  prepareNarrationSegments(context: VoiceContext, seq: number): NarrationSegment[] {
    const sections = context.scriptSections?.length
      ? context.scriptSections
      : null;
    if (sections) {
      return sections.map((section, i) => {
        const text =
          section.body?.trim() ||
          section.heading?.trim() ||
          `Narration segment ${i + 1} for script ${context.scriptId}`;
        const words = text.split(/\s+/).filter(Boolean).length;
        return {
          segmentId: `seg-vow-${seq}-${i + 1}`,
          scriptSectionId: section.sectionId ?? `section-${i + 1}`,
          order: i + 1,
          text,
          estimatedDurationSec: Math.max(2, Math.round((words / 150) * 60)),
          pauseAfterMs: context.pauseControlMs ?? 350,
          pronunciationHints: context.pronunciationControls?.length
            ? [...context.pronunciationControls]
            : [`preserve_proper_nouns_segment_${i + 1}`],
        };
      });
    }
    const sourceText =
      context.narrationReadyText?.trim() ||
      context.narrationText?.trim() ||
      `Approved narration for script ${context.scriptId}`;
    const chunks = splitNarration(sourceText);
    return chunks.map((text, i) => {
      const words = text.split(/\s+/).filter(Boolean).length;
      return {
        segmentId: `seg-vow-${seq}-${i + 1}`,
        order: i + 1,
        text,
        estimatedDurationSec: Math.max(2, Math.round((words / 150) * 60)),
        pauseAfterMs: context.pauseControlMs ?? 350,
        pronunciationHints: context.pronunciationControls?.length
          ? [...context.pronunciationControls]
          : [`preserve_proper_nouns_segment_${i + 1}`],
      };
    });
  }

  configureVoiceGenerationSettings(
    context: VoiceContext,
    config: VoiceWorkerConfiguration,
    seq: number,
  ): VoiceGenerationSettings {
    const voiceProfile =
      context.voiceProfile ?? (config.defaultVoiceProfile as VoiceProfile);
    const language = context.language ?? (config.defaultLanguage as VoiceLanguage);
    const speakingSpeed = context.speakingSpeed ?? config.defaultSpeakingSpeed;
    const tone = context.tone ?? "neutral";
    const emotionalStyle = context.emotionalStyle ?? "calm";
    const pauseControlMs = context.pauseControlMs ?? 350;
    const pronunciationControls = context.pronunciationControls?.length
      ? [...context.pronunciationControls]
      : ["ipa_fallback_enabled", "brand_name_lock"];
    return {
      settingsId: `vow-set-${seq}`,
      voiceProfile,
      language,
      speakingSpeed,
      tone,
      emotionalStyle,
      pauseControlMs,
      pronunciationControls,
      exportFormat: "structural_ref",
    };
  }

  recordConfigurationHistory(
    settings: VoiceGenerationSettings,
    existing: VoiceConfigHistoryEntry[] = [],
  ): VoiceConfigHistoryEntry[] {
    return [
      ...existing,
      {
        settingsId: settings.settingsId,
        recordedAt: new Date().toISOString(),
        voiceProfile: settings.voiceProfile,
        language: settings.language,
        speakingSpeed: settings.speakingSpeed,
        tone: settings.tone,
        emotionalStyle: settings.emotionalStyle,
      },
    ];
  }

  generateVoiceoverAssets(
    segments: NarrationSegment[],
    settings: VoiceGenerationSettings,
    seq: number,
  ): VoiceAssetRef[] {
    return segments.map((segment, i) => ({
      assetId: `gen-vow-${seq}-audio-${i + 1}`,
      assetPath: `assets/voice/vow-${seq}-audio-${i + 1}.descriptor.json`,
      segmentId: segment.segmentId,
      voiceProfile: settings.voiceProfile,
      language: settings.language,
      durationSec: segment.estimatedDurationSec,
      descriptor: `Voiceover asset for segment ${segment.order} — structural signal only, exportable audio reference`,
      exportable: true as const,
    }));
  }

  generateAlternateVoiceVersions(
    assets: VoiceAssetRef[],
    settings: VoiceGenerationSettings,
    seq: number,
  ): VoiceVariant[] {
    const altProfiles: VoiceProfile[] = ["narrator_warm", "presenter_authoritative", "storyteller_expressive"];
    const variants: VoiceVariant[] = [];
    for (let i = 0; i < Math.min(assets.length, 2); i++) {
      const base = assets[i];
      if (!base) continue;
      const altProfile = altProfiles[i % altProfiles.length] ?? "narrator_warm";
      variants.push({
        variantId: `vow-var-${seq}-${i + 1}a`,
        variantLabel: "A",
        voiceProfile: settings.voiceProfile,
        language: settings.language,
        assetId: base.assetId,
        assetPath: base.assetPath,
        descriptor: `${base.descriptor} — primary voice variant`,
      });
      variants.push({
        variantId: `vow-var-${seq}-${i + 1}b`,
        variantLabel: "B",
        voiceProfile: altProfile,
        language: settings.language,
        assetId: `${base.assetId}-alt`,
        assetPath: base.assetPath.replace(".descriptor.json", "-alt.descriptor.json"),
        descriptor: `${base.descriptor} — alternate profile ${altProfile}`,
      });
    }
    if (variants.length < 2 && assets[0]) {
      variants.push({
        variantId: `vow-var-${seq}-1a`,
        variantLabel: "A",
        voiceProfile: settings.voiceProfile,
        language: settings.language,
        assetId: assets[0].assetId,
        assetPath: assets[0].assetPath,
        descriptor: `${assets[0].descriptor} — primary`,
      });
      variants.push({
        variantId: `vow-var-${seq}-1b`,
        variantLabel: "B",
        voiceProfile: "narrator_warm",
        language: settings.language,
        assetId: `${assets[0].assetId}-alt`,
        assetPath: assets[0].assetPath.replace(".descriptor.json", "-alt.descriptor.json"),
        descriptor: `${assets[0].descriptor} — warm alternate`,
      });
    }
    return variants;
  }

  validateVoiceQuality(
    assets: VoiceAssetRef[],
    segments: NarrationSegment[],
    settings: VoiceGenerationSettings,
  ): { qualityStatus: QualityStatus; qualityNotes: string; confidenceScore: number } {
    if (!assets.length || !segments.length) {
      return {
        qualityStatus: "fail",
        qualityNotes: "No voice assets or narration segments produced",
        confidenceScore: 0,
      };
    }
    const notes: string[] = [];
    let confidence = 88;
    if (settings.speakingSpeed < 0.7 || settings.speakingSpeed > 1.4) {
      notes.push("Speaking speed outside preferred 0.7–1.4 range");
      confidence -= 8;
    }
    if (settings.pronunciationControls.length) {
      notes.push(`${settings.pronunciationControls.length} pronunciation control(s) applied`);
      confidence += 3;
    }
    if (assets.every((a) => a.exportable)) {
      notes.push("All voice assets marked exportable");
      confidence += 2;
    }
    if (segments.length >= 2) {
      notes.push("Multi-segment narration prepared with pause control");
      confidence += 2;
    }
    confidence = Math.max(0, Math.min(100, confidence));
    return {
      qualityStatus: notes.length ? "pass_with_notes" : "pass",
      qualityNotes: notes.length
        ? notes.join("; ")
        : "Voice assets pass quality validation",
      confidenceScore: confidence,
    };
  }

  buildVoiceReport(
    input: VoiceWorkerInput,
    config: VoiceWorkerConfiguration,
    context: VoiceContext,
    options: {
      narrationSegments?: NarrationSegment[];
      voiceGenerationSettings?: VoiceGenerationSettings;
      voiceAssetReferences?: VoiceAssetRef[];
      includeVariants?: boolean;
    } = {},
  ): VoiceReport {
    voiceSequence += 1;
    const seq = voiceSequence;
    const now = new Date().toISOString();
    const scriptId = context.scriptId?.trim() || input.scriptId?.trim() || `scw-scr-vow-${seq}`;
    const voiceReportId = input.voiceReportId?.trim() || `vow-rpt-${Date.now()}-${seq}`;
    const channelId = context.channelId?.trim() || input.channelId?.trim() || `chn-vow-${seq}`;
    const segments =
      options.narrationSegments ??
      (context.narrationSegments?.length
        ? context.narrationSegments
        : this.prepareNarrationSegments(context, seq));
    const settings =
      options.voiceGenerationSettings ??
      context.voiceGenerationSettings ??
      this.configureVoiceGenerationSettings(context, config, seq);
    const configurationHistory = this.recordConfigurationHistory(
      settings,
      context.configurationHistory,
    );
    const assets =
      options.voiceAssetReferences ??
      (context.voiceAssetReferences?.length
        ? context.voiceAssetReferences
        : this.generateVoiceoverAssets(segments, settings, seq));
    const variants =
      options.includeVariants === false
        ? []
        : this.generateAlternateVoiceVersions(assets, settings, seq);
    const { qualityStatus, qualityNotes, confidenceScore } = this.validateVoiceQuality(
      assets,
      segments,
      settings,
    );
    const traceabilityRefs = unique([
      `script:${scriptId}`,
      `channel:${channelId}`,
      context.topicId ? `topic:${context.topicId}` : null,
      `voiceProfile:${settings.voiceProfile}`,
      `language:${settings.language}`,
      `settings:${settings.settingsId}`,
      ...segments.map((s) => `segment:${s.segmentId}`),
      ...assets.map((a) => `voiceAsset:${a.assetId}`),
    ]);
    const preservedDecisions = [
      {
        decisionId: `vow-dec-${seq}-script`,
        topic: scriptId,
        decision: "Preserved approved script without rewrite — structural narration only",
        recordedAt: now,
      },
      {
        decisionId: `vow-dec-${seq}-voice`,
        topic: settings.voiceProfile,
        decision: `Configured ${settings.language} voice with ${variants.length} alternate versions`,
        recordedAt: now,
      },
    ];
    return {
      voiceReportId,
      timestamp: now,
      scriptId,
      voiceProfile: settings.voiceProfile,
      language: settings.language,
      narrationSegments: segments,
      voiceGenerationSettings: settings,
      voiceAssetReferences: assets,
      qualityStatus,
      variantCount: options.includeVariants === false ? assets.length : variants.length,
      confidenceScore,
      metadataVersion: VOW_METADATA_VERSION,
      channelId,
      topicId: context.topicId ?? null,
      variants,
      configurationHistory,
      qualityNotes,
      workerId: config.workerId,
      reportVersion: VOW_REPORT_VERSION,
      traceabilityRefs,
      preservedDecisions,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverRewriteScripts: true,
      neverAssembleVideos: true,
      neverPublishMedia: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ411OrLater: true,
      preserveScriptTraceability: true,
      preserveGeneratedVoiceAssetReferences: true,
      preserveVoiceConfigurationHistory: true,
      validateOutputQuality: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}

let voiceSequence = 0;

export function resetVoiceSequenceForTesting() {
  voiceSequence = 0;
}

function splitNarration(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length >= 2) return sentences.slice(0, 6);
  if (text.length <= 180) return [text];
  const mid = Math.floor(text.length / 2);
  const splitAt = text.lastIndexOf(" ", mid);
  const cut = splitAt > 40 ? splitAt : mid;
  return [text.slice(0, cut).trim(), text.slice(cut).trim()].filter(Boolean);
}

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function cloneReport(report: VoiceReport): VoiceReport {
  return {
    ...report,
    narrationSegments: report.narrationSegments.map((s) => ({
      ...s,
      pronunciationHints: [...s.pronunciationHints],
    })),
    voiceGenerationSettings: {
      ...report.voiceGenerationSettings,
      pronunciationControls: [...report.voiceGenerationSettings.pronunciationControls],
    },
    voiceAssetReferences: report.voiceAssetReferences.map((a) => ({ ...a })),
    variants: report.variants.map((v) => ({ ...v })),
    configurationHistory: report.configurationHistory.map((c) => ({ ...c })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
