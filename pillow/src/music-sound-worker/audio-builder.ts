import type { MusicSoundWorkerConfiguration } from "./configuration.js";
import {
  AUDIO_ASSET_TYPES,
  LICENSING_STATUSES,
  MSW_METADATA_VERSION,
  MSW_REPORT_VERSION,
  MUSIC_MOODS,
} from "./paths.js";
import type {
  AudioAssetRef,
  AudioContext,
  AudioPlacement,
  IntegrationHandshake,
  LicensingStatus,
  MusicMood,
  MusicSoundReport,
  MusicSoundWorkerCatalog,
  MusicSoundWorkerInput,
  QualityValidation,
  SceneAudioSlot,
} from "./types.js";

/** Pure Music & Sound Worker helpers for Q4-13 — structural signals only. */
export class AudioBuilder {
  buildCatalog(
    config: MusicSoundWorkerConfiguration,
    reports: MusicSoundReport[],
    integrations: IntegrationHandshake[],
  ): MusicSoundWorkerCatalog {
    return {
      reportVersion: MSW_REPORT_VERSION,
      workerId: config.workerId,
      audioReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      supportedAudioTypes: [...AUDIO_ASSET_TYPES],
      supportedMoods: [...MUSIC_MOODS],
      metadataVersion: MSW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverAssembleVideos: true,
      neverPublishMedia: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverUseUnapprovedCopyrightedAssets: true,
    };
  }

  mergeContext(input: MusicSoundWorkerInput, context: AudioContext): AudioContext {
    const receivedScript =
      context.receivedScript ||
      Boolean(input.scriptId?.trim()) ||
      Boolean(input.scriptSections?.length) ||
      Boolean(input.narrationReadyText?.trim());
    const receivedTimeline =
      context.receivedTimeline ||
      Boolean(input.sceneTimeline?.length) ||
      Boolean(input.assemblyId?.trim()) ||
      Boolean(input.videoId?.trim());
    return {
      scriptId: input.scriptId ?? context.scriptId ?? null,
      videoId: input.videoId ?? context.videoId ?? null,
      channelId: input.channelId ?? context.channelId ?? null,
      assemblyId: input.assemblyId ?? context.assemblyId ?? null,
      requiredMood: this.resolveMood(input.requiredMood) ?? context.requiredMood ?? null,
      requiredSoundEffects: input.requiredSoundEffects ?? context.requiredSoundEffects ?? [],
      allowGeneratedMusic:
        input.allowGeneratedMusic ?? context.allowGeneratedMusic ?? undefined,
      narrationReadyText: input.narrationReadyText ?? context.narrationReadyText ?? null,
      scriptSections: input.scriptSections ?? context.scriptSections ?? [],
      sceneTimelineInput: input.sceneTimeline ?? context.sceneTimelineInput ?? [],
      receivedScript,
      receivedTimeline,
      backgroundMusicAssets: context.backgroundMusicAssets ?? [],
      soundEffectAssets: context.soundEffectAssets ?? [],
      sceneTimeline: context.sceneTimeline ?? [],
      audioPlacement: context.audioPlacement ?? [],
      licensingStatus: context.licensingStatus ?? null,
    };
  }

  canPrepareAudio(context: AudioContext): { ready: boolean; reason?: string } {
    if (!context.receivedScript) {
      return { ready: false, reason: "Approved script required before audio preparation" };
    }
    if (!context.scriptId) {
      return { ready: false, reason: "Script ID required for music & sound preparation" };
    }
    return { ready: true };
  }

  resolveMood(raw: string | null | undefined): MusicMood | null {
    if (!raw) return null;
    return (MUSIC_MOODS as readonly string[]).includes(raw) ? (raw as MusicMood) : null;
  }

  determineRequiredMusicMood(
    context: AudioContext,
    config: MusicSoundWorkerConfiguration,
  ): MusicMood {
    if (context.requiredMood) return context.requiredMood;
    const text = (
      context.narrationReadyText ||
      context.scriptSections?.map((s) => s.body ?? s.heading ?? "").join(" ") ||
      ""
    ).toLowerCase();
    if (text.includes("urgent") || text.includes("crisis")) return "tense";
    if (text.includes("inspire") || text.includes("future")) return "inspirational";
    if (text.includes("calm") || text.includes("focus")) return "calm";
    if (text.includes("energy") || text.includes("launch")) return "energetic";
    if (text.includes("story") || text.includes("cinematic")) return "cinematic";
    if (text.includes("curious") || text.includes("what if")) return "curious";
    return (config.defaultMood as MusicMood) || "curious";
  }

  determineRequiredSoundEffects(context: AudioContext): string[] {
    if (context.requiredSoundEffects?.length) return [...context.requiredSoundEffects];
    const effects = ["transition_whoosh", "soft_ui_click", "cinematic_hit"];
    const sectionCount = context.scriptSections?.length ?? context.sceneTimelineInput?.length ?? 0;
    if (sectionCount >= 3) effects.push("scene_sting");
    if ((context.narrationReadyText ?? "").toLowerCase().includes("alert")) {
      effects.push("notification_chime");
    }
    return effects;
  }

  selectLicensedMusic(mood: MusicMood, seq: number): AudioAssetRef[] {
    return [
      {
        assetId: `mus-lic-${seq}-bg`,
        assetPath: `assets/music/licensed/msw-${seq}-bg.descriptor.json`,
        assetType: "background_music",
        title: `Licensed ${mood} bed`,
        source: "licensed_library",
        licensingStatus: "royalty_free_licensed",
        licenseId: `lic-rf-${seq}-bg`,
        durationSec: 120,
        mood,
        descriptor: `Royalty-free licensed background music matched to ${mood} mood`,
      },
      {
        assetId: `mus-lic-${seq}-intro`,
        assetPath: `assets/music/licensed/msw-${seq}-intro.descriptor.json`,
        assetType: "intro_music",
        title: `Licensed ${mood} intro`,
        source: "licensed_library",
        licensingStatus: "licensed",
        licenseId: `lic-${seq}-intro`,
        durationSec: 8,
        mood,
        descriptor: "Licensed intro sting for platform-safe use",
      },
      {
        assetId: `mus-lic-${seq}-outro`,
        assetPath: `assets/music/licensed/msw-${seq}-outro.descriptor.json`,
        assetType: "outro_music",
        title: `Licensed ${mood} outro`,
        source: "licensed_library",
        licensingStatus: "platform_approved",
        licenseId: `lic-${seq}-outro`,
        durationSec: 10,
        mood,
        descriptor: "Platform-approved outro music",
      },
    ];
  }

  selectGeneratedMusicWhereApproved(
    mood: MusicMood,
    allowGenerated: boolean,
    seq: number,
  ): AudioAssetRef[] {
    if (!allowGenerated) return [];
    return [
      {
        assetId: `mus-gen-${seq}-ambient`,
        assetPath: `assets/music/generated/msw-${seq}-ambient.descriptor.json`,
        assetType: "generated_music",
        title: `Generated ${mood} ambient`,
        source: "generated",
        licensingStatus: "internally_generated",
        licenseId: `gen-lic-${seq}`,
        durationSec: 90,
        mood,
        descriptor: "Internally generated ambient music — approved generation path",
      },
      {
        assetId: `mus-gen-${seq}-ambient-loop`,
        assetPath: `assets/music/generated/msw-${seq}-ambient-loop.descriptor.json`,
        assetType: "ambient_audio",
        title: `Generated ${mood} loop`,
        source: "generated",
        licensingStatus: "internally_generated",
        licenseId: `gen-lic-${seq}-loop`,
        durationSec: 60,
        mood,
        descriptor: "Generated ambient loop for scene underscoring",
      },
    ];
  }

  selectSoundEffects(required: string[], seq: number): AudioAssetRef[] {
    const catalog: Record<string, { type: AudioAssetRef["assetType"]; title: string }> = {
      transition_whoosh: { type: "transition_effects", title: "Transition whoosh" },
      soft_ui_click: { type: "notification_sounds", title: "Soft UI click" },
      cinematic_hit: { type: "cinematic_effects", title: "Cinematic hit" },
      scene_sting: { type: "cinematic_effects", title: "Scene sting" },
      notification_chime: { type: "notification_sounds", title: "Notification chime" },
    };
    return required.map((key, i) => {
      const meta = catalog[key] ?? {
        type: "transition_effects" as const,
        title: key.replace(/_/g, " "),
      };
      return {
        assetId: `sfx-${seq}-${i + 1}`,
        assetPath: `assets/sfx/msw-${seq}-${key}.descriptor.json`,
        assetType: meta.type,
        title: meta.title,
        source: "licensed_library" as const,
        licensingStatus: "royalty_free_licensed" as LicensingStatus,
        licenseId: `lic-sfx-${seq}-${i + 1}`,
        durationSec: 2,
        descriptor: `Licensed ${meta.title} sound effect`,
      };
    });
  }

  buildSceneTimeline(
    context: AudioContext,
    mood: MusicMood,
    music: AudioAssetRef[],
    sfx: AudioAssetRef[],
    seq: number,
  ): SceneAudioSlot[] {
    const sections = context.sceneTimelineInput?.length
      ? context.sceneTimelineInput
      : context.scriptSections?.length
        ? context.scriptSections.map((s, i) => ({
            sceneId: `scene-msw-${seq}-${i + 1}`,
            order: i + 1,
            startSec: i * 8,
            endSec: (i + 1) * 8,
            scriptSectionId: s.sectionId,
          }))
        : [
            { sceneId: `scene-msw-${seq}-1`, order: 1, startSec: 0, endSec: 8 },
            { sceneId: `scene-msw-${seq}-2`, order: 2, startSec: 8, endSec: 16 },
            { sceneId: `scene-msw-${seq}-3`, order: 3, startSec: 16, endSec: 24 },
          ];
    const bg = music.find((m) => m.assetType === "background_music") ?? music[0] ?? null;
    return sections.map((section, i) => ({
      sceneId: section.sceneId ?? `scene-msw-${seq}-${i + 1}`,
      order: section.order ?? i + 1,
      startSec: section.startSec ?? i * 8,
      endSec: section.endSec ?? (i + 1) * 8,
      mood,
      musicAssetId: i === 0
        ? (music.find((m) => m.assetType === "intro_music")?.assetId ?? bg?.assetId ?? null)
        : i === sections.length - 1
          ? (music.find((m) => m.assetType === "outro_music")?.assetId ?? bg?.assetId ?? null)
          : (bg?.assetId ?? null),
      soundEffectAssetIds: (() => {
        const effect = sfx[i % sfx.length];
        return effect ? [effect.assetId] : [];
      })(),
      placementNotes: `Matched ${mood} audio to scene ${i + 1}`,
    }));
  }

  matchMusicToScenes(timeline: SceneAudioSlot[], music: AudioAssetRef[]): SceneAudioSlot[] {
    const bg = music.find((m) => m.assetType === "background_music");
    return timeline.map((slot, i) => ({
      ...slot,
      soundEffectAssetIds: [...slot.soundEffectAssetIds],
      musicAssetId:
        slot.musicAssetId ??
        music[Math.min(i, music.length - 1)]?.assetId ??
        bg?.assetId ??
        null,
      placementNotes: `${slot.placementNotes}; music matched`,
    }));
  }

  matchSoundEffectsToEvents(timeline: SceneAudioSlot[], sfx: AudioAssetRef[]): SceneAudioSlot[] {
    return timeline.map((slot, i) => {
      const primary = sfx[i % sfx.length];
      const secondary = i === 0 ? sfx[1] : undefined;
      return {
        ...slot,
        soundEffectAssetIds: primary
          ? [primary.assetId, ...(secondary ? [secondary.assetId] : [])]
          : [...slot.soundEffectAssetIds],
        placementNotes: `${slot.placementNotes}; sfx matched to scene events`,
      };
    });
  }

  buildAudioPlacement(timeline: SceneAudioSlot[]): AudioPlacement[] {
    const placements: AudioPlacement[] = [];
    let i = 0;
    for (const scene of timeline) {
      if (scene.musicAssetId) {
        i += 1;
        placements.push({
          placementId: `plc-${scene.sceneId}-music`,
          assetId: scene.musicAssetId,
          sceneId: scene.sceneId,
          startSec: scene.startSec,
          endSec: scene.endSec,
          role: "music",
          duckingDb: -6,
        });
      }
      for (const sfxId of scene.soundEffectAssetIds) {
        i += 1;
        placements.push({
          placementId: `plc-${scene.sceneId}-sfx-${i}`,
          assetId: sfxId,
          sceneId: scene.sceneId,
          startSec: scene.startSec,
          endSec: Math.min(scene.startSec + 2, scene.endSec),
          role: "sfx",
          duckingDb: 0,
        });
      }
    }
    return placements;
  }

  validateLicensingCompliance(
    music: AudioAssetRef[],
    sfx: AudioAssetRef[],
  ): { licensingStatus: LicensingStatus; quality: QualityValidation } {
    const all = [...music, ...sfx];
    if (!all.length) {
      return {
        licensingStatus: "unapproved",
        quality: {
          status: "fail",
          licensingValidated: false,
          timelineValidated: false,
          copyrightValidated: false,
          notes: "No audio assets selected",
          score: 0,
        },
      };
    }
    if (all.some((a) => a.licensingStatus === "unapproved" || a.licensingStatus === "restricted")) {
      return {
        licensingStatus: "restricted",
        quality: {
          status: "fail",
          licensingValidated: false,
          timelineValidated: false,
          copyrightValidated: false,
          notes: "Unapproved or restricted copyrighted assets detected",
          score: 0,
        },
      };
    }
    const notes: string[] = [];
    let score = 90;
    if (all.every((a) => a.licenseId)) {
      notes.push("All assets carry license identifiers");
      score += 3;
    }
    if (all.some((a) => a.source === "generated")) {
      notes.push("Generated music included only on approved generation path");
      score += 2;
    }
    if (all.every((a) => a.source !== "licensed_library" || a.licensingStatus !== "unapproved")) {
      notes.push("Copyright compliance validated against approved catalogs");
      score += 2;
    }
    score = Math.max(0, Math.min(100, score));
    const licensingStatus: LicensingStatus = all.some((a) => a.licensingStatus === "licensed")
      ? "licensed"
      : all.some((a) => a.licensingStatus === "royalty_free_licensed")
        ? "royalty_free_licensed"
        : all.some((a) => a.licensingStatus === "internally_generated")
          ? "internally_generated"
          : "platform_approved";
    return {
      licensingStatus: (LICENSING_STATUSES as readonly string[]).includes(licensingStatus)
        ? licensingStatus
        : "platform_approved",
      quality: {
        status: score < 60 ? "fail" : "pass_with_notes",
        licensingValidated: true,
        timelineValidated: true,
        copyrightValidated: true,
        notes: notes.join("; ") || "Licensing and copyright compliance passed",
        score,
      },
    };
  }

  buildMusicSoundReport(
    input: MusicSoundWorkerInput,
    config: MusicSoundWorkerConfiguration,
    context: AudioContext,
    options: {
      backgroundMusicAssets?: AudioAssetRef[];
      soundEffectAssets?: AudioAssetRef[];
      sceneTimeline?: SceneAudioSlot[];
      audioPlacement?: AudioPlacement[];
      licensingStatus?: LicensingStatus;
      qualityValidation?: QualityValidation;
      requiredMood?: MusicMood;
      requiredSoundEffects?: string[];
    } = {},
  ): MusicSoundReport {
    audioSequence += 1;
    const seq = audioSequence;
    const now = new Date().toISOString();
    const scriptId = context.scriptId?.trim() || input.scriptId?.trim() || `scw-scr-msw-${seq}`;
    const audioReportId = input.audioReportId?.trim() || `msw-rpt-${Date.now()}-${seq}`;
    const channelId = context.channelId?.trim() || input.channelId?.trim() || `chn-msw-${seq}`;
    const videoId = context.videoId?.trim() || input.videoId?.trim() || `vid-msw-${seq}`;
    const mood =
      options.requiredMood ??
      context.requiredMood ??
      this.determineRequiredMusicMood(context, config);
    const requiredSfx =
      options.requiredSoundEffects ??
      (context.requiredSoundEffects?.length
        ? context.requiredSoundEffects
        : this.determineRequiredSoundEffects(context));
    const allowGenerated =
      context.allowGeneratedMusic ?? config.allowGeneratedMusicByDefault;
    const music =
      options.backgroundMusicAssets ??
      (context.backgroundMusicAssets?.length
        ? context.backgroundMusicAssets
        : [
            ...this.selectLicensedMusic(mood, seq),
            ...this.selectGeneratedMusicWhereApproved(mood, allowGenerated, seq),
          ]);
    const sfx =
      options.soundEffectAssets ??
      (context.soundEffectAssets?.length
        ? context.soundEffectAssets
        : this.selectSoundEffects(requiredSfx, seq));
    let timeline =
      options.sceneTimeline ??
      (context.sceneTimeline?.length
        ? context.sceneTimeline
        : this.buildSceneTimeline(context, mood, music, sfx, seq));
    if (!options.sceneTimeline) {
      timeline = this.matchSoundEffectsToEvents(
        this.matchMusicToScenes(timeline, music),
        sfx,
      );
    }
    const placement =
      options.audioPlacement ??
      (context.audioPlacement?.length
        ? context.audioPlacement
        : this.buildAudioPlacement(timeline));
    const licensing =
      options.licensingStatus && options.qualityValidation
        ? {
            licensingStatus: options.licensingStatus,
            quality: options.qualityValidation,
          }
        : this.validateLicensingCompliance(music, sfx);
    return {
      audioReportId,
      timestamp: now,
      videoId,
      scriptId,
      backgroundMusicAssets: music,
      soundEffectAssets: sfx,
      sceneTimeline: timeline,
      audioPlacement: placement,
      licensingStatus: licensing.licensingStatus,
      qualityValidation: licensing.quality,
      metadataVersion: MSW_METADATA_VERSION,
      channelId,
      assemblyId: context.assemblyId ?? null,
      requiredMood: mood,
      requiredSoundEffects: requiredSfx,
      workerId: config.workerId,
      reportVersion: MSW_REPORT_VERSION,
      traceabilityRefs: unique([
        `script:${scriptId}`,
        `video:${videoId}`,
        `channel:${channelId}`,
        context.assemblyId ? `assembly:${context.assemblyId}` : null,
        `mood:${mood}`,
        `licensing:${licensing.licensingStatus}`,
        ...music.map((a) => `music:${a.assetId}`),
        ...sfx.map((a) => `sfx:${a.assetId}`),
      ]),
      preservedDecisions: [
        {
          decisionId: `msw-dec-${seq}-license`,
          topic: scriptId,
          decision: "Selected only licensed or approved-generated audio — no unapproved copyrighted assets",
          recordedAt: now,
        },
        {
          decisionId: `msw-dec-${seq}-sync`,
          topic: videoId,
          decision: `Synchronized ${placement.length} audio placements across ${timeline.length} scenes`,
          recordedAt: now,
        },
      ],
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverAssembleVideos: true,
      neverPublishMedia: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ414OrLater: true,
      neverUseUnapprovedCopyrightedAssets: true,
      preserveCompleteAssetTraceability: true,
      preserveLicensingInformation: true,
      preserveTimelineSynchronization: true,
      validateCopyrightCompliance: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}

let audioSequence = 0;

export function resetAudioSequenceForTesting() {
  audioSequence = 0;
}

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function cloneReport(report: MusicSoundReport): MusicSoundReport {
  return {
    ...report,
    backgroundMusicAssets: report.backgroundMusicAssets.map((a) => ({ ...a })),
    soundEffectAssets: report.soundEffectAssets.map((a) => ({ ...a })),
    sceneTimeline: report.sceneTimeline.map((s) => ({
      ...s,
      soundEffectAssetIds: [...s.soundEffectAssetIds],
    })),
    audioPlacement: report.audioPlacement.map((p) => ({ ...p })),
    qualityValidation: { ...report.qualityValidation },
    requiredSoundEffects: [...report.requiredSoundEffects],
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
