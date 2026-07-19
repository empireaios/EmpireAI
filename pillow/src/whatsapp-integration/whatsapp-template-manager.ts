/** R4-06 — WhatsApp template manager. */

import type { MessageCategory, WhatsAppTemplate } from "./types.js";
import type { WhatsAppRegistry } from "./whatsapp-registry.js";
import { WhatsAppMetadataGenerator } from "./whatsapp-metadata-generator.js";

export class WhatsAppTemplateManager {
  private readonly metadata = new WhatsAppMetadataGenerator();

  createTemplate(input: {
    templateName: string;
    messageCategory: MessageCategory;
    bodyTemplate: string;
  }): WhatsAppTemplate {
    return this.metadata.buildTemplate(input);
  }

  resolveTemplateRef(
    registry: WhatsAppRegistry,
    templateId: string | undefined,
    category: MessageCategory,
  ): { template: WhatsAppTemplate | null; reference: string } {
    if (templateId) {
      const template = registry.getTemplate(templateId);
      return { template, reference: templateId };
    }
    const fallback = registry
      .listTemplates()
      .find((t) => t.messageCategory === category && t.enabled);
    return {
      template: fallback ?? null,
      reference: fallback?.templateId ?? `inline-${category}`,
    };
  }
}
