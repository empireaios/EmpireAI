/** R4-05 — SMS template manager. */

import type { SmsCategory, SmsTemplate } from "./types.js";
import type { SmsRegistry } from "./sms-registry.js";
import { SmsMetadataGenerator } from "./sms-metadata-generator.js";

export class SmsTemplateManager {
  private readonly metadata = new SmsMetadataGenerator();

  createTemplate(input: {
    templateName: string;
    smsCategory: SmsCategory;
    bodyTemplate: string;
  }): SmsTemplate {
    return this.metadata.buildTemplate(input);
  }

  resolveTemplateRef(
    registry: SmsRegistry,
    templateId: string | undefined,
    category: SmsCategory,
  ): { template: SmsTemplate | null; reference: string } {
    if (templateId) {
      const template = registry.getTemplate(templateId);
      return { template, reference: templateId };
    }
    const fallback = registry.listTemplates().find((t) => t.smsCategory === category && t.enabled);
    return {
      template: fallback ?? null,
      reference: fallback?.templateId ?? `inline-${category}`,
    };
  }
}
