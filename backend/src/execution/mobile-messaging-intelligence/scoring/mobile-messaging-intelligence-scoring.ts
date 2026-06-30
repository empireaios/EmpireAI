import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { AudienceSegment } from "../models/audience-segment.js";
import type { AutomationTrigger } from "../models/automation-trigger.js";
import type { FrequencyControl } from "../models/frequency-control.js";
import type { MessageTiming } from "../models/message-timing.js";
import type { MobileMessagingBlueprintCreateInput } from "../models/mobile-messaging-blueprint.js";
import type {
  MobileMessagingSignal,
  MobileMessagingSignalType,
} from "../models/mobile-messaging-signal.js";
import type { PushNotification } from "../models/push-notification.js";
import {
  PUSH_NOTIFICATION_LABELS,
  PUSH_NOTIFICATION_TYPES,
  type PushNotificationType,
} from "../models/push-notification-types.js";
import type { SmsCampaign } from "../models/sms-campaign.js";
import {
  SMS_CAMPAIGN_LABELS,
  SMS_CAMPAIGN_TYPES,
  type SmsCampaignType,
} from "../models/sms-campaign-types.js";
import {
  AUDIENCE_SEGMENT_LABELS,
  AUDIENCE_SEGMENT_TYPES,
  type AudienceSegmentType,
} from "../models/audience-segment.js";

export const MOBILE_MESSAGING_SIGNAL_WEIGHTS: Record<MobileMessagingSignalType, number> = {
  sms_coverage: 0.18,
  push_coverage: 0.18,
  timing_quality: 0.16,
  segmentation_depth: 0.16,
  automation_readiness: 0.14,
  frequency_safety: 0.16,
  messaging_composite: 0.02,
};

export type MobileMessagingBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type MobileMessagingOfferInput = {
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  callToAction: string;
  averageOrderValue?: number;
};

export type MobileMessagingInput = {
  brand: MobileMessagingBrandInput;
  offer: MobileMessagingOfferInput;
  storeId: string;
  storeSlug?: string;
};

export type MobileMessagingBreakdown = MobileMessagingBlueprintCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSignal(
  signalType: MobileMessagingSignalType,
  score: number,
  detail: string,
): MobileMessagingSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: MOBILE_MESSAGING_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function baseScore(input: MobileMessagingInput): number {
  const benefitBoost = Math.min(10, input.offer.keyBenefits.length * 2);
  return clampScore(input.brand.confidence * 0.5 + benefitBoost + 20);
}

function resolveStoreSlug(input: MobileMessagingInput): string {
  return slugify(input.storeSlug ?? input.brand.brandName);
}

function smsMetrics(body: string): { characterCount: number; segmentCount: number } {
  const characterCount = body.length;
  const segmentCount = characterCount <= 160 ? 1 : Math.ceil(characterCount / 153);
  return { characterCount, segmentCount };
}

function buildSmsCampaigns(input: MobileMessagingInput): SmsCampaign[] {
  const brand = input.brand.brandName;
  const offer = input.offer.offerTitle;
  const base = baseScore(input);
  const slug = resolveStoreSlug(input);

  const definitions: Array<{
    type: SmsCampaignType;
    body: string;
    trigger: string;
    delayMinutes: number;
    modifier: number;
  }> = [
    {
      type: "WELCOME",
      body: `${brand}: Welcome! Get 10% off ${offer} with WELCOME10. ${input.offer.callToAction}: https://${slug}.example/w`,
      trigger: "Phone opt-in or signup with SMS consent",
      delayMinutes: 0,
      modifier: 4,
    },
    {
      type: "CART_RECOVERY",
      body: `${brand}: You left ${offer} in your cart. Complete checkout: https://${slug}.example/c Reply STOP to opt out`,
      trigger: "Cart abandoned — no purchase within 30 minutes",
      delayMinutes: 30,
      modifier: 0,
    },
    {
      type: "ORDER_UPDATE",
      body: `${brand}: Order confirmed! $${(input.offer.averageOrderValue ?? 49.99).toFixed(2)} for ${offer}. Track: https://${slug}.example/o`,
      trigger: "Order placed — payment confirmed",
      delayMinutes: 0,
      modifier: 5,
    },
    {
      type: "SHIPPING_ALERT",
      body: `${brand}: Your ${offer} shipped! Track delivery: https://${slug}.example/t Est. 3-7 days.`,
      trigger: "Fulfillment shipped — tracking assigned",
      delayMinutes: 0,
      modifier: 4,
    },
    {
      type: "PROMOTION",
      body: `${brand}: Flash sale — 15% off ${offer} today only. Code FLASH15: https://${slug}.example/p Reply STOP to opt out`,
      trigger: "Scheduled promotion — segment ACTIVE_BUYER",
      delayMinutes: 0,
      modifier: -2,
    },
    {
      type: "WINBACK",
      body: `${brand}: We miss you! 15% off your next order with WINBACK15: https://${slug}.example/wb Reply STOP to opt out`,
      trigger: "No purchase in 60 days",
      delayMinutes: 86400,
      modifier: -3,
    },
  ];

  return definitions.map((definition) => {
    const score = clampScore(base + definition.modifier);
    const metrics = smsMetrics(definition.body);

    return {
      campaignId: randomUUID(),
      campaignType: definition.type,
      displayName: SMS_CAMPAIGN_LABELS[definition.type],
      messageBody: definition.body,
      characterCount: metrics.characterCount,
      segmentCount: metrics.segmentCount,
      trigger: definition.trigger,
      delayMinutes: definition.delayMinutes,
      score,
      status: score >= 70 ? "READY" : "DRAFT",
    };
  });
}

function buildPushNotifications(input: MobileMessagingInput): PushNotification[] {
  const brand = input.brand.brandName;
  const offer = input.offer.offerTitle;
  const base = baseScore(input);
  const slug = resolveStoreSlug(input);

  const definitions: Array<{
    type: PushNotificationType;
    title: string;
    body: string;
    deepLink: string;
    trigger: string;
    delayMinutes: number;
    modifier: number;
  }> = [
    {
      type: "WELCOME",
      title: `Welcome to ${brand}`,
      body: input.brand.slogan,
      deepLink: `https://${slug}.example/welcome`,
      trigger: "App install or push opt-in",
      delayMinutes: 0,
      modifier: 4,
    },
    {
      type: "CART_ABANDONMENT",
      title: "Your cart is waiting",
      body: `Complete your ${offer} order before items sell out.`,
      deepLink: `https://${slug}.example/cart`,
      trigger: "Cart abandoned — 1 hour",
      delayMinutes: 60,
      modifier: 0,
    },
    {
      type: "PRICE_DROP",
      title: "Price drop alert",
      body: `${offer} is now on sale — save 15% today.`,
      deepLink: `https://${slug}.example/deals`,
      trigger: "Price reduction on viewed product",
      delayMinutes: 0,
      modifier: 2,
    },
    {
      type: "BACK_IN_STOCK",
      title: "Back in stock!",
      body: `${offer} is available again. Limited quantity.`,
      deepLink: `https://${slug}.example/product`,
      trigger: "Wishlist or viewed item restocked",
      delayMinutes: 0,
      modifier: 3,
    },
    {
      type: "ORDER_SHIPPED",
      title: "Your order shipped",
      body: `${offer} is on its way. Tap to track delivery.`,
      deepLink: `https://${slug}.example/tracking`,
      trigger: "Fulfillment shipped",
      delayMinutes: 0,
      modifier: 5,
    },
    {
      type: "PROMOTION",
      title: `${brand} flash sale`,
      body: input.offer.headline.slice(0, 80),
      deepLink: `https://${slug}.example/sale`,
      trigger: "Scheduled promotion — VIP segment",
      delayMinutes: 0,
      modifier: -2,
    },
  ];

  return definitions.map((definition) => {
    const score = clampScore(base + definition.modifier);

    return {
      notificationId: randomUUID(),
      notificationType: definition.type,
      displayName: PUSH_NOTIFICATION_LABELS[definition.type],
      title: definition.title,
      body: definition.body,
      deepLink: definition.deepLink,
      trigger: definition.trigger,
      delayMinutes: definition.delayMinutes,
      score,
      status: score >= 70 ? "READY" : "DRAFT",
    };
  });
}

function buildTimingRules(input: MobileMessagingInput): MessageTiming[] {
  const base = baseScore(input);

  return [
    {
      timingId: randomUUID(),
      channel: "SMS",
      label: "SMS promotional send window",
      sendWindowLocal: "10:00–18:00",
      quietHoursStart: "21:00",
      quietHoursEnd: "09:00",
      timezonePolicy: "Recipient local timezone",
      optimalDays: ["Tuesday", "Wednesday", "Thursday"],
      score: clampScore(base + 2),
    },
    {
      timingId: randomUUID(),
      channel: "SMS",
      label: "SMS transactional — immediate",
      sendWindowLocal: "24/7 for transactional",
      quietHoursStart: "N/A",
      quietHoursEnd: "N/A",
      timezonePolicy: "Send immediately on trigger",
      optimalDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      score: clampScore(base + 5),
    },
    {
      timingId: randomUUID(),
      channel: "PUSH",
      label: "Push notification optimal window",
      sendWindowLocal: "09:00–20:00",
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      timezonePolicy: "Recipient local timezone",
      optimalDays: ["Monday", "Wednesday", "Friday"],
      score: clampScore(base),
    },
    {
      timingId: randomUUID(),
      channel: "BOTH",
      label: "Cross-channel coordination",
      sendWindowLocal: "Stagger SMS 2h after push if both triggered",
      quietHoursStart: "21:00",
      quietHoursEnd: "09:00",
      timezonePolicy: "Avoid duplicate channel within 2 hours",
      optimalDays: ["Tuesday", "Thursday"],
      score: clampScore(base + 3),
    },
  ];
}

function buildSegments(input: MobileMessagingInput): AudienceSegment[] {
  const base = baseScore(input);

  const definitions: Array<{
    type: AudienceSegmentType;
    criteria: string;
    reach: number;
    channels: string[];
    modifier: number;
  }> = [
    {
      type: "NEW_SUBSCRIBER",
      criteria: "Signed up within last 7 days, 0 orders",
      reach: 12,
      channels: ["SMS", "PUSH"],
      modifier: 3,
    },
    {
      type: "ACTIVE_BUYER",
      criteria: "Purchase within last 30 days",
      reach: 28,
      channels: ["PUSH", "SMS"],
      modifier: 4,
    },
    {
      type: "LAPSED_CUSTOMER",
      criteria: "Last purchase 60–180 days ago",
      reach: 18,
      channels: ["SMS", "PUSH"],
      modifier: 0,
    },
    {
      type: "VIP",
      criteria: "2+ orders or $100+ lifetime spend",
      reach: 8,
      channels: ["PUSH", "SMS"],
      modifier: 5,
    },
    {
      type: "CART_ABANDONER",
      criteria: "Cart with items, no purchase within 1 hour",
      reach: 15,
      channels: ["SMS", "PUSH"],
      modifier: 2,
    },
    {
      type: "BROWSE_ONLY",
      criteria: "Product page view, no add-to-cart within 24 hours",
      reach: 22,
      channels: ["PUSH"],
      modifier: 1,
    },
  ];

  return definitions.map((definition) => ({
    segmentId: randomUUID(),
    segmentType: definition.type,
    displayName: AUDIENCE_SEGMENT_LABELS[definition.type],
    criteria: definition.criteria,
    estimatedReachPercent: definition.reach,
    preferredChannels: definition.channels,
    score: clampScore(base + definition.modifier),
  }));
}

function buildAutomationTriggers(input: MobileMessagingInput): AutomationTrigger[] {
  const base = baseScore(input);

  const definitions: Array<{
    event: AutomationTrigger["event"];
    label: string;
    channel: string;
    linked: string;
    delay: number;
    segment: string;
    modifier: number;
  }> = [
    {
      event: "SIGNUP",
      label: "Welcome SMS + push on signup",
      channel: "BOTH",
      linked: "WELCOME",
      delay: 0,
      segment: "NEW_SUBSCRIBER",
      modifier: 4,
    },
    {
      event: "CART_ABANDONED",
      label: "Cart recovery SMS after 30 min",
      channel: "SMS",
      linked: "CART_RECOVERY",
      delay: 30,
      segment: "CART_ABANDONER",
      modifier: 2,
    },
    {
      event: "ORDER_PLACED",
      label: "Order confirmation SMS",
      channel: "SMS",
      linked: "ORDER_UPDATE",
      delay: 0,
      segment: "ACTIVE_BUYER",
      modifier: 5,
    },
    {
      event: "ORDER_SHIPPED",
      label: "Shipping alert SMS + push",
      channel: "BOTH",
      linked: "SHIPPING_ALERT / ORDER_SHIPPED",
      delay: 0,
      segment: "ACTIVE_BUYER",
      modifier: 5,
    },
    {
      event: "DELIVERY_CONFIRMED",
      label: "Review request follow-up (push only)",
      channel: "PUSH",
      linked: "PROMOTION",
      delay: 4320,
      segment: "ACTIVE_BUYER",
      modifier: 3,
    },
    {
      event: "INACTIVITY_60D",
      label: "Winback SMS sequence",
      channel: "SMS",
      linked: "WINBACK",
      delay: 86400,
      segment: "LAPSED_CUSTOMER",
      modifier: 0,
    },
    {
      event: "PRICE_DROP",
      label: "Price drop push alert",
      channel: "PUSH",
      linked: "PRICE_DROP",
      delay: 0,
      segment: "BROWSE_ONLY",
      modifier: 2,
    },
    {
      event: "BACK_IN_STOCK",
      label: "Back in stock push",
      channel: "PUSH",
      linked: "BACK_IN_STOCK",
      delay: 0,
      segment: "BROWSE_ONLY",
      modifier: 3,
    },
  ];

  return definitions.map((definition) => ({
    triggerId: randomUUID(),
    event: definition.event,
    label: definition.label,
    channel: definition.channel,
    linkedCampaignType: definition.linked,
    delayMinutes: definition.delay,
    segmentFilter: definition.segment,
    enabled: false as const,
    score: clampScore(base + definition.modifier),
  }));
}

function buildFrequencyControls(input: MobileMessagingInput): FrequencyControl[] {
  const base = baseScore(input);

  return [
    {
      controlId: randomUUID(),
      channel: "SMS",
      label: "SMS frequency cap",
      maxPerDay: 1,
      maxPerWeek: 4,
      minHoursBetween: 24,
      promotionalCapPerWeek: 2,
      score: clampScore(base + 4),
    },
    {
      controlId: randomUUID(),
      channel: "PUSH",
      label: "Push notification frequency cap",
      maxPerDay: 2,
      maxPerWeek: 7,
      minHoursBetween: 4,
      promotionalCapPerWeek: 3,
      score: clampScore(base + 2),
    },
    {
      controlId: randomUUID(),
      channel: "BOTH",
      label: "Cross-channel combined cap",
      maxPerDay: 2,
      maxPerWeek: 8,
      minHoursBetween: 2,
      promotionalCapPerWeek: 4,
      score: clampScore(base + 3),
    },
  ];
}

function buildSignals(
  smsCampaigns: SmsCampaign[],
  pushNotifications: PushNotification[],
  timingRules: MessageTiming[],
  segments: AudienceSegment[],
  automationTriggers: AutomationTrigger[],
  frequencyControls: FrequencyControl[],
  confidence: number,
): MobileMessagingSignal[] {
  return [
    buildSignal(
      "sms_coverage",
      average(smsCampaigns.map((campaign) => campaign.score)),
      `SMS campaigns average ${average(smsCampaigns.map((campaign) => campaign.score)).toFixed(0)}/100`,
    ),
    buildSignal(
      "push_coverage",
      average(pushNotifications.map((notification) => notification.score)),
      `Push notifications average ${average(pushNotifications.map((notification) => notification.score)).toFixed(0)}/100`,
    ),
    buildSignal(
      "timing_quality",
      average(timingRules.map((rule) => rule.score)),
      `Timing rules average ${average(timingRules.map((rule) => rule.score)).toFixed(0)}/100`,
    ),
    buildSignal(
      "segmentation_depth",
      average(segments.map((segment) => segment.score)),
      `${segments.length} segments defined`,
    ),
    buildSignal(
      "automation_readiness",
      average(automationTriggers.map((trigger) => trigger.score)),
      `${automationTriggers.length} automation triggers — all disabled (blueprint)`,
    ),
    buildSignal(
      "frequency_safety",
      average(frequencyControls.map((control) => control.score)),
      `Frequency caps configured for ${frequencyControls.length} channel groups`,
    ),
    buildSignal("messaging_composite", confidence, `Mobile messaging confidence ${confidence}`),
  ];
}

function computeConfidence(signals: MobileMessagingSignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "messaging_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "messaging_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(
  smsCampaigns: SmsCampaign[],
  pushNotifications: PushNotification[],
  segments: AudienceSegment[],
): number {
  return clampScore(
    average([
      ...smsCampaigns.map((campaign) => campaign.score),
      ...pushNotifications.map((notification) => notification.score),
      ...segments.map((segment) => segment.score),
    ]),
  );
}

/** Generates a complete mobile messaging blueprint — intelligence only, no auto-send. */
export function generateMobileMessagingBlueprint(
  input: MobileMessagingInput,
): MobileMessagingBreakdown {
  const smsCampaigns = buildSmsCampaigns(input);
  const pushNotifications = buildPushNotifications(input);
  const timingRules = buildTimingRules(input);
  const segments = buildSegments(input);
  const automationTriggers = buildAutomationTriggers(input);
  const frequencyControls = buildFrequencyControls(input);

  for (const type of SMS_CAMPAIGN_TYPES) {
    if (!smsCampaigns.find((campaign) => campaign.campaignType === type)) {
      throw new Error(`Missing required SMS campaign: ${type}`);
    }
  }

  for (const type of PUSH_NOTIFICATION_TYPES) {
    if (!pushNotifications.find((notification) => notification.notificationType === type)) {
      throw new Error(`Missing required push notification: ${type}`);
    }
  }

  for (const type of AUDIENCE_SEGMENT_TYPES) {
    if (!segments.find((segment) => segment.segmentType === type)) {
      throw new Error(`Missing required audience segment: ${type}`);
    }
  }

  const provisionalSignals = buildSignals(
    smsCampaigns,
    pushNotifications,
    timingRules,
    segments,
    automationTriggers,
    frequencyControls,
    0,
  );
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(
    smsCampaigns,
    pushNotifications,
    timingRules,
    segments,
    automationTriggers,
    frequencyControls,
    confidence,
  );
  const overallScore = computeOverallScore(smsCampaigns, pushNotifications, segments);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    blueprintName: `${input.brand.brandName} Mobile Messaging Blueprint`,
    smsCampaigns,
    pushNotifications,
    timingRules,
    segments,
    automationTriggers,
    frequencyControls,
    overallScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoSendEnabled: false,
  };
}

export const mobileMessagingIntelligenceScoring = {
  generateMobileMessagingBlueprint,
  computeConfidence,
  computeOverallScore,
  MOBILE_MESSAGING_SIGNAL_WEIGHTS,
};
