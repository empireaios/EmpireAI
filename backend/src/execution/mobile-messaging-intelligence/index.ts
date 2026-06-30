export {
  SMS_CAMPAIGN_TYPES,
  SMS_CAMPAIGN_LABELS,
  smsCampaignTypeSchema,
  validateSmsCampaignType,
} from "./models/sms-campaign-types.js";
export type { SmsCampaignType } from "./models/sms-campaign-types.js";

export {
  SMS_CAMPAIGN_STATUSES,
  smsCampaignSchema,
  validateSmsCampaign,
} from "./models/sms-campaign.js";
export type { SmsCampaignStatus, SmsCampaign } from "./models/sms-campaign.js";

export {
  PUSH_NOTIFICATION_TYPES,
  PUSH_NOTIFICATION_LABELS,
  pushNotificationTypeSchema,
  validatePushNotificationType,
} from "./models/push-notification-types.js";
export type { PushNotificationType } from "./models/push-notification-types.js";

export {
  PUSH_NOTIFICATION_STATUSES,
  pushNotificationSchema,
  validatePushNotification,
} from "./models/push-notification.js";
export type { PushNotificationStatus, PushNotification } from "./models/push-notification.js";

export {
  MESSAGE_CHANNELS,
  messageTimingSchema,
  validateMessageTiming,
} from "./models/message-timing.js";
export type { MessageChannel, MessageTiming } from "./models/message-timing.js";

export {
  AUDIENCE_SEGMENT_TYPES,
  AUDIENCE_SEGMENT_LABELS,
  audienceSegmentSchema,
  validateAudienceSegment,
} from "./models/audience-segment.js";
export type { AudienceSegmentType, AudienceSegment } from "./models/audience-segment.js";

export {
  AUTOMATION_TRIGGER_EVENTS,
  automationTriggerSchema,
  validateAutomationTrigger,
} from "./models/automation-trigger.js";
export type { AutomationTriggerEvent, AutomationTrigger } from "./models/automation-trigger.js";

export {
  frequencyControlSchema,
  validateFrequencyControl,
} from "./models/frequency-control.js";
export type { FrequencyControl } from "./models/frequency-control.js";

export {
  MOBILE_MESSAGING_SIGNAL_TYPES,
  mobileMessagingSignalSchema,
  validateMobileMessagingSignal,
} from "./models/mobile-messaging-signal.js";
export type { MobileMessagingSignalType, MobileMessagingSignal } from "./models/mobile-messaging-signal.js";

export {
  mobileMessagingBlueprintSchema,
  validateMobileMessagingBlueprint,
} from "./models/mobile-messaging-blueprint.js";
export type {
  MobileMessagingBlueprintId,
  MobileMessagingBlueprint,
  MobileMessagingBlueprintCreateInput,
} from "./models/mobile-messaging-blueprint.js";

export {
  mobileMessagingRecordSchema,
  validateMobileMessagingRecord,
} from "./models/mobile-messaging-record.js";
export type {
  MobileMessagingRecordId,
  MobileMessagingRecord,
  MobileMessagingRecordCreateInput,
} from "./models/mobile-messaging-record.js";

export type {
  MobileMessagingRepositoryQuery,
  MobileMessagingRepository,
} from "./repositories/mobile-messaging-repository.js";

export {
  InMemoryMobileMessagingRepository,
  createInMemoryMobileMessagingRepository,
} from "./repositories/in-memory-mobile-messaging-repository.js";

export {
  MOBILE_MESSAGING_SIGNAL_WEIGHTS,
  generateMobileMessagingBlueprint,
  mobileMessagingIntelligenceScoring,
} from "./scoring/mobile-messaging-intelligence-scoring.js";
export type {
  MobileMessagingBrandInput,
  MobileMessagingOfferInput,
  MobileMessagingInput,
  MobileMessagingBreakdown,
} from "./scoring/mobile-messaging-intelligence-scoring.js";

export {
  MobileMessagingIntelligenceEngine,
  defaultMobileMessagingIntelligenceEngine,
} from "./engines/mobile-messaging-intelligence-engine.js";

export {
  MOBILE_MESSAGING_INTELLIGENCE_MODULE_ID,
  MOBILE_MESSAGING_INTELLIGENCE_MODULE_VERSION,
  MOBILE_MESSAGING_INTELLIGENCE_CAPABILITIES,
  MOBILE_MESSAGING_INTELLIGENCE_MODULE_CONTRACT,
  MobileMessagingIntelligenceModule,
  createMobileMessagingIntelligenceModule,
  mobileMessagingIntelligenceModule,
} from "./contract/mobile-messaging-intelligence-module.js";
export type {
  MobileMessagingIntelligenceModuleId,
  MobileMessagingIntelligenceCapability,
  MobileMessagingIntelligenceModuleContract,
} from "./contract/mobile-messaging-intelligence-module.js";
