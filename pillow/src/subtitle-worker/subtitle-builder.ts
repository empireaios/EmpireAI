import type { SubtitleWorkerConfiguration } from "./configuration.js";
import {
  EXPORT_FORMATS,
  STW_METADATA_VERSION,
  STW_REPORT_VERSION,
  SUBTITLE_LANGUAGES,
} from "./paths.js";
import type {
  CaptionCue,
  ExportableSubtitleFile,
  ExportFormat,
  IntegrationHandshake,
  QualityValidation,
  SubtitleContext,
  SubtitleLanguage,
  SubtitleReport,
  SubtitleWorkerCatalog,
  SubtitleWorkerInput,
  SyncIssue,
  TimingAccuracy,
  TranscriptHistoryEntry,
} from "./types.js";

/** Pure Subtitle Worker helpers for Q4-12 — structural signals only. */
export class SubtitleBuilder {
  buildCatalog(
    config: SubtitleWorkerConfiguration,
    reports: SubtitleReport[],
    integrations: IntegrationHandshake[],
  ): SubtitleWorkerCatalog {
    return {
      reportVersion: STW_REPORT_VERSION,
      workerId: config.workerId,
      subtitleReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      supportedLanguages: [...SUBTITLE_LANGUAGES],
      supportedExportFormats: [...EXPORT_FORMATS],
      metadataVersion: STW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverRewriteScripts: true,
      neverAssembleVideos: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  mergeContext(input: SubtitleWorkerInput, context: SubtitleContext): SubtitleContext {
    const receivedScript =
      context.receivedScript ||
      Boolean(input.scriptId?.trim()) ||
      Boolean(input.scriptSections?.length) ||
      Boolean(input.narrationReadyText?.trim());
    const receivedVoice =
      context.receivedVoice ||
      Boolean(input.voiceAssetId?.trim()) ||
      Boolean(input.voiceReportId?.trim()) ||
      input.voiceDurationSec != null;
    return {
      scriptId: input.scriptId ?? context.scriptId ?? null,
      videoId: input.videoId ?? context.videoId ?? null,
      channelId: input.channelId ?? context.channelId ?? null,
      voiceAssetId: input.voiceAssetId ?? context.voiceAssetId ?? null,
      voiceReportId: input.voiceReportId ?? context.voiceReportId ?? null,
      assemblyId: input.assemblyId ?? context.assemblyId ?? null,
      subtitleLanguage:
        this.resolveLanguage(input.subtitleLanguage) ?? context.subtitleLanguage ?? null,
      languages: this.resolveLanguages(input.languages, context),
      narrationReadyText: input.narrationReadyText ?? context.narrationReadyText ?? null,
      scriptSections: input.scriptSections ?? context.scriptSections ?? [],
      voiceDurationSec: input.voiceDurationSec ?? context.voiceDurationSec ?? null,
      receivedScript,
      receivedVoice,
      transcript: context.transcript ?? null,
      captionTimeline: context.captionTimeline ?? [],
      timingAccuracy: context.timingAccuracy ?? null,
      syncIssues: context.syncIssues ?? [],
      exportFormats: context.exportFormats ?? [],
      transcriptHistory: context.transcriptHistory ?? [],
    };
  }

  canGenerate(context: SubtitleContext): { ready: boolean; reason?: string } {
    if (!context.receivedScript) {
      return { ready: false, reason: "Approved script required before subtitle generation" };
    }
    if (!context.scriptId) {
      return { ready: false, reason: "Script ID required for subtitle generation" };
    }
    return { ready: true };
  }

  resolveLanguage(raw: string | null | undefined): SubtitleLanguage | null {
    if (!raw) return null;
    return (SUBTITLE_LANGUAGES as readonly string[]).includes(raw)
      ? (raw as SubtitleLanguage)
      : null;
  }

  resolveLanguages(
    inputLanguages: SubtitleLanguage[] | null | undefined,
    context: SubtitleContext,
  ): SubtitleLanguage[] {
    const fromInput = (inputLanguages ?? [])
      .map((l) => this.resolveLanguage(l))
      .filter((l): l is SubtitleLanguage => Boolean(l));
    if (fromInput.length) return uniqueLang(fromInput);
    if (context.languages?.length) return [...context.languages];
    const primary = context.subtitleLanguage;
    return primary ? [primary] : [];
  }

  generateCompleteTranscript(context: SubtitleContext): string {
    if (context.scriptSections?.length) {
      return context.scriptSections
        .map((s) => s.body?.trim() || s.heading?.trim() || "")
        .filter(Boolean)
        .join(" ");
    }
    return (
      context.narrationReadyText?.trim() ||
      `Approved narration transcript for script ${context.scriptId}`
    );
  }

  generateSynchronizedCaptions(
    context: SubtitleContext,
    transcript: string,
    language: SubtitleLanguage,
    seq: number,
  ): CaptionCue[] {
    const segments = context.scriptSections?.length
      ? context.scriptSections.map(
          (s) => s.body?.trim() || s.heading?.trim() || `Segment for ${context.scriptId}`,
        )
      : splitTranscript(transcript);
    const totalDurationMs = Math.max(
      3000,
      Math.round((context.voiceDurationSec ?? estimateDurationSec(segments)) * 1000),
    );
    const slice = Math.floor(totalDurationMs / segments.length);
    let cursor = 0;
    return segments.map((text, i) => {
      const startMs = cursor;
      const endMs = i === segments.length - 1 ? totalDurationMs : cursor + slice;
      cursor = endMs;
      return {
        cueId: `cue-stw-${seq}-${i + 1}`,
        order: i + 1,
        startMs,
        endMs,
        text,
        language,
      };
    });
  }

  generateSubtitleTiming(cues: CaptionCue[]): CaptionCue[] {
    return cues.map((cue, i) => {
      const next = cues[i + 1];
      const minGap = 40;
      let endMs = cue.endMs;
      if (next && endMs > next.startMs - minGap) {
        endMs = Math.max(cue.startMs + 200, next.startMs - minGap);
      }
      return { ...cue, endMs };
    });
  }

  validateTimingAccuracy(
    cues: CaptionCue[],
    config: SubtitleWorkerConfiguration,
  ): TimingAccuracy {
    if (!cues.length) {
      return {
        accuracyScore: 0,
        averageDriftMs: 0,
        maxDriftMs: 0,
        withinTolerance: false,
        notes: "No caption cues to validate",
      };
    }
    const drifts: number[] = [];
    for (let i = 1; i < cues.length; i++) {
      const current = cues[i];
      const previous = cues[i - 1];
      if (!current || !previous) continue;
      drifts.push(Math.max(0, current.startMs - previous.endMs));
    }
    const averageDriftMs = drifts.length
      ? Math.round(drifts.reduce((a, b) => a + b, 0) / drifts.length)
      : 0;
    const maxDriftMs = drifts.length ? Math.max(...drifts) : 0;
    const overlaps = cues.some((c, i) => {
      if (i === 0) return false;
      const previous = cues[i - 1];
      return Boolean(previous && c.startMs < previous.endMs);
    });
    const withinTolerance = !overlaps && maxDriftMs <= config.timingToleranceMs * 2;
    const accuracyScore = Math.max(
      0,
      Math.min(100, 96 - (overlaps ? 25 : 0) - Math.min(20, Math.floor(maxDriftMs / 20))),
    );
    return {
      accuracyScore,
      averageDriftMs,
      maxDriftMs,
      withinTolerance,
      notes: withinTolerance
        ? `Timing within ${config.timingToleranceMs}ms operational tolerance`
        : "Timing drift or overlap detected",
    };
  }

  detectSynchronizationIssues(cues: CaptionCue[], accuracy: TimingAccuracy): SyncIssue[] {
    const issues: SyncIssue[] = [];
    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      if (!cue) continue;
      if (cue.endMs <= cue.startMs) {
        issues.push({
          issueId: `sync-${cue.cueId}-duration`,
          severity: "error",
          cueId: cue.cueId,
          description: "Cue end precedes or equals start",
        });
      }
      const previous = i > 0 ? cues[i - 1] : undefined;
      if (previous && cue.startMs < previous.endMs) {
        issues.push({
          issueId: `sync-${cue.cueId}-overlap`,
          severity: "warning",
          cueId: cue.cueId,
          description: "Cue overlaps previous caption",
        });
      }
      if (cue.text.trim().length > 84) {
        issues.push({
          issueId: `sync-${cue.cueId}-length`,
          severity: "info",
          cueId: cue.cueId,
          description: "Cue text exceeds preferred reading length",
        });
      }
    }
    if (!accuracy.withinTolerance) {
      issues.push({
        issueId: "sync-timing-tolerance",
        severity: "warning",
        description: accuracy.notes,
      });
    }
    return issues;
  }

  produceExportableSubtitleFiles(
    cues: CaptionCue[],
    transcript: string,
    languages: SubtitleLanguage[],
    seq: number,
  ): ExportableSubtitleFile[] {
    const files: ExportableSubtitleFile[] = [];
    for (const language of languages) {
      for (const format of EXPORT_FORMATS) {
        files.push({
          fileId: `exp-stw-${seq}-${language}-${format}`,
          format: format as ExportFormat,
          language,
          assetPath: `assets/subtitles/stw-${seq}-${language}.${extensionFor(format)}`,
          descriptor: exportDescriptor(format, language, cues.length, transcript.length),
          exportable: true as const,
        });
      }
    }
    return files;
  }

  validateSubtitleQuality(
    transcript: string,
    cues: CaptionCue[],
    accuracy: TimingAccuracy,
    exports: ExportableSubtitleFile[],
    issues: SyncIssue[],
  ): QualityValidation {
    if (!transcript || !cues.length || !exports.length) {
      return {
        status: "fail",
        timingValidated: false,
        syncValidated: false,
        transcriptValidated: false,
        notes: "Transcript, cues, or export files missing",
        score: 0,
      };
    }
    const notes: string[] = [];
    let score = 88;
    const errors = issues.filter((i) => i.severity === "error");
    if (errors.length) {
      notes.push(`${errors.length} sync error(s)`);
      score -= 20;
    }
    if (accuracy.withinTolerance) {
      notes.push("Timing accuracy validated");
      score += 4;
    } else {
      notes.push("Timing accuracy outside preferred tolerance");
      score -= 8;
    }
    if (exports.length >= 3) {
      notes.push(`${exports.length} exportable subtitle files produced`);
      score += 3;
    }
    if (cues.length >= 2) {
      notes.push("Multi-cue caption timeline synchronized");
      score += 2;
    }
    score = Math.max(0, Math.min(100, score));
    return {
      status: score < 60 ? "fail" : notes.length ? "pass_with_notes" : "pass",
      timingValidated: accuracy.withinTolerance && errors.length === 0,
      syncValidated: errors.length === 0,
      transcriptValidated: transcript.length > 0,
      notes: notes.join("; "),
      score,
    };
  }

  buildSubtitleReport(
    input: SubtitleWorkerInput,
    config: SubtitleWorkerConfiguration,
    context: SubtitleContext,
    options: {
      transcript?: string;
      captionTimeline?: CaptionCue[];
      timingAccuracy?: TimingAccuracy;
      syncIssues?: SyncIssue[];
      exportFormats?: ExportableSubtitleFile[];
    } = {},
  ): SubtitleReport {
    subtitleSequence += 1;
    const seq = subtitleSequence;
    const now = new Date().toISOString();
    const scriptId = context.scriptId?.trim() || input.scriptId?.trim() || `scw-scr-stw-${seq}`;
    const subtitleReportId =
      input.subtitleReportId?.trim() || `stw-rpt-${Date.now()}-${seq}`;
    const channelId = context.channelId?.trim() || input.channelId?.trim() || `chn-stw-${seq}`;
    const language =
      context.subtitleLanguage ??
      (config.defaultLanguage as SubtitleLanguage) ??
      "en-US";
    const languages =
      context.languages?.length
        ? context.languages
        : uniqueLang([language, "es-ES", "fr-FR"].filter((l) =>
            (SUBTITLE_LANGUAGES as readonly string[]).includes(l),
          ) as SubtitleLanguage[]);
    const transcript =
      options.transcript ??
      (context.transcript?.length
        ? context.transcript
        : this.generateCompleteTranscript(context));
    let cues =
      options.captionTimeline ??
      (context.captionTimeline?.length
        ? context.captionTimeline
        : this.generateSynchronizedCaptions(context, transcript, language, seq));
    cues = options.captionTimeline
      ? cues
      : this.generateSubtitleTiming(cues);
    const timing =
      options.timingAccuracy ??
      context.timingAccuracy ??
      this.validateTimingAccuracy(cues, config);
    const syncIssues =
      options.syncIssues ??
      (context.syncIssues?.length
        ? context.syncIssues
        : this.detectSynchronizationIssues(cues, timing));
    const exports =
      options.exportFormats ??
      (context.exportFormats?.length
        ? context.exportFormats
        : this.produceExportableSubtitleFiles(cues, transcript, languages, seq));
    const quality = this.validateSubtitleQuality(
      transcript,
      cues,
      timing,
      exports,
      syncIssues,
    );
    const historyEntry: TranscriptHistoryEntry = {
      transcriptId: `tr-stw-${seq}`,
      recordedAt: now,
      language,
      characterCount: transcript.length,
      cueCount: cues.length,
    };
    const transcriptHistory = [...(context.transcriptHistory ?? []), historyEntry];
    const videoId =
      context.videoId?.trim() ||
      input.videoId?.trim() ||
      `vid-stw-${seq}`;
    return {
      subtitleReportId,
      timestamp: now,
      videoId,
      scriptId,
      transcript,
      subtitleLanguage: language,
      captionTimeline: cues,
      timingAccuracy: timing,
      exportFormats: exports,
      qualityValidation: quality,
      metadataVersion: STW_METADATA_VERSION,
      channelId,
      voiceAssetId: context.voiceAssetId ?? null,
      voiceReportId: context.voiceReportId ?? null,
      assemblyId: context.assemblyId ?? null,
      languages,
      syncIssues,
      transcriptHistory,
      workerId: config.workerId,
      reportVersion: STW_REPORT_VERSION,
      traceabilityRefs: unique([
        `script:${scriptId}`,
        `video:${videoId}`,
        `channel:${channelId}`,
        context.voiceAssetId ? `voice:${context.voiceAssetId}` : null,
        context.assemblyId ? `assembly:${context.assemblyId}` : null,
        `language:${language}`,
        ...cues.map((c) => `cue:${c.cueId}`),
        ...exports.map((e) => `export:${e.fileId}`),
      ]),
      preservedDecisions: [
        {
          decisionId: `stw-dec-${seq}-script`,
          topic: scriptId,
          decision: "Preserved approved script without modification — captioning only",
          recordedAt: now,
        },
        {
          decisionId: `stw-dec-${seq}-export`,
          topic: videoId,
          decision: `Exported ${exports.length} subtitle files across ${languages.length} language(s)`,
          recordedAt: now,
        },
      ],
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverRewriteScripts: true,
      neverAssembleVideos: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ413OrLater: true,
      neverModifyApprovedScripts: true,
      preserveScriptTraceability: true,
      preserveSubtitleSynchronization: true,
      preserveTranscriptHistory: true,
      validateSubtitleQuality: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}

let subtitleSequence = 0;

export function resetSubtitleSequenceForTesting() {
  subtitleSequence = 0;
}

function splitTranscript(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length >= 2) return sentences.slice(0, 8);
  if (text.length <= 120) return [text];
  const mid = Math.floor(text.length / 2);
  const splitAt = text.lastIndexOf(" ", mid);
  const cut = splitAt > 40 ? splitAt : mid;
  return [text.slice(0, cut).trim(), text.slice(cut).trim()].filter(Boolean);
}

function estimateDurationSec(segments: string[]): number {
  const words = segments.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(6, Math.round((words / 150) * 60));
}

function extensionFor(format: string): string {
  switch (format) {
    case "srt":
      return "srt.descriptor.json";
    case "vtt":
      return "vtt.descriptor.json";
    case "txt_transcript":
      return "txt.descriptor.json";
    case "caption_timeline":
      return "timeline.descriptor.json";
    default:
      return "descriptor.json";
  }
}

function exportDescriptor(
  format: string,
  language: string,
  cueCount: number,
  transcriptLength: number,
): string {
  switch (format) {
    case "srt":
      return `SRT subtitle set (${language}) — ${cueCount} cues, structural export ref`;
    case "vtt":
      return `VTT caption set (${language}) — ${cueCount} cues, structural export ref`;
    case "txt_transcript":
      return `TXT transcript (${language}) — ${transcriptLength} characters`;
    case "caption_timeline":
      return `Caption timeline (${language}) — ${cueCount} timed cues`;
    default:
      return `Subtitle export (${format}/${language})`;
  }
}

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function uniqueLang(values: SubtitleLanguage[]): SubtitleLanguage[] {
  return [...new Set(values)];
}

function cloneReport(report: SubtitleReport): SubtitleReport {
  return {
    ...report,
    captionTimeline: report.captionTimeline.map((c) => ({ ...c })),
    timingAccuracy: { ...report.timingAccuracy },
    exportFormats: report.exportFormats.map((f) => ({ ...f })),
    qualityValidation: { ...report.qualityValidation },
    languages: [...report.languages],
    syncIssues: report.syncIssues.map((i) => ({ ...i })),
    transcriptHistory: report.transcriptHistory.map((t) => ({ ...t })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
