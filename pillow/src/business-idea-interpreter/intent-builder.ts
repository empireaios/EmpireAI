import type { BusinessIdeaInterpreterConfiguration } from "./configuration.js";
import {
  BII_METADATA_VERSION,
  BUSINESS_INTENT_VERSION,
  BUSINESS_TYPES,
} from "./paths.js";
import type {
  BusinessIdeaInterpreterCatalog,
  BusinessIdeaInterpreterInput,
  BusinessType,
  MissingInformationField,
  StructuredBusinessIntent,
} from "./types.js";

/** Pure Business Idea Interpreter helpers for Q2-02 — interpret intent only. */
export class IntentBuilder {
  buildCatalog(
    config: BusinessIdeaInterpreterConfiguration,
    intents: StructuredBusinessIntent[],
  ): BusinessIdeaInterpreterCatalog {
    return {
      intentVersion: BUSINESS_INTENT_VERSION,
      businessTypes: [...config.businessTypes],
      intents: intents.map(cloneIntent),
      metadataVersion: BII_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverGenerateBusinessModels: true,
      neverResearchMarkets: true,
      neverBuildBusinesses: true,
      neverAssignWorkers: true,
      neverExecuteAnything: true,
      neverImplementQ203OrLater: true,
    };
  }

  interpret(
    input: BusinessIdeaInterpreterInput,
    config: BusinessIdeaInterpreterConfiguration,
  ): StructuredBusinessIntent {
    intentSequence += 1;
    const originalCommand = input.originalCommand?.trim() || "";
    const businessType = this.identifyBusinessType(originalCommand, config, input.businessType);
    const businessIdea =
      input.businessIdea?.trim() || this.extractBusinessIdea(originalCommand, businessType);
    const targetCustomer =
      normalizeNullable(input.targetCustomer) ?? this.extractTargetCustomer(originalCommand);
    const productServiceCategory =
      normalizeNullable(input.productServiceCategory) ??
      this.extractProductServiceCategory(originalCommand, businessType);
    const channelPlatform =
      normalizeNullable(input.channelPlatform) ?? this.extractChannelPlatform(originalCommand);
    const constraints =
      input.constraints?.map((c) => c.trim()).filter(Boolean) ??
      this.extractConstraints(originalCommand);
    const successObjective =
      normalizeNullable(input.successObjective) ?? this.extractSuccessObjective(originalCommand);

    const missingInformation = this.identifyMissingInformation({
      businessType,
      targetCustomer,
      productServiceCategory,
      channelPlatform,
      constraints,
      successObjective,
      config,
    });

    const confidenceScore = this.scoreConfidence({
      originalCommand,
      businessType,
      businessIdea,
      targetCustomer,
      productServiceCategory,
      channelPlatform,
      constraints,
      successObjective,
      missingInformation,
      config,
    });

    return {
      intentId: input.intentId?.trim() || `bii-intent-${Date.now()}-${intentSequence}`,
      timestamp: new Date().toISOString(),
      originalCommand: originalCommand || "Build a business.",
      businessType,
      businessIdea,
      targetCustomer,
      productServiceCategory,
      channelPlatform,
      constraints,
      successObjective,
      confidenceScore,
      missingInformation,
      metadataVersion: BII_METADATA_VERSION,
      intentVersion: BUSINESS_INTENT_VERSION,
      preparedForLaterQ2Missions: true,
      neverGenerateBusinessModels: true,
      neverResearchMarkets: true,
      neverBuildBusinesses: true,
      neverAssignWorkers: true,
      neverExecuteAnything: true,
      neverImplementQ203OrLater: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  identifyBusinessType(
    command: string,
    config: BusinessIdeaInterpreterConfiguration,
    explicit?: string | null,
  ): BusinessType | string {
    if (explicit?.trim()) {
      return normalizeToken(explicit);
    }
    const text = command.toLowerCase();
    const rules: Array<{ type: BusinessType; patterns: RegExp[] }> = [
      { type: "media", patterns: [/\bmedia\b/, /\bcontent\b/, /\bpublish/] },
      { type: "commerce", patterns: [/\bcommerce\b/, /\be-?commerce\b/, /\bstore\b/, /\bretail\b/] },
      { type: "local_cleaning", patterns: [/\bcleaning\b/, /\bcleaner\b/, /\bjanitorial\b/] },
      { type: "affiliate", patterns: [/\baffiliate\b/, /\breferral\b/] },
      {
        type: "digital_product",
        patterns: [/\bdigital product\b/, /\binfo[- ]?product\b/, /\be-?book\b/, /\bcourse\b/],
      },
      { type: "local_services", patterns: [/\blocal service/, /\blocal business\b/] },
      { type: "saas", patterns: [/\bsaas\b/, /\bsoftware as a service\b/] },
      { type: "agency", patterns: [/\bagency\b/] },
    ];
    for (const rule of rules) {
      if (!config.businessTypes.includes(rule.type)) continue;
      if (rule.patterns.some((p) => p.test(text))) return rule.type;
    }
    return "unknown";
  }

  extractBusinessIdea(command: string, businessType: string): string {
    const cleaned = command
      .trim()
      .replace(/^[.\s]+|[.\s]+$/g, "")
      .replace(/\.$/, "");
    if (cleaned) return cleaned;
    return `Build a ${businessType.replace(/_/g, " ")} business`;
  }

  extractTargetCustomer(command: string): string | null {
    const patterns = [
      /\bfor\s+([a-z0-9][\w\s-]{1,60}?)(?:\s+via|\s+on|\s+with|\s+under|\s+to\s+achieve|\.|$)/i,
      /\btarget(?:ing)?\s+([a-z0-9][\w\s-]{1,60}?)(?:\s+via|\s+on|\.|$)/i,
      /\bserving\s+([a-z0-9][\w\s-]{1,60}?)(?:\s+via|\s+on|\.|$)/i,
    ];
    for (const pattern of patterns) {
      const match = command.match(pattern);
      if (match?.[1]) {
        const value = cleanPhrase(match[1]);
        if (value && !isNoisePhrase(value)) return value;
      }
    }
    return null;
  }

  extractProductServiceCategory(command: string, businessType: string): string | null {
    const patterns = [
      /\b(?:selling|offering|providing)\s+([a-z0-9][\w\s-]{1,60}?)(?:\s+for|\s+via|\s+on|\.|$)/i,
      /\bfocused on\s+([a-z0-9][\w\s-]{1,60}?)(?:\s+for|\s+via|\.|$)/i,
    ];
    for (const pattern of patterns) {
      const match = command.match(pattern);
      if (match?.[1]) {
        const value = cleanPhrase(match[1]);
        if (value) return value;
      }
    }
    if (businessType !== "unknown") return businessType.replace(/_/g, " ");
    return null;
  }

  extractChannelPlatform(command: string): string | null {
    const patterns = [
      /\bvia\s+([a-z0-9][\w\s./-]{1,40}?)(?:\s+with|\s+under|\s+to\s+achieve|\.|$)/i,
      /\bon\s+([a-z0-9][\w\s./-]{1,40}?)(?:\s+with|\s+under|\s+to\s+achieve|\.|$)/i,
      /\bthrough\s+([a-z0-9][\w\s./-]{1,40}?)(?:\s+with|\s+under|\.|$)/i,
    ];
    for (const pattern of patterns) {
      const match = command.match(pattern);
      if (match?.[1]) {
        const value = cleanPhrase(match[1]);
        if (value && !isNoisePhrase(value)) return value;
      }
    }
    return null;
  }

  extractConstraints(command: string): string[] {
    const constraints: string[] = [];
    const underBudget = command.match(/\bunder\s+\$?\s*([\d,]+(?:\.\d+)?)\b/i);
    if (underBudget?.[1]) constraints.push(`budget_under_${underBudget[1].replace(/,/g, "")}`);

    const maxMonths = command.match(/\bwithin\s+(\d+)\s+months?\b/i);
    if (maxMonths?.[1]) constraints.push(`timeline_within_${maxMonths[1]}_months`);

    const noHire = /\bno\s+hiring\b/i.test(command) || /\bsolo\b/i.test(command);
    if (noHire) constraints.push("solo_or_no_hiring");

    const localOnly = /\blocal only\b/i.test(command) || /\bnearby only\b/i.test(command);
    if (localOnly) constraints.push("local_only");

    return unique(constraints);
  }

  extractSuccessObjective(command: string): string | null {
    const patterns = [
      /\bto achieve\s+([^.]+)/i,
      /\baim(?:ing)? to\s+([^.]+)/i,
      /\bgoal(?: is)? to\s+([^.]+)/i,
      /\bsuccess means\s+([^.]+)/i,
    ];
    for (const pattern of patterns) {
      const match = command.match(pattern);
      if (match?.[1]) {
        const value = cleanPhrase(match[1]);
        if (value) return value;
      }
    }
    return null;
  }

  identifyMissingInformation(params: {
    businessType: string;
    targetCustomer: string | null;
    productServiceCategory: string | null;
    channelPlatform: string | null;
    constraints: string[];
    successObjective: string | null;
    config: BusinessIdeaInterpreterConfiguration;
  }): Array<MissingInformationField | string> {
    if (!params.config.missingInformationRulesEnabled) return [];
    const missing: Array<MissingInformationField | string> = [];
    const tracked = new Set(params.config.missingInformationFields);

    if (tracked.has("business_type") && params.businessType === "unknown") {
      missing.push("business_type");
    }
    if (tracked.has("target_customer") && !params.targetCustomer) missing.push("target_customer");
    if (tracked.has("product_service_category") && !params.productServiceCategory) {
      missing.push("product_service_category");
    }
    if (tracked.has("channel_platform") && !params.channelPlatform) {
      missing.push("channel_platform");
    }
    if (tracked.has("constraints") && params.constraints.length === 0) {
      missing.push("constraints");
    }
    if (tracked.has("success_objective") && !params.successObjective) {
      missing.push("success_objective");
    }
    return missing;
  }

  scoreConfidence(params: {
    originalCommand: string;
    businessType: string;
    businessIdea: string;
    targetCustomer: string | null;
    productServiceCategory: string | null;
    channelPlatform: string | null;
    constraints: string[];
    successObjective: string | null;
    missingInformation: string[];
    config: BusinessIdeaInterpreterConfiguration;
  }): number {
    let score = 0.35;
    if (params.originalCommand.trim().length >= 8) score += 0.1;
    if (params.businessType !== "unknown") score += 0.2;
    if (params.businessIdea.trim().length >= 8) score += 0.1;
    if (params.targetCustomer) score += 0.08;
    if (params.productServiceCategory) score += 0.07;
    if (params.channelPlatform) score += 0.05;
    if (params.constraints.length > 0) score += 0.03;
    if (params.successObjective) score += 0.07;
    score -= Math.min(0.25, params.missingInformation.length * 0.03);
    const clamped = Math.min(0.99, Math.max(params.config.minimumConfidenceScore, score));
    return Math.round(clamped * 100) / 100;
  }
}

let intentSequence = 0;

export function resetIntentSequenceForTesting() {
  intentSequence = 0;
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizeNullable(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function cleanPhrase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,;:]+$/, "");
}

function isNoisePhrase(value: string): boolean {
  const normalized = value.toLowerCase();
  return [
    "a business",
    "business",
    "the business",
    "customers",
    "people",
    "users",
  ].includes(normalized);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneIntent(intent: StructuredBusinessIntent): StructuredBusinessIntent {
  return {
    ...intent,
    constraints: [...intent.constraints],
    missingInformation: [...intent.missingInformation],
  };
}

void BUSINESS_TYPES;
