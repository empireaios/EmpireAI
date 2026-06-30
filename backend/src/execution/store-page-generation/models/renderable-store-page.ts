import { z } from "zod";

import { STORE_PAGE_TYPES } from "../../store-blueprint/models/store-page.js";
import {
  storePageSignalSchema,
  type StorePageSignal,
} from "./store-page-signal.js";
import { storePageContentSchema, type StorePageContent } from "./store-page-content.js";

export type RenderableStorePageId = string;

export type StorePageType = (typeof STORE_PAGE_TYPES)[number];

/** SEO and social metadata for a renderable store page. */
export type StorePageMetadata = {
  description: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
};

/** A fully renderable storefront page generated from a store blueprint. */
export type RenderableStorePage = {
  renderablePageId: RenderableStorePageId;
  workspaceId: string;
  storeId: string;
  brandId: string;
  pageId: string;
  route: string;
  pageType: StorePageType;
  title: string;
  metadata: StorePageMetadata;
  sections: StorePageContent[];
  renderPayload: Record<string, unknown>;
  confidence: number;
  signals: StorePageSignal[];
  createdAt: string;
  updatedAt: string;
};

export type RenderableStorePageCreateInput = Omit<
  RenderableStorePage,
  "renderablePageId" | "workspaceId" | "createdAt" | "updatedAt"
>;

export const storePageMetadataSchema = z.object({
  description: z.string().min(1),
  keywords: z.array(z.string()).min(1),
  ogTitle: z.string().min(1),
  ogDescription: z.string().min(1),
});

const isoTimestamp = z.string().datetime({ offset: true });

export const renderableStorePageSchema = z.object({
  renderablePageId: z.string().min(1),
  workspaceId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  pageId: z.string().min(1),
  route: z.string().min(1),
  pageType: z.enum(STORE_PAGE_TYPES),
  title: z.string().min(1),
  metadata: storePageMetadataSchema,
  sections: z.array(storePageContentSchema).min(1),
  renderPayload: z.record(z.string(), z.unknown()),
  confidence: z.number().min(0).max(100),
  signals: z.array(storePageSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a RenderableStorePage record shape. */
export function validateRenderableStorePage(value: unknown): RenderableStorePage {
  return renderableStorePageSchema.parse(value);
}
