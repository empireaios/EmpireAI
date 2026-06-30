import { z } from "zod";

import {
  storeBlueprintSignalSchema,
  type StoreBlueprintSignal,
} from "./store-blueprint-signal.js";
import { storeNavigationSchema, type StoreNavigation } from "./store-navigation.js";
import { storePageSchema, type StorePage } from "./store-page.js";

export type StoreBlueprintId = string;

/** Complete store blueprint generated from brand, portfolio, offer, and content inputs. */
export type StoreBlueprint = {
  storeId: StoreBlueprintId;
  workspaceId: string;
  brandId: string;
  homepage: StorePage;
  collectionPages: StorePage[];
  productPages: StorePage[];
  aboutPage: StorePage;
  faqPage: StorePage;
  contactPage: StorePage;
  navigation: StoreNavigation;
  confidence: number;
  signals: StoreBlueprintSignal[];
  createdAt: string;
  updatedAt: string;
};

export type StoreBlueprintCreateInput = Omit<
  StoreBlueprint,
  "storeId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const storeBlueprintSchema = z.object({
  storeId: z.string().min(1),
  workspaceId: z.string().min(1),
  brandId: z.string().min(1),
  homepage: storePageSchema,
  collectionPages: z.array(storePageSchema).min(1),
  productPages: z.array(storePageSchema).min(1),
  aboutPage: storePageSchema,
  faqPage: storePageSchema,
  contactPage: storePageSchema,
  navigation: storeNavigationSchema,
  confidence: z.number().min(0).max(100),
  signals: z.array(storeBlueprintSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a StoreBlueprint record shape. */
export function validateStoreBlueprint(value: unknown): StoreBlueprint {
  return storeBlueprintSchema.parse(value);
}
