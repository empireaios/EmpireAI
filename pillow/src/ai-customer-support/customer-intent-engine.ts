/** R4-08 — Customer intent engine. */

import type { CustomerIntent } from "./types.js";

const INTENT_PATTERNS: Array<{ intent: CustomerIntent; patterns: RegExp[] }> = [
  { intent: "order_inquiry", patterns: [/order/i, /delivery/i, /shipping/i, /tracking/i] },
  { intent: "billing_question", patterns: [/bill/i, /payment/i, /invoice/i, /refund/i, /charge/i] },
  { intent: "account_issue", patterns: [/account/i, /login/i, /password/i, /locked/i, /access/i] },
  {
    intent: "escalation_required",
    patterns: [/urgent/i, /manager/i, /complaint/i, /lawyer/i, /escalate/i],
  },
  { intent: "support_request", patterns: [/help/i, /support/i, /assist/i, /problem/i, /issue/i] },
];

export class CustomerIntentEngine {
  understandIntent(enquiryText: string): CustomerIntent {
    const text = enquiryText.trim();
    if (!text) return "general_enquiry";

    for (const { intent, patterns } of INTENT_PATTERNS) {
      if (patterns.some((p) => p.test(text))) return intent;
    }
    return "general_enquiry";
  }
}
