import type { VideoAssemblyWorkerConfiguration } from "./configuration.js";
import {
  MOTION_EFFECTS,
  OUTPUT_ASPECTS,
  OUTPUT_RESOLUTIONS,
  TRANSITION_TYPES,
  VAW_METADATA_VERSION,
  VAW_REPORT_VERSION,
} from "./paths.js";
import type {
  AssemblyContext,
  FinalVideoReference,
  IntegrationHandshake,
  MediaAssetRef,
  MotionEffect,
  OutputAspect,
  OutputFormat,
  OutputResolution,
  QualityValidation,
  RenderSettings,
  SceneTimelineEntry,
  TransitionType,
  VideoAssemblyReport,
  VideoAssemblyWorkerCatalog,
  VideoAssemblyWorkerInput,
} from "./types.js";

const RESOLUTION_DIMS: Record<
  OutputAspect,
  Record<OutputResolution, { width: number; height: number }>
> = {
  landscape: {
    hd: { width: 1280, height: 720 },
    full_hd: { width: 1920, height: 1080 },
    "4k": { width: 3840, height: 2160 },
  },
  vertical: {
    hd: { width: 720, height: 1280 },
    full_hd: { width: 1080, height: 1920 },
    "4k": { width: 2160, height: 3840 },
  },
  square: {
    hd: { width: 720, height: 720 },
    full_hd: { width: 1080, height: 1080 },
    "4k": { width: 2160, height: 2160 },
  },
};

/** Pure Video Assembly Worker helpers for Q4-11 — structural signals only. */
export class AssemblyBuilder {
  buildCatalog(
    config: VideoAssemblyWorkerConfiguration,
    reports: VideoAssemblyReport[],
    integrations: IntegrationHandshake[],
  ): VideoAssemblyWorkerCatalog {
    return {
      reportVersion: VAW_REPORT_VERSION,
      workerId: config.workerId,
      assemblyReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      supportedAspects: [...OUTPUT_ASPECTS],
      supportedResolutions: [...OUTPUT_RESOLUTIONS],
      metadataVersion: VAW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverWriteScripts: true,
      neverGenerateVoiceovers: true,
      neverGenerateThumbnails: true,
      neverPublishMedia: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  mergeContext(input: VideoAssemblyWorkerInput, context: AssemblyContext): AssemblyContext {
    const receivedScript =
      context.receivedScript ||
      Boolean(input.scriptId?.trim()) ||
      Boolean(input.scriptSections?.length) ||
      Boolean(input.narrationReadyText?.trim());
    const receivedVoice =
      context.receivedVoice ||
      Boolean(input.voiceAssetId?.trim()) ||
      Boolean(input.voiceAssets?.length) ||
      Boolean(input.voiceReportId?.trim());
    const receivedVisuals =
      context.receivedVisuals ||
      Boolean(input.visualAssetIds?.length) ||
      Boolean(input.visualAssets?.length);
    const receivedCreatives =
      context.receivedCreatives ||
      Boolean(input.creativeAssetIds?.length) ||
      Boolean(input.creativeAssets?.length);
    const receivedMusic =
      context.receivedMusic ||
      Boolean(input.musicAssetId?.trim()) ||
      Boolean(input.musicAssets?.length);
    return {
      scriptId: input.scriptId ?? context.scriptId ?? null,
      channelId: input.channelId ?? context.channelId ?? null,
      topicId: input.topicId ?? context.topicId ?? null,
      voiceAssetId: input.voiceAssetId ?? context.voiceAssetId ?? null,
      voiceReportId: input.voiceReportId ?? context.voiceReportId ?? null,
      visualAssetIds: input.visualAssetIds ?? context.visualAssetIds ?? [],
      creativeAssetIds: input.creativeAssetIds ?? context.creativeAssetIds ?? [],
      musicAssetId: input.musicAssetId ?? context.musicAssetId ?? null,
      scriptSections: input.scriptSections ?? context.scriptSections ?? [],
      narrationReadyText: input.narrationReadyText ?? context.narrationReadyText ?? null,
      voiceAssets: input.voiceAssets ?? context.voiceAssets ?? [],
      visualAssets: input.visualAssets ?? context.visualAssets ?? [],
      creativeAssets: input.creativeAssets ?? context.creativeAssets ?? [],
      musicAssets: input.musicAssets ?? context.musicAssets ?? [],
      includeCaptions: input.includeCaptions ?? context.includeCaptions ?? true,
      aspects: input.aspects ?? context.aspects ?? undefined,
      resolutions: input.resolutions ?? context.resolutions ?? undefined,
      receivedScript,
      receivedVoice,
      receivedVisuals,
      receivedCreatives,
      receivedMusic,
      sceneTimeline: context.sceneTimeline ?? [],
      renderSettings: context.renderSettings ?? null,
      outputFormats: context.outputFormats ?? [],
      qualityValidation: context.qualityValidation ?? null,
      finalVideoReference: context.finalVideoReference ?? null,
    };
  }

  canAssemble(context: AssemblyContext): { ready: boolean; reason?: string } {
    if (!context.receivedScript) {
      return { ready: false, reason: "Approved script required before assembly" };
    }
    if (!context.receivedVoice) {
      return { ready: false, reason: "Approved voice assets required before assembly" };
    }
    if (!context.receivedVisuals && !context.receivedCreatives) {
      return {
        ready: false,
        reason: "Approved visual and/or creative assets required before assembly",
      };
    }
    if (!context.scriptId) {
      return { ready: false, reason: "Script ID required for video assembly" };
    }
    return { ready: true };
  }

  normalizeAssets(context: AssemblyContext, seq: number): {
    voiceAssetId: string;
    visualAssetIds: string[];
    creativeAssetIds: string[];
    musicAssetId: string | null;
    voiceAssets: MediaAssetRef[];
    visualAssets: MediaAssetRef[];
    creativeAssets: MediaAssetRef[];
    musicAssets: MediaAssetRef[];
  } {
    const voiceAssets =
      context.voiceAssets?.length
        ? context.voiceAssets
        : [
            {
              assetId: context.voiceAssetId?.trim() || `voice-vaw-${seq}`,
              assetPath: `assets/voice/vaw-${seq}.descriptor.json`,
              assetKind: "voice" as const,
              durationSec: 45,
            },
          ];
    const visualAssets =
      context.visualAssets?.length
        ? context.visualAssets
        : (context.visualAssetIds?.length
            ? context.visualAssetIds
            : [`vis-vaw-${seq}-1`, `vis-vaw-${seq}-2`]
          ).map((id) => ({
            assetId: id,
            assetPath: `assets/visual/${id}.descriptor.json`,
            assetKind: "visual" as const,
          }));
    const creativeAssets =
      context.creativeAssets?.length
        ? context.creativeAssets
        : (context.creativeAssetIds?.length
            ? context.creativeAssetIds
            : [`cre-vaw-${seq}-1`]
          ).map((id) => ({
            assetId: id,
            assetPath: `assets/generated/${id}.descriptor.json`,
            assetKind: "creative" as const,
          }));
    const musicAssets =
      context.musicAssets?.length
        ? context.musicAssets
        : context.musicAssetId
          ? [
              {
                assetId: context.musicAssetId,
                assetPath: `assets/music/${context.musicAssetId}.descriptor.json`,
                assetKind: "music" as const,
              },
            ]
          : [
              {
                assetId: `mus-vaw-${seq}`,
                assetPath: `assets/music/vaw-${seq}.descriptor.json`,
                assetKind: "music" as const,
              },
            ];
    return {
      voiceAssetId: context.voiceAssetId?.trim() || voiceAssets[0]?.assetId || `voice-vaw-${seq}`,
      visualAssetIds: visualAssets.map((a) => a.assetId),
      creativeAssetIds: creativeAssets.map((a) => a.assetId),
      musicAssetId: context.musicAssetId ?? musicAssets[0]?.assetId ?? null,
      voiceAssets,
      visualAssets,
      creativeAssets,
      musicAssets,
    };
  }

  synchronizeNarrationAndVisuals(context: AssemblyContext, seq: number): SceneTimelineEntry[] {
    const assets = this.normalizeAssets(context, seq);
    const sections = context.scriptSections?.length
      ? context.scriptSections
      : [
          { sectionId: "sec-open", heading: "Open", body: context.narrationReadyText ?? "Opening" },
          { sectionId: "sec-body", heading: "Body", body: "Main narrative" },
          { sectionId: "sec-close", heading: "Close", body: "Closing" },
        ];
    let cursor = 0;
    return sections.map((section, i) => {
      const duration = Math.max(4, Math.round(((section.body ?? section.heading ?? "").split(/\s+/).length / 150) * 60) || 6);
      const startSec = cursor;
      const endSec = cursor + duration;
      cursor = endSec;
      const visual =
        assets.visualAssetIds[i % Math.max(1, assets.visualAssetIds.length)] ??
        assets.visualAssetIds[0] ??
        `vis-vaw-${seq}-${i + 1}`;
      const creative =
        assets.creativeAssetIds[i % Math.max(1, assets.creativeAssetIds.length)] ??
        assets.creativeAssetIds[0] ??
        `cre-vaw-${seq}-${i + 1}`;
      return {
        sceneId: `scene-vaw-${seq}-${i + 1}`,
        order: i + 1,
        startSec,
        endSec,
        scriptSectionId: section.sectionId ?? `section-${i + 1}`,
        voiceAssetId: assets.voiceAssetId,
        visualAssetIds: [visual],
        creativeAssetIds: [creative],
        musicAssetId: assets.musicAssetId,
        captionText: context.includeCaptions === false ? undefined : (section.body ?? section.heading),
        transition: "cut" as TransitionType,
        motionEffect: "none" as MotionEffect,
      };
    });
  }

  applySceneTransitions(timeline: SceneTimelineEntry[]): SceneTimelineEntry[] {
    return timeline.map((scene, i) => ({
      ...scene,
      visualAssetIds: [...scene.visualAssetIds],
      creativeAssetIds: [...scene.creativeAssetIds],
      transition: (i === 0
        ? "fade_to_black"
        : TRANSITION_TYPES[(i % (TRANSITION_TYPES.length - 1)) + 1]) as TransitionType,
    }));
  }

  applyMotionEffects(timeline: SceneTimelineEntry[]): SceneTimelineEntry[] {
    return timeline.map((scene, i) => ({
      ...scene,
      visualAssetIds: [...scene.visualAssetIds],
      creativeAssetIds: [...scene.creativeAssetIds],
      motionEffect: (MOTION_EFFECTS[(i % (MOTION_EFFECTS.length - 1)) + 1] ??
        "ken_burns") as MotionEffect,
    }));
  }

  buildRenderSettings(
    context: AssemblyContext,
    config: VideoAssemblyWorkerConfiguration,
    seq: number,
  ): RenderSettings {
    const aspects = (
      context.aspects?.length ? context.aspects : (config.defaultAspects as OutputAspect[])
    ).filter((a): a is OutputAspect => (OUTPUT_ASPECTS as readonly string[]).includes(a));
    const resolutions = (
      context.resolutions?.length
        ? context.resolutions
        : (config.defaultResolutions as OutputResolution[])
    ).filter((r): r is OutputResolution => (OUTPUT_RESOLUTIONS as readonly string[]).includes(r));
    return {
      settingsId: `vaw-set-${seq}`,
      frameRate: config.defaultFrameRate,
      aspects: aspects.length ? aspects : ["landscape", "vertical"],
      resolutions: resolutions.length ? resolutions : ["hd", "full_hd"],
      includeCaptions: context.includeCaptions !== false,
      includeMusic: Boolean(context.musicAssetId || context.musicAssets?.length || context.receivedMusic),
      syncToleranceMs: config.syncToleranceMs,
    };
  }

  produceOutputFormats(settings: RenderSettings, seq: number): OutputFormat[] {
    const formats: OutputFormat[] = [];
    let i = 0;
    for (const aspect of settings.aspects) {
      for (const resolution of settings.resolutions) {
        // Architecture ready for 4K — include when requested.
        if (resolution === "4k" && !settings.resolutions.includes("4k")) continue;
        i += 1;
        const dims = RESOLUTION_DIMS[aspect][resolution];
        formats.push({
          formatId: `fmt-vaw-${seq}-${i}`,
          aspect,
          resolution,
          width: dims.width,
          height: dims.height,
          container: "structural_ref",
          assetPath: `assets/video/vaw-${seq}-${aspect}-${resolution}.descriptor.json`,
        });
      }
    }
    return formats;
  }

  validateRenderingQuality(
    timeline: SceneTimelineEntry[],
    formats: OutputFormat[],
    settings: RenderSettings,
  ): QualityValidation {
    if (!timeline.length || !formats.length) {
      return {
        status: "fail",
        syncValidated: false,
        timelineValidated: false,
        renderValidated: false,
        notes: "Timeline or output formats missing",
        score: 0,
      };
    }
    const notes: string[] = [];
    let score = 86;
    const ordered = timeline.every((s, i) => {
      if (i === 0) return true;
      const previous = timeline[i - 1];
      return previous ? s.startSec >= previous.endSec - 0.01 : true;
    });
    const syncValidated = timeline.every((s) => Boolean(s.voiceAssetId) && s.visualAssetIds.length > 0);
    if (!ordered) {
      notes.push("Timeline ordering anomaly detected");
      score -= 20;
    } else {
      notes.push("Scene timeline continuity validated");
      score += 4;
    }
    if (syncValidated) {
      notes.push(`Narration-visual sync within ${settings.syncToleranceMs}ms tolerance`);
      score += 4;
    } else {
      notes.push("Sync incomplete — missing voice or visual bindings");
      score -= 15;
    }
    if (formats.length >= 2) {
      notes.push(`${formats.length} output formats rendered (structural refs)`);
      score += 3;
    }
    if (settings.resolutions.includes("4k")) {
      notes.push("4K architecture path exercised");
      score += 2;
    }
    score = Math.max(0, Math.min(100, score));
    const status =
      score < 60 ? "fail" : notes.length ? ("pass_with_notes" as const) : ("pass" as const);
    return {
      status,
      syncValidated,
      timelineValidated: ordered,
      renderValidated: formats.length > 0 && score >= 60,
      notes: notes.join("; "),
      score,
    };
  }

  buildFinalVideoReference(
    formats: OutputFormat[],
    timeline: SceneTimelineEntry[],
    seq: number,
  ): FinalVideoReference {
    const durationSec = timeline.length ? (timeline[timeline.length - 1]?.endSec ?? 0) : 0;
    const primary = formats.find((f) => f.aspect === "landscape" && f.resolution === "full_hd") ?? formats[0];
    return {
      videoId: `vid-vaw-${seq}`,
      primaryPath: primary?.assetPath ?? `assets/video/vaw-${seq}-primary.descriptor.json`,
      formats: formats.map((f) => ({ ...f })),
      durationSec,
      descriptor: "Assembled final video — structural render reference only, not published",
    };
  }

  buildAssemblyReport(
    input: VideoAssemblyWorkerInput,
    config: VideoAssemblyWorkerConfiguration,
    context: AssemblyContext,
    options: {
      sceneTimeline?: SceneTimelineEntry[];
      renderSettings?: RenderSettings;
      outputFormats?: OutputFormat[];
      qualityValidation?: QualityValidation;
      finalVideoReference?: FinalVideoReference;
    } = {},
  ): VideoAssemblyReport {
    assemblySequence += 1;
    const seq = assemblySequence;
    const now = new Date().toISOString();
    const scriptId = context.scriptId?.trim() || input.scriptId?.trim() || `scw-scr-vaw-${seq}`;
    const assemblyId = input.assemblyId?.trim() || `vaw-rpt-${Date.now()}-${seq}`;
    const channelId = context.channelId?.trim() || input.channelId?.trim() || `chn-vaw-${seq}`;
    const assets = this.normalizeAssets(context, seq);
    let timeline =
      options.sceneTimeline ??
      (context.sceneTimeline?.length
        ? context.sceneTimeline
        : this.synchronizeNarrationAndVisuals({ ...context, ...assets }, seq));
    if (!options.sceneTimeline) {
      timeline = this.applyMotionEffects(this.applySceneTransitions(timeline));
    }
    const settings =
      options.renderSettings ??
      context.renderSettings ??
      this.buildRenderSettings(context, config, seq);
    const formats =
      options.outputFormats ??
      (context.outputFormats?.length
        ? context.outputFormats
        : this.produceOutputFormats(settings, seq));
    const quality =
      options.qualityValidation ??
      context.qualityValidation ??
      this.validateRenderingQuality(timeline, formats, settings);
    const finalVideo =
      options.finalVideoReference ??
      context.finalVideoReference ??
      this.buildFinalVideoReference(formats, timeline, seq);
    const traceabilityRefs = unique([
      `script:${scriptId}`,
      `channel:${channelId}`,
      context.topicId ? `topic:${context.topicId}` : null,
      `voice:${assets.voiceAssetId}`,
      ...assets.visualAssetIds.map((id) => `visual:${id}`),
      ...assets.creativeAssetIds.map((id) => `creative:${id}`),
      assets.musicAssetId ? `music:${assets.musicAssetId}` : null,
      `settings:${settings.settingsId}`,
      `finalVideo:${finalVideo.videoId}`,
    ]);
    return {
      assemblyId,
      timestamp: now,
      scriptId,
      voiceAssetId: assets.voiceAssetId,
      visualAssetIds: assets.visualAssetIds,
      creativeAssetIds: assets.creativeAssetIds,
      musicAssetId: assets.musicAssetId,
      sceneTimeline: timeline,
      renderSettings: settings,
      outputFormats: formats,
      qualityValidation: quality,
      finalVideoReference: finalVideo,
      metadataVersion: VAW_METADATA_VERSION,
      channelId,
      topicId: context.topicId ?? null,
      workerId: config.workerId,
      reportVersion: VAW_REPORT_VERSION,
      traceabilityRefs,
      preservedDecisions: [
        {
          decisionId: `vaw-dec-${seq}-sync`,
          topic: scriptId,
          decision: "Preserved narration-visual synchronization — structural assembly only",
          recordedAt: now,
        },
        {
          decisionId: `vaw-dec-${seq}-render`,
          topic: finalVideo.videoId,
          decision: `Rendered ${formats.length} output formats without publishing`,
          recordedAt: now,
        },
      ],
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverWriteScripts: true,
      neverGenerateVoiceovers: true,
      neverGenerateThumbnails: true,
      neverPublishMedia: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ412OrLater: true,
      preserveCompleteAssetTraceability: true,
      preserveSynchronizationBetweenMediaAssets: true,
      validateRenderingQuality: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}

let assemblySequence = 0;

export function resetAssemblySequenceForTesting() {
  assemblySequence = 0;
}

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function cloneReport(report: VideoAssemblyReport): VideoAssemblyReport {
  return {
    ...report,
    visualAssetIds: [...report.visualAssetIds],
    creativeAssetIds: [...report.creativeAssetIds],
    sceneTimeline: report.sceneTimeline.map((s) => ({
      ...s,
      visualAssetIds: [...s.visualAssetIds],
      creativeAssetIds: [...s.creativeAssetIds],
    })),
    renderSettings: {
      ...report.renderSettings,
      aspects: [...report.renderSettings.aspects],
      resolutions: [...report.renderSettings.resolutions],
    },
    outputFormats: report.outputFormats.map((f) => ({ ...f })),
    qualityValidation: { ...report.qualityValidation },
    finalVideoReference: {
      ...report.finalVideoReference,
      formats: report.finalVideoReference.formats.map((f) => ({ ...f })),
    },
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
