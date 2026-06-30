import { z } from "zod";

import {
  LANDING_PAGE_SECTION_TYPES,
  type LandingPageSectionType,
} from "../../landing-page-blueprint/models/landing-page-section.js";

/** Generated content block for a landing page section. */
export type ContentSection = {
  sectionType: LandingPageSectionType;
  headline: string;
  paragraphs: string[];
  bullets: string[];
  callToAction: string | null;
};

export const contentSectionSchema = z.object({
  sectionType: z.enum(LANDING_PAGE_SECTION_TYPES),
  headline: z.string().min(1),
  paragraphs: z.array(z.string()).min(1),
  bullets: z.array(z.string()),
  callToAction: z.string().nullable(),
});

/** Validates a ContentSection record shape. */
export function validateContentSection(value: unknown): ContentSection {
  return contentSectionSchema.parse(value);
}

/** Renders a ContentSection into publish-ready copy. */
export function renderContentSection(section: ContentSection): string {
  const parts = [
    section.headline,
    ...section.paragraphs,
    ...section.bullets.map((bullet) => `- ${bullet}`),
  ];

  if (section.callToAction) {
    parts.push(`[${section.callToAction}]`);
  }

  return parts.join("\n\n");
}
