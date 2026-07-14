import type { ContextTask } from "../context/types.js";
import {
  isRepositorySpecificQuestion,
  requiresLiveInformation,
} from "../openai/knowledge-routing.js";
import type {
  IntelligenceRoutingDecision,
  IntelligenceRoutingInput,
  IntelligenceSource,
  OpenAICapability,
} from "./types.js";
import { INTELLIGENCE_SOURCE_PRIORITY } from "./types.js";

/** Patterns indicating current/live information (Part C). */
const LIVE_INFORMATION_EXTENDED_PATTERNS = [
  /\b(latest|current|today'?s|as of today|right now|this week|this month)\b/i,
  /\b(latest meta ads|meta ads policy|facebook ads policy)\b/i,
  /\b(current football|football results|match score|live score)\b/i,
  /\b(exchange rate|forex rate|currency rate)\b/i,
  /\b(latest openai|openai announcement|openai release)\b/i,
  /\b(amazon marketplace rules|amazon seller policy)\b/i,
  /\b(stripe documentation|stripe api changes|current stripe)\b/i,
  /\b(breaking news|stock price|trading at)\b/i,
];

/** Historical questions must NOT trigger live disclaimers (Part B). */
const HISTORICAL_QUESTION_PATTERNS = [
  /\b(19\d{2}|20[0-2]\d)\b/,
  /\bwho won the (19|20)\d{2}/i,
  /\b(in|during|at) (19|20)\d{2}\b/i,
  /\bworld cup (19|20)\d{2}\b/i,
  /\bwhen did .+ (happen|occur|start|end)\b/i,
  /\bhistory of\b/i,
  /\bwhat was\b/i,
  /\bwho invented\b/i,
  /\bwhen was .+ (founded|created|released|invented)\b/i,
];

const MARKETPLACE_PATTERNS = [
  /\b(amazon|ebay|etsy|shopify marketplace|marketplace listing|product listing)\b/i,
  /\b(seller central|buy box|fulfillment by amazon)\b/i,
];

const SUPPLIER_PATTERNS = [
  /\b(supplier|sourcing|wholesale|manufacturer|alibaba|1688)\b/i,
  /\b(purchase order|procurement|vendor)\b/i,
];

const FINANCIAL_PATTERNS = [
  /\b(revenue|profit|margin|p&l|cash flow|financial report|invoice|payment)\b/i,
  /\b(stripe|paypal|billing|subscription revenue)\b/i,
];

const COMMUNICATION_PATTERNS = [
  /\b(email campaign|send email|sms|whatsapp|slack message|notification)\b/i,
  /\b(customer support|outreach|newsletter)\b/i,
];

const FILE_SEARCH_PATTERNS = [
  /\bsearch\b.{0,40}\b(file|document|pdf|doc)\b/i,
  /\bfind in\b.{0,40}\b(file|document)\b/i,
  /\bfile search\b/i,
];

const FILE_ANALYSIS_PATTERNS = [
  /\b(analy[sz]e|summari[sz]e)\b.{0,40}\b(file|document|pdf|spreadsheet|csv)\b/i,
  /\bfile analysis\b/i,
];

const IMAGE_GENERATION_PATTERNS = [
  /\b(generate|create|make|draw)\b.{0,20}\b(image|picture|illustration|logo|icon)\b/i,
  /\bimage generation\b/i,
];

const VISUAL_GENERATION_PATTERNS = [
  /\b(create|generate|design|produce|build)\b.{0,30}\b(canva|banner|creative|infographic|presentation|mockup|brand asset|social media|ad creative|product image|listing graphic)\b/i,
  /\bvisual (asset|production|design|creative)\b/i,
  /\bcanva\b/i,
];

const VISION_PATTERNS = [
  /\b(describe|analy[sz]e)\b.{0,30}\b(image|photo|picture|screenshot)\b/i,
  /\bwhat (is|does) (this|the) (image|photo|screenshot)\b/i,
  /\bvision analysis\b/i,
];

const CODE_EXECUTION_PATTERNS = [
  /\b(run|execute)\b.{0,30}\b(code|script|python|javascript)\b/i,
  /\bcode execution\b/i,
];

export function isHistoricalQuestion(userMessage: string): boolean {
  const text = userMessage.trim();
  if (requiresLiveInformation(text)) return false;
  return HISTORICAL_QUESTION_PATTERNS.some((p) => p.test(text));
}

export function requiresCurrentInformation(userMessage: string): boolean {
  if (isHistoricalQuestion(userMessage)) return false;
  if (requiresLiveInformation(userMessage)) return true;
  return LIVE_INFORMATION_EXTENDED_PATTERNS.some((p) => p.test(userMessage));
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function detectBusinessSource(text: string): IntelligenceSource | null {
  if (matchesAny(text, MARKETPLACE_PATTERNS)) return "marketplace_apis";
  if (matchesAny(text, SUPPLIER_PATTERNS)) return "supplier_apis";
  if (matchesAny(text, FINANCIAL_PATTERNS)) return "financial_apis";
  if (matchesAny(text, COMMUNICATION_PATTERNS)) return "communication_apis";
  return null;
}

function detectOpenAICapability(text: string): OpenAICapability | null {
  if (matchesAny(text, VISUAL_GENERATION_PATTERNS)) return "visual_generation";
  if (matchesAny(text, IMAGE_GENERATION_PATTERNS)) return "image_generation";
  if (matchesAny(text, VISION_PATTERNS)) return "vision";
  if (matchesAny(text, CODE_EXECUTION_PATTERNS)) return "code_execution";
  if (matchesAny(text, FILE_SEARCH_PATTERNS)) return "file_search";
  if (matchesAny(text, FILE_ANALYSIS_PATTERNS)) return "file_analysis";
  if (requiresCurrentInformation(text)) return "web_search";
  return null;
}

function sortByPriority(sources: IntelligenceSource[]): IntelligenceSource[] {
  return [...sources].sort(
    (a, b) =>
      INTELLIGENCE_SOURCE_PRIORITY.indexOf(a) - INTELLIGENCE_SOURCE_PRIORITY.indexOf(b),
  );
}

/**
 * Deterministic intelligence routing (Part A).
 * Priority: Soul File → EKLS → OpenAI General → Web Search → Marketplace → Supplier → Financial → Communication
 */
export function routeIntelligence(input: IntelligenceRoutingInput): IntelligenceRoutingDecision {
  const text = input.userMessage.trim();
  const isRepositorySpecific = isRepositorySpecificQuestion(text, input.contextTask);
  const live = requiresCurrentInformation(text);
  const historical = isHistoricalQuestion(text);
  const businessSource = detectBusinessSource(text);
  const openAiCapability = detectOpenAICapability(text);

  const sources: IntelligenceSource[] = [];
  const capabilities: OpenAICapability[] = [];

  if (isRepositorySpecific && input.hasSoulContext) {
    sources.push("soul_file");
  }
  if (input.hasEklsContext) {
    sources.push("ekls");
  }
  if (isRepositorySpecific && input.hasRepositoryAnswer) {
    if (!sources.includes("soul_file")) sources.push("soul_file");
  }

  if (live && input.webSearchAvailable) {
    sources.push("openai_web_search");
    capabilities.push("web_search");
  } else if (!isRepositorySpecific || !input.hasRepositoryAnswer) {
    sources.push("openai_general");
    capabilities.push("general_knowledge");
  }

  if (businessSource) {
    sources.push(businessSource);
  }

  if (openAiCapability) {
    if (openAiCapability === "web_search" && !capabilities.includes("web_search")) {
      capabilities.push("web_search");
      if (!sources.includes("openai_web_search")) sources.push("openai_web_search");
    } else if (openAiCapability !== "web_search") {
      capabilities.push(openAiCapability);
    }
  }

  if (capabilities.length === 0) {
    capabilities.push(isRepositorySpecific ? "gpt_reasoning" : "general_knowledge");
  }

  const SPECIAL_CAPABILITIES = new Set<OpenAICapability>([
    "web_search",
    "file_search",
    "file_analysis",
    "image_generation",
    "visual_generation",
    "vision",
    "code_execution",
  ]);
  const primaryCapability =
    capabilities.find((c) => SPECIAL_CAPABILITIES.has(c)) ??
    (isRepositorySpecific ? "gpt_reasoning" : capabilities.find((c) => c === "general_knowledge") ?? "general_knowledge");
  const orderedSources = sortByPriority([...new Set(sources)]);
  const primarySource =
    orderedSources[0] ?? (live ? "openai_web_search" : "openai_general");
  const combineSources = orderedSources.length > 1;

  let rationale: string;
  if (isRepositorySpecific && input.hasRepositoryAnswer) {
    rationale = "Repository-specific question — Soul File / EKLS authoritative";
  } else if (live && input.webSearchAvailable) {
    rationale = "Current information required — Web Search invoked";
  } else if (historical) {
    rationale = "Historical question — general knowledge, no live disclaimer";
  } else if (openAiCapability) {
    rationale = `Capability detected: ${openAiCapability}`;
  } else if (businessSource) {
    rationale = `Business operation — ${businessSource}`;
  } else {
    rationale = "General knowledge via OpenAI";
  }

  return {
    sources: orderedSources.length > 0 ? orderedSources : ["openai_general"],
    primarySource,
    capabilities,
    primaryCapability,
    requiresLiveInformation: live,
    isRepositorySpecific,
    isHistoricalQuestion: historical,
    combineSources,
    rationale,
  };
}
