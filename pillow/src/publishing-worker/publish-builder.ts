import type { PublishingWorkerConfiguration } from "./configuration.js";
import {
  APPROVAL_STATUSES,
  PBW_METADATA_VERSION,
  PBW_REPORT_VERSION,
  PUBLISHING_PLATFORMS,
  READINESS_STATUSES,
} from "./paths.js";
import type {
  ApprovalStatus,
  IntegrationHandshake,
  PlaylistRef,
  PublishContext,
  PublishingPlatform,
  PublishingReadiness,
  PublishingReport,
  PublishingWorkerCatalog,
  PublishingWorkerInput,
  ThumbnailReference,
  UploadPackage,
} from "./types.js";

const TITLE_LIMITS: Record<PublishingPlatform, number> = {
  youtube: 100,
  tiktok: 100,
  instagram: 100,
  facebook: 100,
  x: 70,
  linkedin: 150,
};

const PLAYLIST_NAMES: Record<PublishingPlatform, string> = {
  youtube: "EmpireAI Insights",
  tiktok: "EmpireAI Shorts",
  instagram: "EmpireAI Reels",
  facebook: "EmpireAI Updates",
  x: "EmpireAI Threads",
  linkedin: "EmpireAI Professional",
};

const PLATFORM_DEFAULT_TAGS: Record<PublishingPlatform, string[]> = {
  youtube: ["empireai", "media", "insights", "strategy", "growth"],
  tiktok: ["empireai", "media", "shorts", "tips", "growth"],
  instagram: ["empireai", "media", "reels", "brand", "growth"],
  facebook: ["empireai", "media", "updates", "community", "growth"],
  x: ["empireai", "media", "news", "strategy", "growth"],
  linkedin: ["empireai", "media", "leadership", "business", "strategy"],
};

/** Pure Publishing Worker helpers for Q4-14 — structural signals only. */
export class PublishBuilder {
  buildCatalog(
    config: PublishingWorkerConfiguration,
    reports: PublishingReport[],
    integrations: IntegrationHandshake[],
  ): PublishingWorkerCatalog {
    return {
      reportVersion: PBW_REPORT_VERSION,
      workerId: config.workerId,
      publishingReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      supportedPlatforms: [...PUBLISHING_PLATFORMS],
      readinessStatuses: [...READINESS_STATUSES],
      metadataVersion: PBW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverAutomaticallyPublishContent: true,
      neverModifyApprovedMediaAssets: true,
      neverOverrideApprovalWorkflows: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ415OrLater: true,
    };
  }

  mergeContext(input: PublishingWorkerInput, context: PublishContext): PublishContext {
    const receivedMedia =
      context.receivedMedia ||
      Boolean(input.mediaId?.trim()) ||
      Boolean(input.mediaAssetRefs?.length);
    return {
      mediaId: input.mediaId ?? context.mediaId ?? null,
      channelId: input.channelId ?? context.channelId ?? null,
      assemblyId: input.assemblyId ?? context.assemblyId ?? null,
      scriptId: input.scriptId ?? context.scriptId ?? null,
      targetPlatform:
        this.resolvePlatform(input.targetPlatform) ?? context.targetPlatform ?? null,
      videoTitle: input.videoTitle ?? context.videoTitle ?? null,
      description: input.description ?? context.description ?? null,
      tags: input.tags ?? context.tags ?? [],
      thumbnailId: input.thumbnailId ?? context.thumbnailId ?? null,
      thumbnailPath: input.thumbnailPath ?? context.thumbnailPath ?? null,
      playlistName: input.playlistName ?? context.playlistName ?? null,
      scheduledPublishTime: input.scheduledPublishTime ?? context.scheduledPublishTime ?? null,
      mediaAssetRefs: input.mediaAssetRefs ?? context.mediaAssetRefs ?? [],
      topicTitle: input.topicTitle ?? context.topicTitle ?? null,
      hookText: input.hookText ?? context.hookText ?? null,
      narrationReadyText: input.narrationReadyText ?? context.narrationReadyText ?? null,
      approvalStatus:
        this.resolveApproval(input.approvalStatus) ?? context.approvalStatus ?? null,
      pillowAuthorized: input.pillowAuthorized ?? context.pillowAuthorized ?? undefined,
      receivedMedia,
      thumbnailReference: context.thumbnailReference ?? null,
      playlist: context.playlist ?? null,
      uploadPackage: context.uploadPackage ?? null,
      publishingReadiness: context.publishingReadiness ?? null,
    };
  }

  canPreparePublishing(context: PublishContext): { ready: boolean; reason?: string } {
    if (!context.receivedMedia) {
      return { ready: false, reason: "Completed media assets required before publishing preparation" };
    }
    if (!context.mediaId) {
      return { ready: false, reason: "Media ID required for publishing preparation" };
    }
    return { ready: true };
  }

  resolvePlatform(raw: string | null | undefined): PublishingPlatform | null {
    if (!raw) return null;
    return (PUBLISHING_PLATFORMS as readonly string[]).includes(raw)
      ? (raw as PublishingPlatform)
      : null;
  }

  resolveApproval(raw: string | null | undefined): ApprovalStatus | null {
    if (!raw) return null;
    return (APPROVAL_STATUSES as readonly string[]).includes(raw)
      ? (raw as ApprovalStatus)
      : null;
  }

  defaultPlatform(
    context: PublishContext,
    config: PublishingWorkerConfiguration,
  ): PublishingPlatform {
    return (
      context.targetPlatform ??
      this.resolvePlatform(config.defaultPlatform) ??
      "youtube"
    );
  }

  generateOptimizedVideoTitle(
    context: PublishContext,
    platform: PublishingPlatform,
  ): string {
    const limit = TITLE_LIMITS[platform];
    let title =
      context.videoTitle?.trim() ||
      context.topicTitle?.trim() ||
      context.hookText?.trim() ||
      "";
    const fromNarration =
      !title && Boolean(context.narrationReadyText?.trim());
    if (fromNarration) {
      const narration = context.narrationReadyText!.trim().split(/[.!?]/)[0] ?? "";
      title = `What You Need to Know: ${narration}`.trim();
    }
    if (!title) {
      title = `EmpireAI ${platform} Briefing`;
    }
    if (title.length > limit) {
      title = `${title.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
    }
    return title;
  }

  generatePlatformDescription(
    context: PublishContext,
    platform: PublishingPlatform,
    title: string,
  ): string {
    if (context.description?.trim()) return context.description.trim();
    const hook =
      context.hookText?.trim() ||
      context.topicTitle?.trim() ||
      title;
    const narrationSnippet = context.narrationReadyText?.trim()
      ? context.narrationReadyText.trim().slice(0, 180)
      : "";
    switch (platform) {
      case "youtube":
        return [
          hook,
          "",
          narrationSnippet || "Explore the latest EmpireAI media insights.",
          "",
          "Timestamps:",
          "0:00 Intro",
          "0:30 Key insight",
          "1:30 Takeaways",
          "",
          "Like, subscribe, and turn on notifications for more.",
        ].join("\n");
      case "x":
        return `${hook}${narrationSnippet ? ` — ${narrationSnippet.slice(0, 80)}` : ""}`.slice(
          0,
          280,
        );
      case "linkedin":
        return [
          hook,
          "",
          narrationSnippet ||
            "A concise professional briefing for operators building durable media systems.",
          "",
          "Key takeaway: prepare publishing packages with approval gates before any distribution.",
          "",
          "#EmpireAI #Media #Leadership",
        ].join("\n");
      case "tiktok":
      case "instagram":
        return `${hook}${narrationSnippet ? ` ${narrationSnippet.slice(0, 100)}` : ""} Follow for more EmpireAI media strategy.`.slice(
          0,
          2200,
        );
      case "facebook":
        return [
          hook,
          "",
          narrationSnippet || "Share-ready EmpireAI media update for the community.",
          "",
          "Comment with your takeaway — and await Pillow approval before any publish.",
        ].join("\n");
      default:
        return hook;
    }
  }

  generateTagsAndKeywords(
    context: PublishContext,
    platform: PublishingPlatform,
    title: string,
    description: string,
  ): string[] {
    // Empty-array trap: use .length, not truthiness of []
    if (context.tags && context.tags.length > 0) {
      return unique(context.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)).slice(0, 15);
    }
    const corpus = [
      title,
      description,
      context.narrationReadyText ?? "",
      context.topicTitle ?? "",
      context.hookText ?? "",
    ]
      .join(" ")
      .toLowerCase();
    const derived = corpus
      .replace(/[^a-z0-9\s#-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && w.length <= 24)
      .filter((w) => !STOP_WORDS.has(w));
    const tags = unique([...PLATFORM_DEFAULT_TAGS[platform], ...derived]);
    while (tags.length < 5) {
      tags.push(`empireai-${tags.length + 1}`);
    }
    return tags.slice(0, 15);
  }

  selectApprovedThumbnail(context: PublishContext, seq: number): ThumbnailReference {
    const thumbnailId =
      context.thumbnailId?.trim() ||
      context.thumbnailReference?.thumbnailId ||
      `thw-thumb-${seq}`;
    const assetPath =
      context.thumbnailPath?.trim() ||
      context.thumbnailReference?.assetPath ||
      `assets/thumbnails/${thumbnailId}.descriptor.json`;
    return {
      thumbnailId,
      assetPath,
      approved: true,
    };
  }

  generatePlaylist(
    context: PublishContext,
    platform: PublishingPlatform,
    seq: number,
  ): PlaylistRef {
    const name =
      context.playlistName?.trim() ||
      context.playlist?.name ||
      PLAYLIST_NAMES[platform];
    return {
      playlistId: context.playlist?.playlistId || `pbw-pl-${platform}-${seq}`,
      name,
      platform,
    };
  }

  generatePublishingSchedule(context: PublishContext): string {
    if (context.scheduledPublishTime?.trim()) {
      const parsed = Date.parse(context.scheduledPublishTime);
      if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
      return context.scheduledPublishTime.trim();
    }
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }

  preparePlatformUploadPackage(
    context: PublishContext,
    platform: PublishingPlatform,
    title: string,
    description: string,
    tags: string[],
    thumbnail: ThumbnailReference,
    playlist: PlaylistRef,
    seq: number,
  ): UploadPackage {
    const mediaId = context.mediaId?.trim() || `media-pbw-${seq}`;
    // Empty-array trap: regenerate when mediaAssetRefs is empty []
    const assetRefs =
      context.mediaAssetRefs && context.mediaAssetRefs.length > 0
        ? unique([...context.mediaAssetRefs, mediaId, thumbnail.thumbnailId])
        : unique([
            mediaId,
            thumbnail.thumbnailId,
            `assets/media/${mediaId}.descriptor.json`,
            thumbnail.assetPath,
          ]);
    return {
      packageId: `pbw-pkg-${seq}-${platform}`,
      platform,
      mediaId,
      title,
      description,
      tags: [...tags],
      thumbnailId: thumbnail.thumbnailId,
      playlistId: playlist.playlistId,
      assetRefs,
      packagePath: `packages/publishing/pbw-${seq}-${platform}.package.json`,
    };
  }

  validatePublishingReadiness(
    context: PublishContext,
    title: string,
    tags: string[],
    thumbnail: ThumbnailReference,
    platform: PublishingPlatform,
  ): PublishingReadiness {
    const approval =
      context.approvalStatus ??
      this.resolveApproval(null) ??
      "not_requested";
    if (approval === "rejected") {
      return {
        status: "blocked",
        platformValidated: false,
        approvalValidated: false,
        metadataComplete: Boolean(title && tags.length && thumbnail.thumbnailId),
        notes: "Approval rejected — publishing package blocked",
        score: 60,
      };
    }
    const approved = approval === "approved";
    const pillowAuthorized = context.pillowAuthorized === true;
    if (!approved && !pillowAuthorized) {
      return {
        status: "pending_approval",
        platformValidated: true,
        approvalValidated: false,
        metadataComplete: Boolean(title?.trim() && tags.length >= 5 && thumbnail.thumbnailId),
        notes: "Awaiting Pillow / Grand King approval before any publish",
        score: 75,
      };
    }
    if (!title?.trim() || tags.length === 0 || !thumbnail.thumbnailId) {
      return {
        status: "not_ready",
        platformValidated: Boolean(platform),
        approvalValidated: approved || pillowAuthorized,
        metadataComplete: false,
        notes: "Missing title, tags, or thumbnail for publishing readiness",
        score: 65,
      };
    }
    let score = 88;
    if (tags.length >= 5) score += 4;
    if (approved) score += 4;
    if (pillowAuthorized) score += 2;
    if (context.mediaAssetRefs && context.mediaAssetRefs.length > 0) score += 2;
    score = Math.max(60, Math.min(100, score));
    return {
      status: "ready",
      platformValidated: true,
      approvalValidated: true,
      metadataComplete: true,
      notes: `Platform ${platform} package validated — structural readiness only; never auto-publish`,
      score,
    };
  }

  buildPublishingReport(
    input: PublishingWorkerInput,
    config: PublishingWorkerConfiguration,
    context: PublishContext,
    options: {
      videoTitle?: string;
      description?: string;
      tags?: string[];
      thumbnailReference?: ThumbnailReference;
      playlist?: PlaylistRef;
      scheduledPublishTime?: string;
      uploadPackage?: UploadPackage;
      publishingReadiness?: PublishingReadiness;
    } = {},
  ): PublishingReport {
    publishSequence += 1;
    const seq = publishSequence;
    const now = new Date().toISOString();
    const platform = this.defaultPlatform(context, config);
    const mediaId = context.mediaId?.trim() || input.mediaId?.trim() || `media-pbw-${seq}`;
    const publishingReportId =
      input.publishingReportId?.trim() || `pbw-rpt-${Date.now()}-${seq}`;
    const channelId = context.channelId?.trim() || input.channelId?.trim() || `chn-pbw-${seq}`;
    const approvalStatus: ApprovalStatus =
      context.approvalStatus ??
      this.resolveApproval(input.approvalStatus) ??
      "not_requested";

    const title =
      options.videoTitle ??
      context.videoTitle ??
      this.generateOptimizedVideoTitle({ ...context, mediaId }, platform);
    const description =
      options.description ??
      context.description ??
      this.generatePlatformDescription({ ...context, mediaId }, platform, title);
    // Empty-array trap for tags
    const tags =
      options.tags ??
      (context.tags && context.tags.length > 0
        ? context.tags
        : this.generateTagsAndKeywords({ ...context, mediaId }, platform, title, description));
    const thumbnail =
      options.thumbnailReference ??
      context.thumbnailReference ??
      this.selectApprovedThumbnail({ ...context, mediaId }, seq);
    const playlist =
      options.playlist ??
      context.playlist ??
      this.generatePlaylist({ ...context, mediaId }, platform, seq);
    const scheduledPublishTime =
      options.scheduledPublishTime ??
      context.scheduledPublishTime ??
      this.generatePublishingSchedule(context);
    const uploadPackage =
      options.uploadPackage ??
      context.uploadPackage ??
      this.preparePlatformUploadPackage(
        { ...context, mediaId },
        platform,
        title,
        description,
        tags,
        thumbnail,
        playlist,
        seq,
      );
    const publishingReadiness =
      options.publishingReadiness ??
      context.publishingReadiness ??
      this.validatePublishingReadiness(
        { ...context, mediaId, approvalStatus },
        title,
        tags,
        thumbnail,
        platform,
      );

    return {
      publishingReportId,
      timestamp: now,
      mediaId,
      targetPlatform: platform,
      videoTitle: title,
      description,
      tags: [...tags],
      thumbnailReference: { ...thumbnail, approved: true },
      playlist: { ...playlist },
      scheduledPublishTime,
      uploadPackage: {
        ...uploadPackage,
        tags: [...uploadPackage.tags],
        assetRefs: [...uploadPackage.assetRefs],
      },
      publishingReadiness: { ...publishingReadiness },
      metadataVersion: PBW_METADATA_VERSION,
      channelId,
      assemblyId: context.assemblyId ?? null,
      scriptId: context.scriptId ?? null,
      workerId: config.workerId,
      reportVersion: PBW_REPORT_VERSION,
      approvalStatus,
      pillowAuthorizationRequired: true,
      automaticallyPublishAuthorized: false,
      traceabilityRefs: unique([
        `media:${mediaId}`,
        `channel:${channelId}`,
        `platform:${platform}`,
        context.assemblyId ? `assembly:${context.assemblyId}` : null,
        context.scriptId ? `script:${context.scriptId}` : null,
        `thumbnail:${thumbnail.thumbnailId}`,
        `playlist:${playlist.playlistId}`,
        `package:${uploadPackage.packageId}`,
        `readiness:${publishingReadiness.status}`,
        `approval:${approvalStatus}`,
        ...uploadPackage.assetRefs.map((a) => `asset:${a}`),
      ]),
      preservedDecisions: [
        {
          decisionId: `pbw-dec-${seq}-no-auto-publish`,
          topic: mediaId,
          decision:
            "Prepared platform upload package only — never automatically publish content",
          recordedAt: now,
        },
        {
          decisionId: `pbw-dec-${seq}-approval`,
          topic: platform,
          decision: `Validated approval status (${approvalStatus}) before publication readiness`,
          recordedAt: now,
        },
      ],
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverAutomaticallyPublishContent: true,
      neverModifyApprovedMediaAssets: true,
      neverOverrideApprovalWorkflows: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ415OrLater: true,
      preserveCompleteAssetTraceability: true,
      preservePublishingMetadataHistory: true,
      validatePlatformRequirements: true,
      validateApprovalStatusBeforePublication: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}

let publishSequence = 0;

export function resetPublishSequenceForTesting() {
  publishSequence = 0;
}

const STOP_WORDS = new Set([
  "that",
  "this",
  "with",
  "from",
  "your",
  "have",
  "will",
  "what",
  "when",
  "where",
  "which",
  "about",
  "into",
  "than",
  "then",
  "them",
  "they",
  "their",
  "there",
  "been",
  "were",
  "more",
  "most",
  "also",
  "just",
  "like",
  "need",
  "know",
]);

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function cloneReport(report: PublishingReport): PublishingReport {
  return {
    ...report,
    tags: [...report.tags],
    thumbnailReference: { ...report.thumbnailReference, approved: true },
    playlist: { ...report.playlist },
    uploadPackage: {
      ...report.uploadPackage,
      tags: [...report.uploadPackage.tags],
      assetRefs: [...report.uploadPackage.assetRefs],
    },
    publishingReadiness: { ...report.publishingReadiness },
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
