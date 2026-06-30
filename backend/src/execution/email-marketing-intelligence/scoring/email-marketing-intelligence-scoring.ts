import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { CampaignCalendarEntry } from "../models/campaign-calendar.js";
import type { EmailCopy } from "../models/email-copy.js";
import type { EmailFlow } from "../models/email-flow.js";
import {
  EMAIL_FLOW_LABELS,
  EMAIL_FLOW_TYPES,
  type EmailFlowType,
} from "../models/email-flow-types.js";
import type { EmailMarketingBlueprintCreateInput } from "../models/email-marketing-blueprint.js";
import type { EmailMarketingSignal, EmailMarketingSignalType } from "../models/email-marketing-signal.js";
import type { EmailSubjectLine } from "../models/email-subject-line.js";

export const EMAIL_MARKETING_SIGNAL_WEIGHTS: Record<EmailMarketingSignalType, number> = {
  welcome_quality: 0.16,
  recovery_coverage: 0.18,
  transactional_clarity: 0.16,
  retention_depth: 0.14,
  calendar_completeness: 0.12,
  copy_quality: 0.12,
  subject_line_strength: 0.1,
  email_composite: 0.02,
};

export type EmailMarketingBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type EmailMarketingOfferInput = {
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  callToAction: string;
  averageOrderValue?: number;
};

export type EmailMarketingInput = {
  brand: EmailMarketingBrandInput;
  offer: EmailMarketingOfferInput;
  storeId: string;
  storeSlug?: string;
  calendarWeeks?: number;
};

export type EmailMarketingBreakdown = EmailMarketingBlueprintCreateInput;

type FlowDefinition = {
  flowType: EmailFlowType;
  description: string;
  trigger: string;
  delayHours: number;
  sequenceLength: number;
  scoreModifier: (input: EmailMarketingInput) => number;
  subjectVariants: (input: EmailMarketingInput) => Array<{ variant: string; subject: string; previewText: string }>;
  copySteps: (input: EmailMarketingInput) => Array<{ headline: string; bodyPlain: string; callToAction: string }>;
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: EmailMarketingSignalType,
  score: number,
  detail: string,
): EmailMarketingSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: EMAIL_MARKETING_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function baseScore(input: EmailMarketingInput): number {
  const benefitBoost = Math.min(10, input.offer.keyBenefits.length * 2);
  return clampScore(input.brand.confidence * 0.5 + benefitBoost + 22);
}

function buildSubjectLines(
  flowType: EmailFlowType,
  variants: Array<{ variant: string; subject: string; previewText: string }>,
  base: number,
): EmailSubjectLine[] {
  return variants.map((entry, index) => ({
    subjectLineId: randomUUID(),
    flowType,
    variant: entry.variant,
    subject: entry.subject,
    previewText: entry.previewText,
    score: clampScore(base - index * 3),
  }));
}

function buildEmailCopy(
  flowType: EmailFlowType,
  steps: Array<{ headline: string; bodyPlain: string; callToAction: string }>,
  base: number,
): EmailCopy[] {
  return steps.map((step, index) => ({
    copyId: randomUUID(),
    flowType,
    stepOrder: index + 1,
    headline: step.headline,
    bodyPlain: step.bodyPlain,
    callToAction: step.callToAction,
    score: clampScore(base - index * 2),
  }));
}

const FLOW_DEFINITIONS: FlowDefinition[] = [
  {
    flowType: "WELCOME",
    description: "Onboard new subscribers with brand story, offer, and first-purchase incentive.",
    trigger: "Newsletter or account signup",
    delayHours: 0,
    sequenceLength: 3,
    scoreModifier: (input) => (input.brand.slogan.length > 5 ? 5 : 0),
    subjectVariants: (input) => [
      {
        variant: "A",
        subject: `Welcome to ${input.brand.brandName} — your ${input.offer.offerTitle} awaits`,
        previewText: input.brand.slogan,
      },
      {
        variant: "B",
        subject: `You're in — here's 10% off your first order`,
        previewText: input.offer.valueProposition.slice(0, 80),
      },
    ],
    copySteps: (input) => [
      {
        headline: `Welcome to ${input.brand.brandName}`,
        bodyPlain: `Hi there,\n\nThanks for joining ${input.brand.brandName}. ${input.brand.slogan}\n\n${input.offer.valueProposition}\n\nYour exclusive welcome offer: 10% off your first order with code WELCOME10.`,
        callToAction: input.offer.callToAction,
      },
      {
        headline: `Why ${input.brand.targetAudience.split(" ").slice(0, 4).join(" ")} choose us`,
        bodyPlain: `${input.offer.keyBenefits.map((benefit, index) => `${index + 1}. ${benefit}`).join("\n")}\n\nExplore our curated collection built for ${input.brand.niche.toLowerCase()}.`,
        callToAction: "Browse the collection",
      },
      {
        headline: "Last chance — your welcome discount expires soon",
        bodyPlain: `Your 10% welcome code expires in 48 hours. Don't miss ${input.offer.offerTitle} at a special first-order price.`,
        callToAction: "Claim your discount",
      },
    ],
  },
  {
    flowType: "ABANDONED_CART",
    description: "Recover carts left behind with reminder sequence and optional incentive escalation.",
    trigger: "Cart abandoned with items — no purchase within 1 hour",
    delayHours: 1,
    sequenceLength: 3,
    scoreModifier: () => 0,
    subjectVariants: (input) => [
      {
        variant: "A",
        subject: "You left something behind",
        previewText: `Your ${input.offer.offerTitle} is still in your cart`,
      },
      {
        variant: "B",
        subject: `Complete your order — ${input.offer.headline.slice(0, 40)}`,
        previewText: "Free shipping available on your cart",
      },
      {
        variant: "C",
        subject: "10% off to finish your order (expires tonight)",
        previewText: "We saved your cart — limited-time recovery offer",
      },
    ],
    copySteps: (input) => [
      {
        headline: "Your cart is waiting",
        bodyPlain: `You added ${input.offer.offerTitle} to your cart but didn't complete checkout.\n\n${input.offer.keyBenefits[0] ?? input.offer.valueProposition}\n\nYour items are reserved — complete your order now.`,
        callToAction: "Return to cart",
      },
      {
        headline: "Still thinking it over?",
        bodyPlain: `${input.brand.brandName} customers love ${input.offer.offerTitle} for ${input.offer.keyBenefits[1]?.toLowerCase() ?? "quality and value"}.\n\nQuestions? Reply to this email — we're here to help.`,
        callToAction: "Complete purchase",
      },
      {
        headline: "Final reminder + 10% off your cart",
        bodyPlain: `Use code CART10 before midnight to save 10% on your abandoned cart.\n\n${input.offer.valueProposition}`,
        callToAction: "Checkout now",
      },
    ],
  },
  {
    flowType: "BROWSE_ABANDONMENT",
    description: "Re-engage visitors who viewed products without adding to cart.",
    trigger: "Product page view — no add-to-cart within 24 hours",
    delayHours: 24,
    sequenceLength: 2,
    scoreModifier: () => 2,
    subjectVariants: (input) => [
      {
        variant: "A",
        subject: `Still interested in ${input.offer.offerTitle}?`,
        previewText: "Pick up where you left off",
      },
      {
        variant: "B",
        subject: "We noticed you browsing — here's what others bought",
        previewText: "Top picks for you based on your visit",
      },
    ],
    copySteps: (input) => [
      {
        headline: "Pick up where you left off",
        bodyPlain: `You recently viewed ${input.offer.offerTitle} on ${input.brand.brandName}.\n\n${input.offer.headline}\n\n${input.offer.keyBenefits.slice(0, 2).join(". ")}.`,
        callToAction: "View product",
      },
      {
        headline: "Popular with shoppers like you",
        bodyPlain: `Customers in ${input.brand.niche.toLowerCase()} rated ${input.offer.offerTitle} highly for value and quality.\n\nSee why ${input.brand.targetAudience.toLowerCase()} keep coming back.`,
        callToAction: input.offer.callToAction,
      },
    ],
  },
  {
    flowType: "PURCHASE_CONFIRMATION",
    description: "Confirm order details and set delivery expectations immediately after purchase.",
    trigger: "Order placed — payment confirmed",
    delayHours: 0,
    sequenceLength: 1,
    scoreModifier: () => 4,
    subjectVariants: (input) => [
      {
        variant: "A",
        subject: `Order confirmed — thank you from ${input.brand.brandName}`,
        previewText: "Your order is being prepared",
      },
    ],
    copySteps: (input) => [
      {
        headline: "Thank you for your order!",
        bodyPlain: `Hi,\n\nYour order for ${input.offer.offerTitle} is confirmed.\n\nOrder total: $${(input.offer.averageOrderValue ?? 49.99).toFixed(2)}\n\nWe're preparing your items now. You'll receive a shipping notification with tracking as soon as your order ships.\n\n${input.brand.slogan}`,
        callToAction: "View order details",
      },
    ],
  },
  {
    flowType: "SHIPPING",
    description: "Notify customer when order ships with tracking link and delivery estimate.",
    trigger: "Fulfillment shipped — tracking number assigned",
    delayHours: 0,
    sequenceLength: 1,
    scoreModifier: () => 3,
    subjectVariants: () => [
      {
        variant: "A",
        subject: "Your order is on its way!",
        previewText: "Track your shipment — estimated delivery inside",
      },
    ],
    copySteps: (input) => [
      {
        headline: "Your package has shipped",
        bodyPlain: `Great news — your ${input.offer.offerTitle} order from ${input.brand.brandName} is on its way.\n\nTrack your shipment using the link below. Estimated delivery: 3–7 business days.\n\nQuestions about delivery? Reply to this email.`,
        callToAction: "Track shipment",
      },
    ],
  },
  {
    flowType: "REVIEW_REQUEST",
    description: "Request product review after delivery with social proof incentive.",
    trigger: "Delivery confirmed — 5 days after estimated delivery",
    delayHours: 120,
    sequenceLength: 2,
    scoreModifier: (input) => Math.min(5, input.offer.keyBenefits.length),
    subjectVariants: (input) => [
      {
        variant: "A",
        subject: "How did we do? Share your experience",
        previewText: `Tell us about your ${input.offer.offerTitle}`,
      },
      {
        variant: "B",
        subject: "Quick favor — leave a review (takes 30 seconds)",
        previewText: "Your feedback helps other shoppers decide",
      },
    ],
    copySteps: (input) => [
      {
        headline: "We'd love your feedback",
        bodyPlain: `Hi,\n\nWe hope you're enjoying your ${input.offer.offerTitle} from ${input.brand.brandName}.\n\nWould you take 30 seconds to share your experience? Your review helps ${input.brand.targetAudience.toLowerCase()} make confident decisions.`,
        callToAction: "Leave a review",
      },
      {
        headline: "Reminder — your review makes a difference",
        bodyPlain: `Your honest feedback on ${input.offer.offerTitle} helps us improve and helps fellow shoppers.\n\nThank you for being part of the ${input.brand.brandName} community.`,
        callToAction: "Write a review",
      },
    ],
  },
  {
    flowType: "UPSELL",
    description: "Cross-sell complementary products after first purchase.",
    trigger: "First purchase delivered — 7 days post-delivery",
    delayHours: 168,
    sequenceLength: 2,
    scoreModifier: (input) => (input.offer.averageOrderValue && input.offer.averageOrderValue > 40 ? 3 : 0),
    subjectVariants: (input) => [
      {
        variant: "A",
        subject: `Pairs perfectly with your ${input.offer.offerTitle}`,
        previewText: "Customers also love this add-on",
      },
      {
        variant: "B",
        subject: "Complete your setup — exclusive bundle offer",
        previewText: "Save 15% when you bundle",
      },
    ],
    copySteps: (input) => [
      {
        headline: "Complete your experience",
        bodyPlain: `Since you loved ${input.offer.offerTitle}, we think you'll enjoy our complementary accessories.\n\n${input.offer.keyBenefits[2] ?? input.offer.keyBenefits[0] ?? input.offer.valueProposition}\n\nBundle and save 15% today.`,
        callToAction: "Shop the bundle",
      },
      {
        headline: "Last chance — bundle discount expires",
        bodyPlain: `Your exclusive 15% bundle discount on ${input.brand.brandName} add-ons expires in 48 hours.`,
        callToAction: "Claim bundle offer",
      },
    ],
  },
  {
    flowType: "VIP",
    description: "Recognize high-value repeat customers with early access and exclusive perks.",
    trigger: "Customer reaches VIP tier — 2+ orders or $100+ lifetime spend",
    delayHours: 0,
    sequenceLength: 2,
    scoreModifier: (input) => (input.brand.confidence > 75 ? 4 : 0),
    subjectVariants: (input) => [
      {
        variant: "A",
        subject: `You're now a ${input.brand.brandName} VIP`,
        previewText: "Exclusive perks unlocked — early access inside",
      },
      {
        variant: "B",
        subject: "VIP early access — shop new arrivals first",
        previewText: "Your loyalty reward is here",
      },
    ],
    copySteps: (input) => [
      {
        headline: `Welcome to ${input.brand.brandName} VIP`,
        bodyPlain: `Thank you for being a loyal customer. As a VIP member you get:\n\n• Early access to new arrivals\n• Free shipping on every order\n• Exclusive VIP-only discounts\n• Priority customer support\n\n${input.brand.positioning}`,
        callToAction: "Shop VIP collection",
      },
      {
        headline: "VIP exclusive — new arrivals just dropped",
        bodyPlain: `As a VIP, you get 48-hour early access to our latest ${input.brand.niche.toLowerCase()} collection before public launch.\n\n${input.offer.headline}`,
        callToAction: "Shop early access",
      },
    ],
  },
  {
    flowType: "WINBACK",
    description: "Re-engage lapsed customers who haven't purchased in 60+ days.",
    trigger: "No purchase in 60 days — last order delivered",
    delayHours: 1440,
    sequenceLength: 3,
    scoreModifier: () => -2,
    subjectVariants: (input) => [
      {
        variant: "A",
        subject: `We miss you at ${input.brand.brandName}`,
        previewText: "Come back — here's 15% off just for you",
      },
      {
        variant: "B",
        subject: "It's been a while — see what's new",
        previewText: input.offer.headline.slice(0, 80),
      },
      {
        variant: "C",
        subject: "Final offer — 15% off expires this week",
        previewText: "We'd love to have you back",
      },
    ],
    copySteps: (input) => [
      {
        headline: "We miss you!",
        bodyPlain: `Hi,\n\nIt's been a while since your last visit to ${input.brand.brandName}. We've added new products and improved ${input.offer.offerTitle} based on customer feedback.\n\nCome back with 15% off — code WINBACK15.`,
        callToAction: "Shop with 15% off",
      },
      {
        headline: "See what's new since your last visit",
        bodyPlain: `${input.offer.keyBenefits.join(". ")}.\n\n${input.offer.valueProposition}`,
        callToAction: input.offer.callToAction,
      },
      {
        headline: "Last chance — your 15% winback offer expires",
        bodyPlain: `Your exclusive WINBACK15 code expires in 72 hours. Don't miss out on ${input.offer.offerTitle} at a special returning-customer price.`,
        callToAction: "Redeem winback offer",
      },
    ],
  },
];

function buildFlow(definition: FlowDefinition, input: EmailMarketingInput): EmailFlow {
  const score = clampScore(baseScore(input) + definition.scoreModifier(input));
  const subjectVariants = definition.subjectVariants(input);
  const copySteps = definition.copySteps(input);

  return {
    flowId: randomUUID(),
    flowType: definition.flowType,
    displayName: EMAIL_FLOW_LABELS[definition.flowType],
    description: definition.description,
    trigger: definition.trigger,
    delayHours: definition.delayHours,
    sequenceLength: definition.sequenceLength,
    score: score,
    status: score >= 70 ? "READY" : "DRAFT",
    subjectLines: buildSubjectLines(definition.flowType, subjectVariants, score),
    emailCopy: buildEmailCopy(definition.flowType, copySteps, score),
  };
}

function buildAllFlows(input: EmailMarketingInput): EmailFlow[] {
  return FLOW_DEFINITIONS.map((definition) => buildFlow(definition, input));
}

function buildCampaignCalendar(input: EmailMarketingInput): CampaignCalendarEntry[] {
  const weeks = input.calendarWeeks ?? 8;
  const entries: CampaignCalendarEntry[] = [];

  const calendarPlan: Array<{
    flowType: EmailFlowType;
    entryName: string;
    dayOffset: number;
    cadence: string;
    notes: string;
  }> = [
    {
      flowType: "WELCOME",
      entryName: "Welcome sequence launch",
      dayOffset: 0,
      cadence: "Day 0, 2, 5",
      notes: "Trigger on signup — 3-email welcome series",
    },
    {
      flowType: "ABANDONED_CART",
      entryName: "Cart recovery automation",
      dayOffset: 0,
      cadence: "1h, 24h, 72h after abandon",
      notes: "Always-on triggered flow — no calendar send",
    },
    {
      flowType: "BROWSE_ABANDONMENT",
      entryName: "Browse recovery automation",
      dayOffset: 0,
      cadence: "24h, 72h after browse",
      notes: "Always-on triggered flow",
    },
    {
      flowType: "PURCHASE_CONFIRMATION",
      entryName: "Order confirmation automation",
      dayOffset: 0,
      cadence: "Immediate on purchase",
      notes: "Transactional — always-on",
    },
    {
      flowType: "SHIPPING",
      entryName: "Shipping notification automation",
      dayOffset: 0,
      cadence: "On fulfillment ship event",
      notes: "Transactional — always-on",
    },
    {
      flowType: "REVIEW_REQUEST",
      entryName: "Review request sequence",
      dayOffset: 0,
      cadence: "Day 5 + Day 10 post-delivery",
      notes: "Triggered after delivery confirmation",
    },
    {
      flowType: "UPSELL",
      entryName: "Post-purchase upsell",
      dayOffset: 7,
      cadence: "Day 7 + Day 14 post-delivery",
      notes: "Cross-sell complementary products",
    },
    {
      flowType: "VIP",
      entryName: "VIP tier welcome",
      dayOffset: 0,
      cadence: "On VIP tier achievement",
      notes: "Triggered when customer hits VIP threshold",
    },
    {
      flowType: "WINBACK",
      entryName: "Winback campaign",
      dayOffset: 60,
      cadence: "Day 60, 67, 74 lapsed",
      notes: "Triggered at 60-day inactivity",
    },
  ];

  for (const plan of calendarPlan) {
    entries.push({
      entryId: randomUUID(),
      flowType: plan.flowType,
      entryName: plan.entryName,
      scheduledDayOffset: plan.dayOffset,
      sendWindowLocal: "09:00–11:00 local",
      cadence: plan.cadence,
      status: "PLANNED",
      notes: plan.notes,
    });
  }

  for (let week = 1; week <= weeks; week++) {
    entries.push({
      entryId: randomUUID(),
      flowType: week % 2 === 0 ? "VIP" : "WINBACK",
      entryName: `Week ${week} retention broadcast review`,
      scheduledDayOffset: week * 7,
      sendWindowLocal: "10:00–12:00 local",
      cadence: `Week ${week} — ${input.brand.brandName}`,
      status: "PLANNED",
      notes: `Calendar slot week ${week} — review flow performance, no auto-send`,
    });
  }

  return entries;
}

function buildSignals(flows: EmailFlow[], calendar: CampaignCalendarEntry[], confidence: number): EmailMarketingSignal[] {
  const byType = new Map(flows.map((flow) => [flow.flowType, flow]));

  const welcome = byType.get("WELCOME")!;
  const abandonedCart = byType.get("ABANDONED_CART")!;
  const browse = byType.get("BROWSE_ABANDONMENT")!;
  const purchase = byType.get("PURCHASE_CONFIRMATION")!;
  const shipping = byType.get("SHIPPING")!;
  const review = byType.get("REVIEW_REQUEST")!;
  const upsell = byType.get("UPSELL")!;
  const vip = byType.get("VIP")!;
  const winback = byType.get("WINBACK")!;

  const allSubjectLines = flows.flatMap((flow) => flow.subjectLines);
  const allCopy = flows.flatMap((flow) => flow.emailCopy);

  return [
    buildSignal("welcome_quality", welcome.score, `Welcome flow quality ${welcome.score}/100`),
    buildSignal(
      "recovery_coverage",
      average([abandonedCart.score, browse.score, winback.score]),
      `Recovery flows average ${average([abandonedCart.score, browse.score, winback.score]).toFixed(0)}/100`,
    ),
    buildSignal(
      "transactional_clarity",
      average([purchase.score, shipping.score]),
      `Transactional emails ${average([purchase.score, shipping.score]).toFixed(0)}/100`,
    ),
    buildSignal(
      "retention_depth",
      average([review.score, upsell.score, vip.score]),
      `Retention flows ${average([review.score, upsell.score, vip.score]).toFixed(0)}/100`,
    ),
    buildSignal(
      "calendar_completeness",
      clampScore(calendar.length >= 9 ? 85 : 60),
      `${calendar.length} calendar entries planned`,
    ),
    buildSignal(
      "copy_quality",
      average(allCopy.map((entry) => entry.score)),
      `Email copy average ${average(allCopy.map((entry) => entry.score)).toFixed(0)}/100`,
    ),
    buildSignal(
      "subject_line_strength",
      average(allSubjectLines.map((entry) => entry.score)),
      `Subject lines average ${average(allSubjectLines.map((entry) => entry.score)).toFixed(0)}/100`,
    ),
    buildSignal("email_composite", confidence, `Email marketing confidence ${confidence}`),
  ];
}

function computeConfidence(signals: EmailMarketingSignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "email_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "email_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(flows: EmailFlow[]): number {
  return clampScore(average(flows.map((flow) => flow.score)));
}

/** Generates a complete email marketing blueprint — intelligence only, no auto-send. */
export function generateEmailMarketingBlueprint(
  input: EmailMarketingInput,
): EmailMarketingBreakdown {
  const flows = buildAllFlows(input);

  for (const flowType of EMAIL_FLOW_TYPES) {
    const found = flows.find((flow) => flow.flowType === flowType);
    if (!found) {
      throw new Error(`Missing required email flow: ${flowType}`);
    }
  }

  const campaignCalendar = buildCampaignCalendar(input);
  const provisionalSignals = buildSignals(flows, campaignCalendar, 0);
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(flows, campaignCalendar, confidence);
  const overallScore = computeOverallScore(flows);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    blueprintName: `${input.brand.brandName} Email Marketing Blueprint`,
    flows,
    campaignCalendar,
    overallScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoSendEnabled: false,
  };
}

export const emailMarketingIntelligenceScoring = {
  generateEmailMarketingBlueprint,
  computeConfidence,
  computeOverallScore,
  EMAIL_MARKETING_SIGNAL_WEIGHTS,
};
