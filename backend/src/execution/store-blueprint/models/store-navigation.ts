import { z } from "zod";

/** A navigational link within the store blueprint. */
export type StoreNavLink = {
  label: string;
  href: string;
  order: number;
};

/** Site-wide navigation structure for a store blueprint. */
export type StoreNavigation = {
  storeName: string;
  primaryLinks: StoreNavLink[];
  footerLinks: StoreNavLink[];
};

export const storeNavLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  order: z.number().int().min(0),
});

export const storeNavigationSchema = z.object({
  storeName: z.string().min(1),
  primaryLinks: z.array(storeNavLinkSchema).min(1),
  footerLinks: z.array(storeNavLinkSchema).min(1),
});

/** Validates a StoreNavigation record shape. */
export function validateStoreNavigation(value: unknown): StoreNavigation {
  return storeNavigationSchema.parse(value);
}
