import { nextTemplateId } from "./whatsapp-builder.js";
import type { MessageTemplate, WhatsAppInput } from "./types.js";

const DEFAULT_TEMPLATES: Array<Omit<MessageTemplate, "templateId" | "createdAt" | "updatedAt">> = [
  {
    name: "enquiry_auto_reply",
    body: "Thank you for contacting us via WhatsApp. We received your enquiry and will respond shortly.",
    category: "auto_reply",
    language: "en",
    variables: [],
  },
  {
    name: "booking_confirmation_notice",
    body: "Your booking request has been forwarded. Reference: {{customerReference}}.",
    category: "booking",
    language: "en",
    variables: ["customerReference"],
  },
  {
    name: "follow_up_reminder",
    body: "Friendly reminder regarding your enquiry. Reply anytime if you need assistance.",
    category: "reminder",
    language: "en",
    variables: [],
  },
  {
    name: "quotation_ack",
    body: "We are preparing a quotation for your request. A team member will follow up.",
    category: "quotation",
    language: "en",
    variables: [],
  },
];

export class MessageTemplateRegistry {
  private templates = new Map<string, MessageTemplate>();

  ensureDefaults() {
    if (this.templates.size > 0) return;
    const now = new Date().toISOString();
    for (const def of DEFAULT_TEMPLATES) {
      const templateId = nextTemplateId();
      this.templates.set(templateId, {
        templateId,
        ...def,
        variables: [...def.variables],
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  seed(templates: MessageTemplate[]) {
    this.templates.clear();
    for (const t of templates) {
      this.templates.set(t.templateId, {
        ...t,
        variables: [...t.variables],
      });
    }
  }

  list() {
    return [...this.templates.values()].map((t) => ({
      ...t,
      variables: [...t.variables],
    }));
  }

  get(templateId: string) {
    const t = this.templates.get(templateId);
    return t ? { ...t, variables: [...t.variables] } : null;
  }

  findByName(name: string) {
    const needle = name.trim().toLowerCase();
    const found = [...this.templates.values()].find((t) => t.name.toLowerCase() === needle);
    return found ? { ...found, variables: [...found.variables] } : null;
  }

  createFromInput(input: WhatsAppInput): MessageTemplate {
    const now = new Date().toISOString();
    const templateId = input.templateId?.trim() || nextTemplateId();
    const template: MessageTemplate = {
      templateId,
      name: input.templateName?.trim() || `template-${templateId}`,
      body: input.templateBody?.trim() || input.messageBody?.trim() || "",
      category: input.templateCategory?.trim() || "custom",
      language: "en",
      variables: [...(input.templateVariables ?? [])],
      createdAt: now,
      updatedAt: now,
    };
    this.templates.set(templateId, template);
    return { ...template, variables: [...template.variables] };
  }

  applyVariables(template: MessageTemplate, vars: Record<string, string>): string {
    let body = template.body;
    for (const [key, value] of Object.entries(vars)) {
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return body;
  }
}
