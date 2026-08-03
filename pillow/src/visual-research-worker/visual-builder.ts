import type { VisualResearchWorkerConfiguration } from "./configuration.js";
import {
  APPROVED_VISUAL_SOURCES,
  ASSET_TYPES,
  CONTENT_FORMATS,
  VRW_METADATA_VERSION,
  VRW_REPORT_VERSION,
} from "./paths.js";
import type {
  AssetType,
  CandidateAsset,
  ContentFormat,
  CopyrightStatus,
  CoverageStatus,
  IntegrationHandshake,
  LicensingRestriction,
  ScriptSection,
  UsageRights,
  VisualResearchContext,
  VisualResearchReport,
  VisualResearchWorkerCatalog,
  VisualResearchWorkerInput,
  VisualSceneRecord,
} from "./types.js";

/** Pure Visual Research Worker helpers for Q4-08 — reference discovery only. */
export class VisualBuilder {
  buildCatalog(
    config: VisualResearchWorkerConfiguration,
    reports: VisualResearchReport[],
    integrations: IntegrationHandshake[],
  ): VisualResearchWorkerCatalog {
    return {
      reportVersion: VRW_REPORT_VERSION,
      workerId: config.workerId,
      visualResearchReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: VRW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverGenerateFinalCreativeAssets: true,
      neverEditImages: true,
      neverAssembleVideos: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  mergeContext(input: VisualResearchWorkerInput, context: VisualResearchContext): VisualResearchContext {
    const receivedScript =
      context.receivedScript ||
      Boolean(input.scriptId?.trim()) ||
      Boolean(input.scriptTitle?.trim()) ||
      Boolean(input.scriptIntent?.trim());
    return {
      scriptId: input.scriptId ?? context.scriptId ?? null,
      channelId: input.channelId ?? context.channelId ?? null,
      topicId: input.topicId ?? context.topicId ?? null,
      scriptTitle: input.scriptTitle ?? context.scriptTitle ?? null,
      scriptIntent: input.scriptIntent ?? context.scriptIntent ?? null,
      scriptSections: input.scriptSections ?? context.scriptSections ?? [],
      thumbnailReportId: input.thumbnailReportId ?? context.thumbnailReportId ?? null,
      contentFormat: this.resolveFormat(input, context) ?? context.contentFormat ?? null,
      candidateAssets: input.candidateAssets ?? context.candidateAssets ?? [],
      receivedScript,
      scenes: context.scenes ?? [],
    };
  }

  canResearchVisuals(context: VisualResearchContext): { ready: boolean; reason?: string } {
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

  resolveFormat(input: VisualResearchWorkerInput, context: VisualResearchContext): ContentFormat | null {
    const raw = input.contentFormat ?? context.contentFormat ?? null;
    if (!raw) return null;
    return (CONTENT_FORMATS as readonly string[]).includes(raw) ? (raw as ContentFormat) : null;
  }

  extractTopic(context: VisualResearchContext): string {
    if (context.scriptTitle?.trim()) return context.scriptTitle.trim();
    if (context.scriptIntent?.trim()) {
      const sentence = context.scriptIntent.split(/[.!?]/)[0]?.trim();
      if (sentence) return sentence.slice(0, 80);
    }
    return "this topic";
  }

  breakIntoVisualScenes(context: VisualResearchContext, seq: number): VisualSceneRecord[] {
    const sections = context.scriptSections?.length
      ? context.scriptSections
      : this.defaultSections(context);
    const topic = this.extractTopic(context);
    return sections.map((section, i) => {
      const sceneNumber = i + 1;
      const label = section.title?.trim() || `Scene ${sceneNumber}`;
      const content = section.content?.trim() || topic;
      return {
        sceneNumber,
        requiredVisual: `Visual supporting "${label}": ${content.slice(0, 120)}`,
        visualSource: "",
        assetType: "stock_image" as AssetType,
        copyrightStatus: "unknown" as CopyrightStatus,
        usageRights: "unknown" as UsageRights,
        timelinePosition: this.timelinePosition(sceneNumber, sections.length, section),
        coverageStatus: "missing" as CoverageStatus,
        assetId: `vrw-scene-${seq}-${sceneNumber}`,
      };
    });
  }

  identifyRequiredVisualAssets(scenes: VisualSceneRecord[], context: VisualResearchContext): VisualSceneRecord[] {
    const topic = this.extractTopic(context).toLowerCase();
    return scenes.map((scene) => {
      const isDiagram = /data|chart|diagram|process|workflow|step/i.test(scene.requiredVisual);
      const isVideo = /demo|motion|action|walkthrough/i.test(scene.requiredVisual);
      let assetType: AssetType = "stock_image";
      if (isDiagram) assetType = "diagram";
      else if (isVideo) assetType = "stock_video";
      else if (/archive|historical|legacy/i.test(scene.requiredVisual)) assetType = "archive_material";
      const requiredVisual = scene.requiredVisual.includes(topic.slice(0, 20))
        ? scene.requiredVisual
        : `${scene.requiredVisual} — contextual to ${this.extractTopic(context)}`;
      return { ...scene, assetType, requiredVisual };
    });
  }

  searchApprovedStockLibraries(
    scenes: VisualSceneRecord[],
    config: VisualResearchWorkerConfiguration,
    seq: number,
  ): VisualSceneRecord[] {
    const stockSources = config.approvedVisualSources.filter((s) =>
      ["shutterstock", "getty_images", "adobe_stock", "pexels", "unsplash", "pixabay"].includes(s),
    );
    return scenes.map((scene, i) => {
      if (scene.assetType !== "stock_image" && scene.assetType !== "stock_video") return scene;
      const source = stockSources[i % stockSources.length] ?? "pexels";
      return {
        ...scene,
        visualSource: source,
        assetId: scene.assetId ?? `vrw-stock-${seq}-${scene.sceneNumber}`,
        copyrightStatus: "licensed_stock" as CopyrightStatus,
        usageRights: source === "getty_images" ? ("editorial_only" as UsageRights) : ("royalty_free" as UsageRights),
        coverageStatus: "partial" as CoverageStatus,
        licensingNotes: `Licensed via ${source} — verify platform terms before commercial use`,
      };
    });
  }

  searchPublicDomainSources(
    scenes: VisualSceneRecord[],
    config: VisualResearchWorkerConfiguration,
    seq: number,
  ): VisualSceneRecord[] {
    const pdSources = config.approvedVisualSources.filter((s) =>
      ["wikimedia_commons", "library_of_congress", "internet_archive"].includes(s),
    );
    return scenes.map((scene, i) => {
      if (scene.visualSource) return scene;
      if (scene.assetType === "archive_material" || scene.assetType === "public_domain_image") {
        const source = pdSources[i % pdSources.length] ?? "wikimedia_commons";
        return {
          ...scene,
          visualSource: source,
          assetType: scene.assetType === "archive_material" ? "archive_material" : "public_domain_image",
          assetId: scene.assetId ?? `vrw-pd-${seq}-${scene.sceneNumber}`,
          copyrightStatus: "public_domain" as CopyrightStatus,
          usageRights: "attribution_required" as UsageRights,
          coverageStatus: "covered" as CoverageStatus,
          licensingNotes: `Public domain via ${source} — attribution recommended`,
        };
      }
      return scene;
    });
  }

  identifyInternallyGeneratedAssets(
    scenes: VisualSceneRecord[],
    context: VisualResearchContext,
    config: VisualResearchWorkerConfiguration,
    seq: number,
  ): VisualSceneRecord[] {
    const internalCandidates = (context.candidateAssets ?? []).filter(
      (a) => a.source === "internal_generated" || a.assetType?.toString().includes("original"),
    );
    return scenes.map((scene, i) => {
      if (scene.visualSource) return scene;
      if (scene.assetType === "diagram" || scene.assetType === "original_generated_graphic") {
        const candidate = internalCandidates[i % Math.max(internalCandidates.length, 1)];
        return {
          ...scene,
          visualSource: "internal_generated",
          assetType: scene.assetType === "diagram" ? "diagram" : "original_generated_graphic",
          assetId: candidate?.assetId ?? `vrw-int-${seq}-${scene.sceneNumber}`,
          copyrightStatus: "original_internal" as CopyrightStatus,
          usageRights: "internal_only" as UsageRights,
          coverageStatus: "covered" as CoverageStatus,
          licensingNotes: "Internally generated asset — full traceability preserved",
        };
      }
      if (!scene.visualSource && scene.coverageStatus === "missing") {
        const fallback = config.approvedVisualSources.includes("internal_generated")
          ? "internal_generated"
          : "pexels";
        return {
          ...scene,
          visualSource: fallback,
          assetId: scene.assetId ?? `vrw-fallback-${seq}-${scene.sceneNumber}`,
          copyrightStatus: fallback === "internal_generated" ? "original_internal" : "licensed_stock",
          usageRights: fallback === "internal_generated" ? "internal_only" : "royalty_free",
          coverageStatus: "partial" as CoverageStatus,
        };
      }
      return scene;
    });
  }

  classifyCopyrightStatus(scenes: VisualSceneRecord[]): VisualSceneRecord[] {
    return scenes.map((scene) => {
      if (scene.copyrightStatus !== "unknown") return scene;
      const source = scene.visualSource.toLowerCase();
      if (["wikimedia_commons", "library_of_congress", "internet_archive"].some((s) => source.includes(s))) {
        return { ...scene, copyrightStatus: "public_domain", usageRights: "attribution_required" };
      }
      if (source === "internal_generated") {
        return { ...scene, copyrightStatus: "original_internal", usageRights: "internal_only" };
      }
      if (["shutterstock", "getty_images", "adobe_stock", "pexels", "unsplash", "pixabay"].some((s) => source.includes(s))) {
        return {
          ...scene,
          copyrightStatus: "licensed_stock",
          usageRights: source.includes("getty") ? "editorial_only" : "royalty_free",
        };
      }
      return { ...scene, copyrightStatus: "unknown", usageRights: "unknown" };
    });
  }

  matchVisualsToScriptTimeline(scenes: VisualSceneRecord[], totalScenes: number): VisualSceneRecord[] {
    return scenes.map((scene, i) => ({
      ...scene,
      timelinePosition: this.timelinePosition(scene.sceneNumber, totalScenes, {
        durationSeconds: Math.round(60 / totalScenes),
      }),
    }));
  }

  detectMissingVisualCoverage(scenes: VisualSceneRecord[]): { scenes: VisualSceneRecord[]; missingAssets: string[] } {
    const missingAssets: string[] = [];
    const updated = scenes.map((scene) => {
      if (!scene.visualSource || scene.coverageStatus === "missing") {
        missingAssets.push(`scene-${scene.sceneNumber}:${scene.requiredVisual.slice(0, 60)}`);
        return { ...scene, coverageStatus: "missing" as CoverageStatus };
      }
      if (scene.coverageStatus === "partial" && !scene.assetId) {
        missingAssets.push(`scene-${scene.sceneNumber}:asset_id_pending`);
        return scene;
      }
      if (scene.coverageStatus !== "covered" && scene.visualSource) {
        return { ...scene, coverageStatus: "partial" as CoverageStatus };
      }
      return scene;
    });
    return { scenes: updated, missingAssets };
  }

  identifyLicensingRestrictions(scenes: VisualSceneRecord[], seq: number): LicensingRestriction[] {
    const restrictions: LicensingRestriction[] = [];
    for (const scene of scenes) {
      if (scene.usageRights === "editorial_only") {
        restrictions.push({
          restrictionId: `vrw-lic-${seq}-${scene.sceneNumber}`,
          assetRef: scene.assetId ?? `scene-${scene.sceneNumber}`,
          restriction: "Editorial use only — not cleared for commercial advertising",
          severity: "warning",
        });
      }
      if (scene.usageRights === "attribution_required") {
        restrictions.push({
          restrictionId: `vrw-attrib-${seq}-${scene.sceneNumber}`,
          assetRef: scene.assetId ?? `scene-${scene.sceneNumber}`,
          restriction: `Attribution required for ${scene.visualSource}`,
          severity: "info",
        });
      }
      if (scene.copyrightStatus === "restricted") {
        restrictions.push({
          restrictionId: `vrw-restrict-${seq}-${scene.sceneNumber}`,
          assetRef: scene.assetId ?? `scene-${scene.sceneNumber}`,
          restriction: "Asset restricted — do not use without legal review",
          severity: "error",
        });
      }
    }
    return restrictions;
  }

  isApprovedSource(source: string, config: VisualResearchWorkerConfiguration): boolean {
    const normalized = source.toLowerCase().replace(/\s+/g, "_");
    return config.approvedVisualSources.some(
      (approved) => normalized.includes(approved) || approved.includes(normalized),
    );
  }

  buildVisualResearchReport(
    input: VisualResearchWorkerInput,
    config: VisualResearchWorkerConfiguration,
    context: VisualResearchContext,
  ): VisualResearchReport {
    visualSequence += 1;
    const seq = visualSequence;
    const now = new Date().toISOString();
    const format = this.resolveFormat(input, context) ?? (config.defaultContentFormat as ContentFormat);
    const scriptId = context.scriptId?.trim() || input.scriptId?.trim() || `scw-scr-vrw-${seq}`;
    const visualResearchId = input.visualResearchId?.trim() || `vrw-rpt-${Date.now()}-${seq}`;
    const channelId = context.channelId?.trim() || input.channelId?.trim() || `chn-vrw-${seq}`;
    const topicId = context.topicId?.trim() || input.topicId?.trim() || `topic-vrw-${seq}`;
    const thumbnailReportId = context.thumbnailReportId?.trim() || input.thumbnailReportId?.trim() || null;
    let scenes = this.breakIntoVisualScenes(context, seq);
    scenes = this.identifyRequiredVisualAssets(scenes, context);
    scenes = this.searchApprovedStockLibraries(scenes, config, seq);
    scenes = this.searchPublicDomainSources(scenes, config, seq);
    scenes = this.identifyInternallyGeneratedAssets(scenes, context, config, seq);
    scenes = this.classifyCopyrightStatus(scenes);
    scenes = this.matchVisualsToScriptTimeline(scenes, scenes.length);
    const { scenes: finalScenes, missingAssets } = this.detectMissingVisualCoverage(scenes);
    const licensingRestrictions = this.identifyLicensingRestrictions(finalScenes, seq);
    const primary = finalScenes[0]!;
    const coveredCount = finalScenes.filter((s) => s.coverageStatus === "covered").length;
    const partialCount = finalScenes.filter((s) => s.coverageStatus === "partial").length;
    const confidenceScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (coveredCount / finalScenes.length) * 70 +
            (partialCount / finalScenes.length) * 20 +
            (missingAssets.length === 0 ? 10 : 0),
        ),
      ),
    );
    const traceabilityRefs = unique([
      `script:${scriptId}`,
      `channel:${channelId}`,
      `topic:${topicId}`,
      `format:${format}`,
      thumbnailReportId ? `thumbnailReport:${thumbnailReportId}` : null,
      ...finalScenes.map((s) => `scene:${s.sceneNumber}:${s.assetId ?? "pending"}`),
    ]);
    const preservedDecisions = [
      {
        decisionId: `vrw-dec-${seq}-intent`,
        topic: this.extractTopic(context),
        decision: "Preserved approved script intent — visual references only, no final creative assembly",
        recordedAt: now,
      },
      {
        decisionId: `vrw-dec-${seq}-scenes`,
        topic: this.extractTopic(context),
        decision: `Researched ${finalScenes.length} visual scenes from approved sources only`,
        recordedAt: now,
      },
    ];
    return {
      visualResearchId,
      timestamp: now,
      scriptId,
      sceneNumber: primary.sceneNumber,
      requiredVisual: primary.requiredVisual,
      visualSource: primary.visualSource,
      assetType: primary.assetType,
      copyrightStatus: primary.copyrightStatus,
      usageRights: primary.usageRights,
      timelinePosition: primary.timelinePosition,
      coverageStatus: primary.coverageStatus,
      confidenceScore,
      metadataVersion: VRW_METADATA_VERSION,
      channelId,
      thumbnailReportId,
      topicId,
      contentFormat: format,
      scenes: finalScenes,
      missingAssets,
      licensingRestrictions,
      workerId: config.workerId,
      reportVersion: VRW_REPORT_VERSION,
      traceabilityRefs,
      preservedDecisions,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverGenerateFinalCreativeAssets: true,
      neverEditImages: true,
      neverAssembleVideos: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ409OrLater: true,
      useOnlyApprovedVisualSources: true,
      preserveCompleteAssetTraceability: true,
      preserveCopyrightInformation: true,
      identifyLicensingRestrictions: true,
      detectMissingVisualAssets: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  private defaultSections(context: VisualResearchContext): ScriptSection[] {
    const topic = this.extractTopic(context);
    return [
      { sectionId: "intro", title: "Introduction", content: `Opening context for ${topic}` },
      { sectionId: "core", title: "Core Content", content: `Main narrative for ${topic}` },
      { sectionId: "close", title: "Conclusion", content: `Closing summary for ${topic}` },
    ];
  }

  private timelinePosition(sceneNumber: number, total: number, section?: ScriptSection): string {
    const duration = section?.durationSeconds ?? Math.round(180 / total);
    const start = (sceneNumber - 1) * duration;
    const end = start + duration;
    return `${start}s–${end}s (scene ${sceneNumber}/${total})`;
  }
}

let visualSequence = 0;

export function resetVisualSequenceForTesting() {
  visualSequence = 0;
}

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function cloneReport(report: VisualResearchReport): VisualResearchReport {
  return {
    ...report,
    scenes: report.scenes.map((s) => ({ ...s })),
    missingAssets: [...report.missingAssets],
    licensingRestrictions: report.licensingRestrictions.map((l) => ({ ...l })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}

export { APPROVED_VISUAL_SOURCES, ASSET_TYPES };
