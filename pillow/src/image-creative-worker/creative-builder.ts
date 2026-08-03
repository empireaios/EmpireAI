import type { ImageCreativeWorkerConfiguration } from "./configuration.js";
import {
  CREATIVE_ASSET_TYPES,
  COPYRIGHT_STATUSES,
  ICW_METADATA_VERSION,
  ICW_REPORT_VERSION,
} from "./paths.js";
import type {
  CreativeAssetReport,
  CreativeAssetType,
  CreativeContext,
  CreativeVariant,
  CopyrightStatus,
  EditOperation,
  GeneratedAssetRef,
  ImageCreativeWorkerCatalog,
  ImageCreativeWorkerInput,
  IntegrationHandshake,
  QualityStatus,
  SourceAssetRef,
} from "./types.js";

/** Pure Image & Creative Worker helpers for Q4-09 — structural signals only. */
export class CreativeBuilder {
  buildCatalog(
    config: ImageCreativeWorkerConfiguration,
    reports: CreativeAssetReport[],
    integrations: IntegrationHandshake[],
  ): ImageCreativeWorkerCatalog {
    return {
      reportVersion: ICW_REPORT_VERSION,
      workerId: config.workerId,
      creativeAssetReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: ICW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverAssembleVideos: true,
      neverGenerateVoiceovers: true,
      neverPublishMedia: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  mergeContext(input: ImageCreativeWorkerInput, context: CreativeContext): CreativeContext {
    const receivedVisualResearch =
      context.receivedVisualResearch ||
      Boolean(input.visualResearchId?.trim()) ||
      Boolean(input.visualResearchScenes?.length);
    const receivedThumbnailSpecs =
      context.receivedThumbnailSpecs ||
      Boolean(input.thumbnailReportId?.trim()) ||
      Boolean(input.thumbnailSpecs?.length);
    return {
      scriptId: input.scriptId ?? context.scriptId ?? null,
      sceneId: input.sceneId ?? context.sceneId ?? null,
      channelId: input.channelId ?? context.channelId ?? null,
      visualResearchId: input.visualResearchId ?? context.visualResearchId ?? null,
      thumbnailReportId: input.thumbnailReportId ?? context.thumbnailReportId ?? null,
      assetType: this.resolveAssetType(input, context) ?? context.assetType ?? null,
      sourceAssets: input.sourceAssets ?? context.sourceAssets ?? [],
      thumbnailSpecs: input.thumbnailSpecs ?? context.thumbnailSpecs ?? [],
      visualResearchScenes: input.visualResearchScenes ?? context.visualResearchScenes ?? [],
      editorialNotes: input.editorialNotes ?? context.editorialNotes ?? null,
      receivedVisualResearch,
      receivedThumbnailSpecs,
      editOperations: context.editOperations ?? [],
    };
  }

  canGenerateCreative(context: CreativeContext): { ready: boolean; reason?: string } {
    if (!context.receivedVisualResearch && !context.receivedThumbnailSpecs) {
      return {
        ready: false,
        reason: "Visual research context and/or thumbnail specifications required before generation",
      };
    }
    if (!context.scriptId) {
      return { ready: false, reason: "Script ID required for creative asset generation" };
    }
    return { ready: true };
  }

  resolveAssetType(input: ImageCreativeWorkerInput, context: CreativeContext): CreativeAssetType | null {
    const raw = input.assetType ?? context.assetType ?? null;
    if (!raw) return null;
    return (CREATIVE_ASSET_TYPES as readonly string[]).includes(raw) ? (raw as CreativeAssetType) : null;
  }

  resolveSceneId(context: CreativeContext, seq: number): string {
    if (context.sceneId?.trim()) return context.sceneId.trim();
    const firstScene = context.visualResearchScenes?.[0];
    if (firstScene?.sceneId) return firstScene.sceneId;
    return `scene-icw-${seq}`;
  }

  normalizeSourceAssets(
    sourceAssets: (string | SourceAssetRef)[] | undefined,
    seq: number,
  ): SourceAssetRef[] {
    if (!sourceAssets?.length) {
      return [
        {
          assetId: `src-icw-${seq}-1`,
          assetPath: `assets/source/icw-${seq}-1.descriptor.json`,
          assetType: "reference_image",
          copyrightStatus: "original",
          source: "internal_generated",
        },
      ];
    }
    return sourceAssets.map((a, i) =>
      typeof a === "string"
        ? {
            assetId: a,
            assetPath: `assets/source/${a}.descriptor.json`,
            assetType: "reference_image",
            copyrightStatus: "original" as CopyrightStatus,
          }
        : { ...a },
    );
  }

  generateOriginalGraphics(
    context: CreativeContext,
    config: ImageCreativeWorkerConfiguration,
    seq: number,
  ): GeneratedAssetRef[] {
    const assetType = context.assetType ?? (config.defaultAssetType as CreativeAssetType);
    const sceneLabel = context.visualResearchScenes?.[0]?.sceneLabel ?? "primary scene";
    return [
      {
        assetId: `gen-icw-${seq}-graphic-1`,
        assetPath: `assets/generated/icw-${seq}-graphic-1.descriptor.json`,
        assetType: assetType === "thumbnail" ? "illustration" : assetType,
        descriptor: `Original graphic for ${sceneLabel} — structural signal only, no binary payload`,
      },
      {
        assetId: `gen-icw-${seq}-graphic-2`,
        assetPath: `assets/generated/icw-${seq}-graphic-2.descriptor.json`,
        assetType: "supporting_visual",
        descriptor: `Supporting visual element aligned to script ${context.scriptId}`,
      },
    ];
  }

  recordEditOperations(
    sourceAssets: SourceAssetRef[],
    seq: number,
    existing: EditOperation[] = [],
  ): EditOperation[] {
    const ops: EditOperation[] = [...existing];
    for (const src of sourceAssets) {
      ops.push({
        operationId: `edit-op-${seq}-${src.assetId}`,
        operationType: "color_adjustment",
        description: `Adjusted colour balance and contrast on ${src.assetId}`,
        appliedTo: src.assetId,
      });
      ops.push({
        operationId: `edit-op-${seq}-${src.assetId}-crop`,
        operationType: "crop_and_resize",
        description: `Cropped and resized ${src.assetId} for target aspect ratio`,
        appliedTo: src.assetId,
      });
    }
    return ops;
  }

  createDiagramsAndInfographics(context: CreativeContext, seq: number): GeneratedAssetRef[] {
    return [
      {
        assetId: `gen-icw-${seq}-diagram-1`,
        assetPath: `assets/generated/icw-${seq}-diagram-1.descriptor.json`,
        assetType: "diagram",
        descriptor: `Diagram illustrating key concept from scene ${context.sceneId ?? "primary"}`,
      },
      {
        assetId: `gen-icw-${seq}-infographic-1`,
        assetPath: `assets/generated/icw-${seq}-infographic-1.descriptor.json`,
        assetType: "infographic",
        descriptor: `Infographic summarizing visual research data for script ${context.scriptId}`,
      },
    ];
  }

  createCoversAndBanners(context: CreativeContext, seq: number): GeneratedAssetRef[] {
    const spec = context.thumbnailSpecs?.[0];
    return [
      {
        assetId: `gen-icw-${seq}-cover-1`,
        assetPath: `assets/generated/icw-${seq}-cover-1.descriptor.json`,
        assetType: "cover_image",
        descriptor: `Cover image${spec?.textOverlay ? ` with overlay "${spec.textOverlay}"` : ""} for channel content`,
      },
      {
        assetId: `gen-icw-${seq}-banner-1`,
        assetPath: `assets/generated/icw-${seq}-banner-1.descriptor.json`,
        assetType: "banner",
        descriptor: `Banner asset${spec?.composition ? ` — ${spec.composition}` : ""} for promotional placement`,
      },
    ];
  }

  createSocialMediaAssets(context: CreativeContext, seq: number): GeneratedAssetRef[] {
    return [
      {
        assetId: `gen-icw-${seq}-social-1`,
        assetPath: `assets/generated/icw-${seq}-social-square.descriptor.json`,
        assetType: "social_graphic",
        variantLabel: "square",
        descriptor: "Square social graphic (1:1) for feed placement",
      },
      {
        assetId: `gen-icw-${seq}-social-2`,
        assetPath: `assets/generated/icw-${seq}-social-story.descriptor.json`,
        assetType: "social_graphic",
        variantLabel: "story",
        descriptor: "Story-format social graphic (9:16) for vertical placement",
      },
    ];
  }

  generateCreativeVariants(
    generated: GeneratedAssetRef[],
    seq: number,
  ): CreativeVariant[] {
    const variants: CreativeVariant[] = [];
    for (let i = 0; i < generated.length; i++) {
      const base = generated[i];
      if (!base) continue;
      variants.push({
        variantId: `icw-var-${seq}-${i + 1}a`,
        variantLabel: `${String.fromCharCode(65 + i)}`,
        assetId: base.assetId,
        assetPath: base.assetPath,
        assetType: base.assetType,
        descriptor: `${base.descriptor} — variant A`,
      });
      variants.push({
        variantId: `icw-var-${seq}-${i + 1}b`,
        variantLabel: `${String.fromCharCode(65 + i)}-alt`,
        assetId: `${base.assetId}-alt`,
        assetPath: base.assetPath.replace(".descriptor.json", "-alt.descriptor.json"),
        assetType: base.assetType,
        descriptor: `${base.descriptor} — variant B (colour/layout alternative)`,
      });
    }
    return variants;
  }

  resolveCopyrightStatus(sourceAssets: SourceAssetRef[]): CopyrightStatus {
    const statuses = sourceAssets.map((a) => a.copyrightStatus ?? "unknown");
    if (statuses.includes("restricted")) return "restricted";
    if (statuses.every((s) => s === "original")) return "original";
    if (statuses.some((s) => s === "licensed_derivative" || s === "licensed_stock")) {
      return "licensed_derivative";
    }
    if (statuses.some((s) => s === "public_domain" || s === "public_domain_derivative")) {
      return "public_domain_derivative";
    }
    return (COPYRIGHT_STATUSES as readonly string[]).includes(statuses[0] as string)
      ? (statuses[0] as CopyrightStatus)
      : "unknown";
  }

  validateQualityAndCompliance(
    generated: GeneratedAssetRef[],
    sourceAssets: SourceAssetRef[],
    editOperations: EditOperation[],
  ): { qualityStatus: QualityStatus; complianceNotes: string } {
    const copyrightStatus = this.resolveCopyrightStatus(sourceAssets);
    if (copyrightStatus === "restricted") {
      return {
        qualityStatus: "fail",
        complianceNotes: "Restricted copyright status on source assets — generation blocked",
      };
    }
    if (!generated.length) {
      return {
        qualityStatus: "fail",
        complianceNotes: "No generated assets produced",
      };
    }
    const notes: string[] = [];
    if (copyrightStatus === "licensed_derivative") {
      notes.push("Licensed derivative — attribution and usage limits preserved");
    }
    if (editOperations.length) {
      notes.push(`${editOperations.length} edit operation(s) recorded with full traceability`);
    }
    if (generated.length >= 2) {
      notes.push("Multiple creative variants produced per specification");
    }
    return {
      qualityStatus: notes.length ? "pass_with_notes" : "pass",
      complianceNotes: notes.length ? notes.join("; ") : "All assets pass quality and copyright compliance checks",
    };
  }

  buildCreativeAssetReport(
    input: ImageCreativeWorkerInput,
    config: ImageCreativeWorkerConfiguration,
    context: CreativeContext,
    options: {
      generatedAssets?: GeneratedAssetRef[];
      editOperations?: EditOperation[];
      includeVariants?: boolean;
    } = {},
  ): CreativeAssetReport {
    creativeSequence += 1;
    const seq = creativeSequence;
    const now = new Date().toISOString();
    const scriptId = context.scriptId?.trim() || input.scriptId?.trim() || `scw-scr-icw-${seq}`;
    const creativeAssetId = input.creativeAssetId?.trim() || `icw-rpt-${Date.now()}-${seq}`;
    const channelId = context.channelId?.trim() || input.channelId?.trim() || `chn-icw-${seq}`;
    const sceneId = this.resolveSceneId(context, seq);
    const assetType =
      this.resolveAssetType(input, context) ?? (config.defaultAssetType as CreativeAssetType);
    const sourceAssets = this.normalizeSourceAssets(context.sourceAssets, seq);
    const generatedAssets =
      options.generatedAssets ??
      [
        ...this.generateOriginalGraphics(context, config, seq),
        ...this.createDiagramsAndInfographics(context, seq),
        ...this.createCoversAndBanners(context, seq),
        ...this.createSocialMediaAssets(context, seq),
      ];
    const editOperations =
      options.editOperations ?? this.recordEditOperations(sourceAssets, seq, context.editOperations);
    const variants = this.generateCreativeVariants(generatedAssets, seq);
    const { qualityStatus, complianceNotes } = this.validateQualityAndCompliance(
      generatedAssets,
      sourceAssets,
      editOperations,
    );
    const copyrightStatus = this.resolveCopyrightStatus(sourceAssets);
    const traceabilityRefs = unique([
      `script:${scriptId}`,
      `channel:${channelId}`,
      `scene:${sceneId}`,
      context.visualResearchId ? `visualResearch:${context.visualResearchId}` : null,
      context.thumbnailReportId ? `thumbnailReport:${context.thumbnailReportId}` : null,
      `assetType:${assetType}`,
      ...sourceAssets.map((a) => `source:${a.assetId}`),
    ]);
    const preservedDecisions = [
      {
        decisionId: `icw-dec-${seq}-context`,
        topic: sceneId,
        decision: "Preserved visual research and thumbnail spec context — structural signals only",
        recordedAt: now,
      },
      {
        decisionId: `icw-dec-${seq}-assets`,
        topic: assetType,
        decision: `Generated ${generatedAssets.length} creative assets with ${variants.length} variants`,
        recordedAt: now,
      },
    ];
    return {
      creativeAssetId,
      timestamp: now,
      scriptId,
      sceneId,
      assetType,
      sourceAssets,
      generatedAssets,
      editOperations,
      qualityStatus,
      copyrightStatus,
      variantCount: options.includeVariants === false ? generatedAssets.length : variants.length,
      metadataVersion: ICW_METADATA_VERSION,
      channelId,
      visualResearchId: context.visualResearchId ?? null,
      thumbnailReportId: context.thumbnailReportId ?? null,
      variants: options.includeVariants === false ? [] : variants,
      complianceNotes,
      workerId: config.workerId,
      reportVersion: ICW_REPORT_VERSION,
      traceabilityRefs,
      preservedDecisions,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverAssembleVideos: true,
      neverGenerateVoiceovers: true,
      neverPublishMedia: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ410OrLater: true,
      preserveCompleteAssetTraceability: true,
      respectCopyrightAndLicensing: true,
      preserveOriginalAssets: true,
      recordAllEditsPerformed: true,
      produceMultipleVariantsWhenAppropriate: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}

let creativeSequence = 0;

export function resetCreativeSequenceForTesting() {
  creativeSequence = 0;
}

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function cloneReport(report: CreativeAssetReport): CreativeAssetReport {
  return {
    ...report,
    sourceAssets: [...report.sourceAssets],
    generatedAssets: [...report.generatedAssets],
    editOperations: report.editOperations.map((e) => ({ ...e })),
    variants: report.variants.map((v) => ({ ...v })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
