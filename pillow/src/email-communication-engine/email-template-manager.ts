/** R4-04 — Email template manager. */

import type { EmailCategory, EmailTemplate } from "./types.js";
import type { EmailRegistry } from "./email-registry.js";
import { EmailMetadataGenerator } from "./email-metadata-generator.js";

export class EmailTemplateManager {
  private readonly metadata = new EmailMetadataGenerator();

  createTemplate(input: {
    templateName: string;
    emailCategory: EmailCategory;
    subject: string;
    bodyTemplate: string;
  }): EmailTemplate {
    return this.metadata.buildTemplate(input);
  }

  getTemplate(registry: EmailRegistry, templateId: string): EmailTemplate | null {
    return registry.getTemplate(templateId);
  }

  resolveTemplateRef(
    registry: EmailRegistry,
    templateId: string | undefined,
    category: EmailCategory,
  ): { template: EmailTemplate | null; reference: string } {
    if (templateId) {
      const template = registry.getTemplate(templateId);
      return { template, reference: templateId };
    }
    const fallback = registry.listTemplates().find((t) => t.emailCategory === category && t.enabled);
    return {
      template: fallback ?? null,
      reference: fallback?.templateId ?? `inline-${category}`,
    };
  }
}
