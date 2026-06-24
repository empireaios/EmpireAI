import type { BuyerPersona, BuyerPersonaCreateInput, BuyerPersonaUpdateInput } from "../models/buyer-persona.js";
import type { BuyerIntent, BuyerIntentCreateInput, BuyerIntentUpdateInput } from "../models/buyer-intent.js";
import type { NeedCategory, NeedCategoryCreateInput, NeedCategoryUpdateInput } from "../models/need-category.js";
import type {
  PurchaseTrigger,
  PurchaseTriggerCreateInput,
  PurchaseTriggerUpdateInput,
} from "../models/purchase-trigger.js";
import type {
  AudienceSegment,
  AudienceSegmentCreateInput,
  AudienceSegmentUpdateInput,
  SegmentMembership,
} from "../models/audience-segment.js";
import type { EyeSignalDomain } from "../../../eye/types.js";
import type { BuyerIntentStage } from "../models/buyer-intent.js";
import type { BuyerIntentUrgency } from "../models/buyer-intent.js";

/** Shared pagination for workspace-scoped repository queries. */
export type BuyerIntelligenceListQuery = {
  workspaceId: string;
  limit?: number;
  offset?: number;
};

export type BuyerPersonaQuery = BuyerIntelligenceListQuery & {
  slug?: string;
  tag?: string;
  nameContains?: string;
};

export type BuyerIntentQuery = BuyerIntelligenceListQuery & {
  personaId?: string;
  stage?: BuyerIntentStage;
  urgency?: BuyerIntentUrgency;
  subjectKey?: string;
  minConfidence?: number;
};

export type NeedCategoryQuery = BuyerIntelligenceListQuery & {
  slug?: string;
  observationDomain?: EyeSignalDomain;
  parentCategoryId?: string;
};

export type PurchaseTriggerQuery = BuyerIntelligenceListQuery & {
  triggerType?: PurchaseTrigger["triggerType"];
  activeOnly?: boolean;
  needCategoryId?: string;
};

export type AudienceSegmentQuery = BuyerIntelligenceListQuery & {
  slug?: string;
  status?: AudienceSegment["status"];
  personaId?: string;
};

export type SegmentMembershipQuery = BuyerIntelligenceListQuery & {
  segmentId: string;
  memberRef?: string;
};

/** CRUD contract for buyer personas — in-memory implementation available in Mission 023. */
export interface BuyerPersonaRepository {
  create(workspaceId: string, input: BuyerPersonaCreateInput): Promise<BuyerPersona>;
  getById(workspaceId: string, id: string): Promise<BuyerPersona | null>;
  getBySlug(workspaceId: string, slug: string): Promise<BuyerPersona | null>;
  update(workspaceId: string, id: string, input: BuyerPersonaUpdateInput): Promise<BuyerPersona>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: BuyerPersonaQuery): Promise<BuyerPersona[]>;
}

/** CRUD contract for buyer intents. */
export interface BuyerIntentRepository {
  create(workspaceId: string, input: BuyerIntentCreateInput): Promise<BuyerIntent>;
  getById(workspaceId: string, id: string): Promise<BuyerIntent | null>;
  update(workspaceId: string, id: string, input: BuyerIntentUpdateInput): Promise<BuyerIntent>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: BuyerIntentQuery): Promise<BuyerIntent[]>;
  listByObservation(workspaceId: string, observationId: string): Promise<BuyerIntent[]>;
}

/** CRUD contract for need categories. */
export interface NeedCategoryRepository {
  create(workspaceId: string, input: NeedCategoryCreateInput): Promise<NeedCategory>;
  getById(workspaceId: string, id: string): Promise<NeedCategory | null>;
  getBySlug(workspaceId: string, slug: string): Promise<NeedCategory | null>;
  update(workspaceId: string, id: string, input: NeedCategoryUpdateInput): Promise<NeedCategory>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: NeedCategoryQuery): Promise<NeedCategory[]>;
}

/** CRUD contract for purchase triggers. */
export interface PurchaseTriggerRepository {
  create(workspaceId: string, input: PurchaseTriggerCreateInput): Promise<PurchaseTrigger>;
  getById(workspaceId: string, id: string): Promise<PurchaseTrigger | null>;
  update(workspaceId: string, id: string, input: PurchaseTriggerUpdateInput): Promise<PurchaseTrigger>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: PurchaseTriggerQuery): Promise<PurchaseTrigger[]>;
}

/** CRUD contract for audience segments. */
export interface AudienceSegmentRepository {
  create(workspaceId: string, input: AudienceSegmentCreateInput): Promise<AudienceSegment>;
  getById(workspaceId: string, id: string): Promise<AudienceSegment | null>;
  getBySlug(workspaceId: string, slug: string): Promise<AudienceSegment | null>;
  update(workspaceId: string, id: string, input: AudienceSegmentUpdateInput): Promise<AudienceSegment>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: AudienceSegmentQuery): Promise<AudienceSegment[]>;
}

/** Query contract for segment membership rows. */
export interface SegmentMembershipRepository {
  add(membership: Omit<SegmentMembership, "id"> & { id?: string }): Promise<SegmentMembership>;
  remove(workspaceId: string, id: string): Promise<boolean>;
  list(query: SegmentMembershipQuery): Promise<SegmentMembership[]>;
  countBySegment(workspaceId: string, segmentId: string): Promise<number>;
}

/** Aggregated repository surface for Buyer Intelligence persistence. */
export interface BuyerIntelligenceRepository {
  readonly personas: BuyerPersonaRepository;
  readonly intents: BuyerIntentRepository;
  readonly needCategories: NeedCategoryRepository;
  readonly purchaseTriggers: PurchaseTriggerRepository;
  readonly audienceSegments: AudienceSegmentRepository;
  readonly segmentMemberships: SegmentMembershipRepository;
}
