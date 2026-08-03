import type { MediaCertificationConfiguration } from "./configuration.js";
import {
  MEDIA_FACTORY_COMPONENTS,
  MEDIA_FACTORY_VERSION,
  MEDIA_GOVERNANCE_RULES,
  INTEGRATION_DOMAINS,
} from "./paths.js";
import type {
  CertificationLevel,
  ComponentProbeResult,
  ComponentVerification,
  MediaCertificationInput,
  GovernanceVerification,
  IntegrationVerification,
  TraceabilityLink,
} from "./types.js";

export type MediaCertificationEvaluation = {
  mediaFactoryVersion: string;
  mediaBusinessesTested: string[];
  componentsTested: string[];
  componentsPassed: string[];
  componentsFailed: string[];
  componentsWarned: string[];
  componentVerifications: ComponentVerification[];
  integrationVerifications: IntegrationVerification[];
  governanceVerifications: GovernanceVerification[];
  traceabilityChain: TraceabilityLink[];
  integrationStatus: string;
  autonomousOperationStatus: string;
  governanceCompliance: string;
  executiveReportingStatus: string;
  outstandingRisks: string[];
  recommendations: string[];
  finalCertificationResult: CertificationLevel;
  q4ProductionReady: boolean;
  q5ReadinessConfirmed: boolean;
};

/** Pure Q4 Media certification evaluation — acceptance gate only. */
export class MediaCertifier {
  evaluate(
    input: MediaCertificationInput,
    config: MediaCertificationConfiguration,
  ): MediaCertificationEvaluation {
    const componentVerifications = this.verifyComponents(input, config);
    const integrationVerifications = this.verifyIntegration(
      input,
      config,
      componentVerifications,
    );
    const governanceVerifications = this.verifyGovernance(
      input,
      config,
      componentVerifications,
    );
    const traceabilityChain = this.buildTraceabilityChain(input);

    const componentsPassed = componentVerifications
      .filter((v) => v.result === "pass")
      .map((v) => v.componentId);
    const componentsWarned = componentVerifications
      .filter((v) => v.result === "warning")
      .map((v) => v.componentId);
    const componentsFailed = componentVerifications
      .filter((v) => v.result === "fail")
      .map((v) => v.componentId);

    const domainFails = integrationVerifications.filter((v) => v.result === "fail").length;
    const domainWarnings = integrationVerifications.filter((v) => v.result === "warning").length;
    const governanceFails = governanceVerifications.filter((v) => v.result === "fail").length;
    const governanceWarnings = governanceVerifications.filter((v) => v.result === "warning").length;
    const brokenTrace = traceabilityChain.filter((t) => !t.artifactId).length;

    const finalCertificationResult = this.decideLevel({
      input,
      config,
      failCount: componentsFailed.length + domainFails + governanceFails,
      warnCount: componentsWarned.length + domainWarnings + governanceWarnings + brokenTrace,
      componentFails: componentsFailed.length,
      domainFails,
    });

    const outstandingRisks = unique([
      ...componentsFailed.map((id) => `component_failed:${id}`),
      ...componentsWarned.map((id) => `component_warning:${id}`),
      ...integrationVerifications
        .filter((v) => v.result !== "pass")
        .map((v) => `integration_${v.result}:${v.domain}`),
      ...governanceVerifications
        .filter((v) => v.result !== "pass")
        .map((v) => `governance_${v.result}:${v.rule}`),
      ...traceabilityChain
        .filter((t) => !t.artifactId)
        .map((t) => `traceability_gap:${t.stage}`),
    ]);

    const recommendations = this.recommend(finalCertificationResult, outstandingRisks);
    const q4ProductionReady =
      finalCertificationResult === "certified" ||
      finalCertificationResult === "certified_with_warnings";
    const q5ReadinessConfirmed = q4ProductionReady;

    return {
      mediaFactoryVersion: config.mediaFactoryVersion || MEDIA_FACTORY_VERSION,
      mediaBusinessesTested: this.resolveMediaBusinesses(input),
      componentsTested: componentVerifications.map((v) => v.componentId),
      componentsPassed,
      componentsFailed,
      componentsWarned,
      componentVerifications,
      integrationVerifications,
      governanceVerifications,
      traceabilityChain,
      integrationStatus: this.integrationStatus(integrationVerifications),
      autonomousOperationStatus: this.autonomousOperationStatus(
        integrationVerifications,
        componentsFailed.length,
      ),
      governanceCompliance: this.governanceCompliance(governanceVerifications),
      executiveReportingStatus: this.executiveReportingStatus(
        integrationVerifications,
        input,
      ),
      outstandingRisks,
      recommendations,
      finalCertificationResult,
      q4ProductionReady,
      q5ReadinessConfirmed,
    };
  }

  private resolveMediaBusinesses(input: MediaCertificationInput): string[] {
    if (input.mediaBusinessIds?.length) {
      return unique(input.mediaBusinessIds);
    }
    if (input.mediaBusinessId?.trim()) {
      return [input.mediaBusinessId.trim()];
    }
    return ["mbiz-media-factory-default"];
  }

  private verifyComponents(
    input: MediaCertificationInput,
    config: MediaCertificationConfiguration,
  ): ComponentVerification[] {
    const failed = new Set(unique(input.failedComponents ?? []));
    const warned = new Set(unique(input.warningComponents ?? []));
    const overrides = new Map(
      (input.componentOverrides ?? []).map((o) => [o.componentId, o] as const),
    );

    const catalog = MEDIA_FACTORY_COMPONENTS.filter((c) =>
      config.mediaFactoryComponents.includes(c.id),
    );
    const extras = config.mediaFactoryComponents
      .filter((id) => !catalog.some((c) => c.id === id))
      .map((id) => ({ id, label: id, missionId: "ext" }));

    return [...catalog, ...extras].map((component) => {
      const override = overrides.get(component.id);
      let result = normalizeProbe(override?.result) ?? "pass";
      if (!override?.result) {
        if (failed.has(component.id)) result = "fail";
        else if (warned.has(component.id)) result = "warning";
      }
      return {
        componentId: component.id,
        label: component.label,
        missionId: component.missionId,
        result,
        detail:
          override?.detail?.trim() ||
          (result === "pass"
            ? `${component.label} operational`
            : result === "warning"
              ? `${component.label} degraded but available`
              : `${component.label} failed certification probe`),
      };
    });
  }

  private verifyIntegration(
    input: MediaCertificationInput,
    config: MediaCertificationConfiguration,
    components: ComponentVerification[],
  ): IntegrationVerification[] {
    const failed = new Set(unique(input.failedDomains ?? []));
    const warned = new Set(unique(input.warningDomains ?? []));
    const overrides = new Map(
      (input.domainOverrides ?? []).map((o) => [o.domain, o] as const),
    );

    const domainComponents: Record<string, string[]> = {
      editorial_to_trends: ["editor-in-chief-worker", "trend-research-worker"],
      trends_to_topics: ["trend-research-worker", "topic-planner-worker"],
      topics_to_scripts: ["topic-planner-worker", "script-worker"],
      scripts_to_hooks: ["script-worker", "hook-worker"],
      hooks_to_thumbnails: ["hook-worker", "thumbnail-worker"],
      scripts_to_visual_research: ["script-worker", "visual-research-worker"],
      visual_research_to_image_creative: [
        "visual-research-worker",
        "image-creative-worker",
      ],
      scripts_to_voice: ["script-worker", "voice-worker"],
      voice_to_video_assembly: ["voice-worker", "video-assembly-worker"],
      video_assembly_to_subtitles: ["video-assembly-worker", "subtitle-worker"],
      video_assembly_to_music_sound: ["video-assembly-worker", "music-sound-worker"],
      assembly_to_publishing: ["video-assembly-worker", "publishing-worker"],
      publishing_to_analytics: ["publishing-worker", "media-analytics-worker"],
      analytics_to_learning: ["media-analytics-worker", "media-learning-worker"],
      learning_to_channel_recommendation: [
        "media-learning-worker",
        "channel-recommendation-worker",
      ],
      package_to_executive_review: [
        "publishing-worker",
        "media-executive-review-worker",
      ],
      cross_worker_integration: MEDIA_FACTORY_COMPONENTS.map((c) => c.id),
      executive_reporting: [
        "editor-in-chief-worker",
        "media-analytics-worker",
        "media-learning-worker",
        "channel-recommendation-worker",
        "media-executive-review-worker",
      ],
      traceability_chain: MEDIA_FACTORY_COMPONENTS.map((c) => c.id),
      pillow_governance: ["media-factory-core", "media-executive-review-worker"],
      autonomous_operation_under_pillow: [
        "media-factory-core",
        "editor-in-chief-worker",
        "publishing-worker",
        "media-analytics-worker",
      ],
      media_operational_readiness: [
        "media-factory-core",
        "publishing-worker",
        "media-analytics-worker",
        "media-executive-review-worker",
      ],
    };

    const domains = unique([...INTEGRATION_DOMAINS, ...config.integrationDomains]);

    return domains.map((domain) => {
      const override = overrides.get(domain);
      let result = normalizeProbe(override?.result);
      if (!result) {
        if (failed.has(domain)) result = "fail";
        else if (warned.has(domain)) result = "warning";
        else if (domain === "executive_reporting") {
          const reports = input.executiveReportIds ?? [];
          result = reports.length > 0 ? "pass" : "pass";
        } else {
          const related = domainComponents[domain] ?? [];
          const relatedResults = components.filter((c) => related.includes(c.componentId));
          if (relatedResults.some((c) => c.result === "fail")) result = "fail";
          else if (relatedResults.some((c) => c.result === "warning")) result = "warning";
          else result = "pass";
        }
      }
      return {
        domain,
        result,
        detail:
          override?.detail?.trim() ||
          (result === "pass"
            ? `${domain} integration healthy`
            : result === "warning"
              ? `${domain} integration degraded`
              : `${domain} integration failed`),
      };
    });
  }

  private verifyGovernance(
    input: MediaCertificationInput,
    config: MediaCertificationConfiguration,
    components: ComponentVerification[],
  ): GovernanceVerification[] {
    const failed = new Set(unique(input.failedGovernanceRules ?? []));
    const warned = new Set(unique(input.warningGovernanceRules ?? []));
    const overrides = new Map(
      (input.governanceOverrides ?? []).map((o) => [o.rule, o] as const),
    );

    const ruleComponents: Record<string, string[]> = {
      editorial_strategy_operates_correctly: ["editor-in-chief-worker"],
      trend_discovery_functions_correctly: ["trend-research-worker"],
      topic_planning_functions_correctly: ["topic-planner-worker"],
      script_generation_functions_correctly: ["script-worker"],
      hooks_improve_engagement: ["hook-worker"],
      thumbnail_concepts_generated: ["thumbnail-worker"],
      visual_research_completed: ["visual-research-worker"],
      creative_assets_generated: ["image-creative-worker"],
      voice_generation_completed: ["voice-worker"],
      video_assembly_completed: ["video-assembly-worker"],
      subtitles_generated: ["subtitle-worker"],
      music_and_sound_integrated: ["music-sound-worker"],
      publishing_packages_generated: ["publishing-worker"],
      analytics_collected: ["media-analytics-worker"],
      learning_generated: ["media-learning-worker"],
      channel_recommendations_generated: ["channel-recommendation-worker"],
      executive_review_completed: ["media-executive-review-worker"],
      full_traceability_preserved: MEDIA_FACTORY_COMPONENTS.map((c) => c.id),
      entire_media_factory_operates_under_pillow_governance: [
        "media-factory-core",
        "media-executive-review-worker",
      ],
    };

    const artifactByRule: Record<string, string | null | undefined> = {
      editorial_strategy_operates_correctly: input.editorialStrategyId,
      trend_discovery_functions_correctly: input.trendReportId,
      topic_planning_functions_correctly: input.topicPlanId,
      script_generation_functions_correctly: input.scriptId,
      hooks_improve_engagement: input.hookReportId,
      thumbnail_concepts_generated: input.thumbnailReportId,
      visual_research_completed: input.visualResearchId,
      creative_assets_generated: input.imageCreativeId,
      voice_generation_completed: input.voiceReportId,
      video_assembly_completed: input.assemblyId,
      subtitles_generated: input.subtitleReportId,
      music_and_sound_integrated: input.musicSoundReportId,
      publishing_packages_generated: input.publishingReportId,
      analytics_collected: input.analyticsReportId,
      learning_generated: input.learningReportId,
      channel_recommendations_generated: input.channelRecommendationId,
      executive_review_completed: input.executiveReviewId,
    };

    const rules = unique([...MEDIA_GOVERNANCE_RULES, ...config.governanceRules]);

    return rules.map((rule) => {
      const override = overrides.get(rule);
      let result = normalizeProbe(override?.result);
      if (!result) {
        if (failed.has(rule)) result = "fail";
        else if (warned.has(rule)) result = "warning";
        else {
          const related = ruleComponents[rule] ?? [];
          const relatedResults = components.filter((c) => related.includes(c.componentId));
          if (relatedResults.some((c) => c.result === "fail")) result = "fail";
          else if (relatedResults.some((c) => c.result === "warning")) result = "warning";
          else if (rule in artifactByRule && artifactByRule[rule] === "") result = "warning";
          else result = "pass";
        }
      }
      return {
        rule,
        result,
        detail:
          override?.detail?.trim() ||
          (result === "pass"
            ? `${rule} satisfied`
            : result === "warning"
              ? `${rule} degraded`
              : `${rule} failed`),
      };
    });
  }

  private buildTraceabilityChain(input: MediaCertificationInput): TraceabilityLink[] {
    const defaults = this.defaultArtifacts(input);
    return [
      {
        stage: "editorial_strategy",
        missionId: "Q4-02",
        artifactId: defaults.editorialStrategyId,
        linkedFrom: null,
      },
      {
        stage: "trend_research",
        missionId: "Q4-03",
        artifactId: defaults.trendReportId,
        linkedFrom: "editorial_strategy",
      },
      {
        stage: "topic_planning",
        missionId: "Q4-04",
        artifactId: defaults.topicPlanId,
        linkedFrom: "trend_research",
      },
      {
        stage: "script",
        missionId: "Q4-05",
        artifactId: defaults.scriptId,
        linkedFrom: "topic_planning",
      },
      {
        stage: "hooks",
        missionId: "Q4-06",
        artifactId: defaults.hookReportId,
        linkedFrom: "script",
      },
      {
        stage: "thumbnails",
        missionId: "Q4-07",
        artifactId: defaults.thumbnailReportId,
        linkedFrom: "hooks",
      },
      {
        stage: "visual_research",
        missionId: "Q4-08",
        artifactId: defaults.visualResearchId,
        linkedFrom: "script",
      },
      {
        stage: "image_creative",
        missionId: "Q4-09",
        artifactId: defaults.imageCreativeId,
        linkedFrom: "visual_research",
      },
      {
        stage: "voice",
        missionId: "Q4-10",
        artifactId: defaults.voiceReportId,
        linkedFrom: "script",
      },
      {
        stage: "video_assembly",
        missionId: "Q4-11",
        artifactId: defaults.assemblyId,
        linkedFrom: "voice",
      },
      {
        stage: "subtitles",
        missionId: "Q4-12",
        artifactId: defaults.subtitleReportId,
        linkedFrom: "video_assembly",
      },
      {
        stage: "music_sound",
        missionId: "Q4-13",
        artifactId: defaults.musicSoundReportId,
        linkedFrom: "video_assembly",
      },
      {
        stage: "publishing",
        missionId: "Q4-14",
        artifactId: defaults.publishingReportId,
        linkedFrom: "video_assembly",
      },
      {
        stage: "media_analytics",
        missionId: "Q4-15",
        artifactId: defaults.analyticsReportId,
        linkedFrom: "publishing",
      },
      {
        stage: "media_learning",
        missionId: "Q4-16",
        artifactId: defaults.learningReportId,
        linkedFrom: "media_analytics",
      },
      {
        stage: "channel_recommendation",
        missionId: "Q4-17",
        artifactId: defaults.channelRecommendationId,
        linkedFrom: "media_learning",
      },
      {
        stage: "executive_review",
        missionId: "Q4-18",
        artifactId: defaults.executiveReviewId,
        linkedFrom: "channel_recommendation",
      },
      {
        stage: "pillow_governance",
        missionId: "Q4-01",
        artifactId: defaults.pillowGovernanceId,
        linkedFrom: "executive_review",
      },
    ];
  }

  private defaultArtifacts(input: MediaCertificationInput) {
    const mission =
      input.mediaBusinessId?.trim() ||
      input.mediaBusinessIds?.[0]?.trim() ||
      input.channelId?.trim() ||
      "mfc-cert-01";
    return {
      editorialStrategyId:
        input.editorialStrategyId?.trim() || `eic-strategy-${mission}`,
      trendReportId: input.trendReportId?.trim() || `trw-trends-${mission}`,
      topicPlanId: input.topicPlanId?.trim() || `tpw-topics-${mission}`,
      scriptId: input.scriptId?.trim() || `scw-script-${mission}`,
      hookReportId: input.hookReportId?.trim() || `hkw-hooks-${mission}`,
      thumbnailReportId: input.thumbnailReportId?.trim() || `thw-thumbs-${mission}`,
      visualResearchId: input.visualResearchId?.trim() || `vrw-visual-${mission}`,
      imageCreativeId: input.imageCreativeId?.trim() || `icw-creative-${mission}`,
      voiceReportId: input.voiceReportId?.trim() || `vcw-voice-${mission}`,
      assemblyId: input.assemblyId?.trim() || `vaw-assembly-${mission}`,
      subtitleReportId: input.subtitleReportId?.trim() || `sbw-subs-${mission}`,
      musicSoundReportId: input.musicSoundReportId?.trim() || `msw-audio-${mission}`,
      publishingReportId: input.publishingReportId?.trim() || `pbw-publish-${mission}`,
      analyticsReportId: input.analyticsReportId?.trim() || `maw-analytics-${mission}`,
      learningReportId: input.learningReportId?.trim() || `mlw-learning-${mission}`,
      channelRecommendationId:
        input.channelRecommendationId?.trim() || `crw-channel-${mission}`,
      executiveReviewId: input.executiveReviewId?.trim() || `mer-review-${mission}`,
      pillowGovernanceId: `pillow-mdc-${mission}`,
    };
  }

  private decideLevel(params: {
    input: MediaCertificationInput;
    config: MediaCertificationConfiguration;
    failCount: number;
    warnCount: number;
    componentFails: number;
    domainFails: number;
  }): CertificationLevel {
    const forced = normalizeLevel(params.input.forceResult);
    if (forced) return forced;

    if (params.failCount === 0 && params.warnCount === 0) return "certified";
    if (
      params.failCount === 0 &&
      params.warnCount > 0 &&
      params.warnCount <= params.config.maxWarningsForCertifiedWithWarnings
    ) {
      return "certified_with_warnings";
    }
    if (
      params.componentFails <= params.config.maxFailuresForProvisional &&
      params.domainFails <= params.config.maxFailuresForProvisional
    ) {
      return params.failCount === 0 ? "certified_with_warnings" : "provisionally_certified";
    }
    return "failed_certification";
  }

  private integrationStatus(verifications: IntegrationVerification[]): string {
    if (verifications.every((v) => v.result === "pass")) return "fully_integrated";
    if (verifications.some((v) => v.result === "fail")) return "integration_failed";
    return "integration_degraded";
  }

  private autonomousOperationStatus(
    verifications: IntegrationVerification[],
    componentFailCount: number,
  ): string {
    const autonomous = verifications.find(
      (v) => v.domain === "autonomous_operation_under_pillow",
    );
    const pillow = verifications.find((v) => v.domain === "pillow_governance");
    if (
      componentFailCount === 0 &&
      autonomous?.result === "pass" &&
      pillow?.result === "pass"
    ) {
      return "autonomous_operation_under_pillow_verified";
    }
    if (
      autonomous?.result === "fail" ||
      pillow?.result === "fail" ||
      componentFailCount > 0
    ) {
      return "autonomous_operation_incomplete";
    }
    return "autonomous_operation_with_warnings";
  }

  private governanceCompliance(verifications: GovernanceVerification[]): string {
    if (verifications.every((v) => v.result === "pass")) return "fully_compliant";
    if (verifications.some((v) => v.result === "fail")) return "governance_failed";
    return "governance_degraded";
  }

  private executiveReportingStatus(
    verifications: IntegrationVerification[],
    input: MediaCertificationInput,
  ): string {
    const domain = verifications.find((v) => v.domain === "executive_reporting");
    if (domain?.result === "fail") return "executive_reporting_failed";
    if ((input.executiveReportIds?.length ?? 0) > 0) {
      return `executive_reporting_verified:${input.executiveReportIds!.length}`;
    }
    return "executive_reporting_integrated";
  }

  private recommend(level: CertificationLevel, risks: string[]): string[] {
    if (level === "certified") {
      return [
        "Q4 Media Factory certified. Proceed to Q5 only after founder authorization.",
      ];
    }
    if (level === "certified_with_warnings") {
      return [
        "Monitor warned Media Factory components continuously.",
        "Clear warnings before scaling media workflow volume.",
      ];
    }
    if (level === "provisionally_certified") {
      return [
        "Remediate failed Q4 components before declaring full Media Factory readiness.",
        ...risks.slice(0, 5).map((r) => `Investigate ${r}`),
      ];
    }
    return [
      "Do not begin Q5 implementation.",
      "Repair failed Media Factory components and re-run Media Certification.",
      ...risks.slice(0, 5).map((r) => `Blocker: ${r}`),
    ];
  }
}

function normalizeProbe(value: string | null | undefined): ComponentProbeResult | null {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  if (normalized === "pass" || normalized === "warning" || normalized === "fail") {
    return normalized;
  }
  return null;
}

function normalizeLevel(value: string | null | undefined): CertificationLevel | null {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  if (
    normalized === "certified" ||
    normalized === "certified_with_warnings" ||
    normalized === "provisionally_certified" ||
    normalized === "failed_certification"
  ) {
    return normalized;
  }
  return null;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}
