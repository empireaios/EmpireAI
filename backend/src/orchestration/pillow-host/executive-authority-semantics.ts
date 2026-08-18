/**
 * Executive authority / delegation / capability / execution semantics.
 *
 * Separates Wave-1 truth/evidence discipline from governance requests:
 * owner authorization ≠ capability ≠ governance permission ≠ execution.
 *
 * Does not encode sealed Wave 2 T2 prompts or fixed spend amounts.
 */

import type { ExecutiveTruthSnapshot } from "./executive-truth-types.js";
import { getPillowCapabilityRegistry } from "./pillow-capability-registry.js";

export type AuthorityTaskKind =
  | "authority_analysis"
  | "delegation_analysis"
  | "governance_analysis"
  | "capability_analysis"
  | "execution_analysis"
  | "approval_requirement"
  | "delegation_controls";

export type DelegationMode =
  | "recommendation_only"
  | "one_time_authorization"
  | "standing_delegation"
  | "dynamic_adjustment"
  | "unbounded_autonomy_request"
  | "revocation"
  | "none";

export type DelegationObject = {
  delegator: "grand_king" | "unknown";
  delegate: "pillow" | "unknown";
  actionClass: string;
  mode: DelegationMode;
  financialLimitText: string | null;
  cumulativeAmbiguous: boolean;
  stopConditions: string[];
  escalationConditions: string[];
  revoked: boolean;
  doNotAskAgain: boolean;
};

/** Owner / governance language that must not become claim-audit. */
export function hasAuthoritySemanticsMarker(text: string): boolean {
  const t = String(text || "");
  return (
    /\b(authori[sz]e|authori[sz]ation|delegat(?:e|ion|ed|ing)?|discretion|approval(?:s)?|governance|capability|executable|execution authority|owner (?:intent|authority|instruction)|grand king|do not (?:ask|seek) (?:again|another approval)|without (?:another |further )?approval|you may (?:spend|decide|choose|adjust|launch|manage)|anything below|up to (?:s\$|\$|sgd|usd)?\s*[\d,]+|budget ceiling|spend ceiling|standing (?:authority|delegation)|one[- ]time (?:authori|approval|spend)|revoke|revocation|supersede[sd]?|kill switch|stop[- ]loss|within (?:this |the )?(?:limit|ceiling|budget))\b/i.test(
      t,
    ) ||
    /\b(?:who (?:may|can|is authorised)|may (?:i|you|pillow)|does this (?:instruction|message|authori)|is (?:this|that) (?:enough|sufficient) (?:to )?(?:authori|delegat|spend|execute))\b/i.test(
      t,
    )
  );
}

/**
 * Prefer authority kinds over premise_audit when both lexical families fire.
 * Financial ceilings in delegation text are NOT sales/demand claims.
 */
export function classifyAuthorityKind(part: string): AuthorityTaskKind | null {
  const m = String(part || "").trim();
  if (!m || !hasAuthoritySemanticsMarker(m)) return null;

  if (/\b(revok\w*|supersede\w*|newer (?:instruction|authori)|withdraw (?:authori|delegat)|cancel (?:the )?delegat)\b/i.test(m)) {
    return "delegation_analysis";
  }
  if (
    /\b(stop[- ]loss|kill switch|escalat|audit trail|rate limit|idempoten|controls?|boundary|boundaries|precondition|time window|measurement window)\b/i.test(
      m,
    )
  ) {
    return "delegation_controls";
  }
  if (
    /\b(can (?:the )?system|system capability|connected|integration|actually (?:spend|execute|launch|publish)|do we have (?:a |an )?(?:ads?|advertising|spend|payment|supplier) (?:api|integration|channel)|executable now|tool[- ]calling)\b/i.test(
      m,
    )
  ) {
    return "capability_analysis";
  }
  if (
    /\b(did (?:you|it|pillow) (?:spend|execute|launch|pay)|was (?:it |the action )?executed|execution occurred|perform(?:ed)? the (?:spend|purchase|launch)|confirm (?:the )?execution)\b/i.test(
      m,
    )
  ) {
    return "execution_analysis";
  }
  if (
    /\b(governance|constitutional|policy|digital soul|permitted|forbidden|allowed under|approval gate|requires? grand king)\b/i.test(
      m,
    )
  ) {
    return "governance_analysis";
  }
  if (
    /\b(need(?:s)? (?:another |further )?approval|require(?:s)? approval|must (?:i|you) ask|do not ask again|without another approval|approval required)\b/i.test(
      m,
    )
  ) {
    return "approval_requirement";
  }
  if (
    /\b(delegat|discretion|you may (?:decide|choose|adjust|spend)|anything below|standing|one[- ]time|automatic(?:ally)? adjust|within .{0,40}(?:ceiling|limit|budget)|up to (?:s\$|\$))\b/i.test(
      m,
    )
  ) {
    return "delegation_analysis";
  }
  return "authority_analysis";
}

export function extractDelegationObject(message: string): DelegationObject {
  const t = String(message || "");
  const revoked = /\b(revok\w*|withdraw (?:authori|delegat)\w*|cancel (?:the )?delegat\w*|no longer authori\w*)\b/i.test(
    t,
  );
  const doNotAskAgain =
    /\b(do not (?:ask|seek) (?:again|another approval)|without (?:another |further )?approval|no further approval)\b/i.test(
      t,
    );
  const financial =
    t.match(
      /\b(?:up to|below|under|ceiling(?: of)?|limit(?: of)?|maximum(?: of)?|cap(?: of)?)\s*(?:s\$|\$|sgd|usd)?\s*([\d,]+(?:\.\d+)?)/i,
    ) ??
    t.match(/\b((?:s\$|\$)\s*[\d,]+(?:\.\d+)?)\b/i);
  const financialLimitText = financial
    ? String(financial[0] || financial[1] || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 40)
    : null;

  let mode: DelegationMode = "none";
  if (revoked) mode = "revocation";
  else if (/\b(autonomous(?:ly)?|full autonomy|manage .{0,40}(?:budget|spend) without)\b/i.test(t))
    mode = "unbounded_autonomy_request";
  else if (
    /\b(automatic(?:ally)? adjust|adjust .{0,40}(?:spend|budget|bid)|dynamic (?:adjust|spend)|based on performance)\b/i.test(
      t,
    )
  )
    mode = "dynamic_adjustment";
  else if (
    /\b(standing (?:authori|delegat)|ongoing|until (?:revoked|i say)|you may continue|anything below)\b/i.test(
      t,
    )
  )
    mode = "standing_delegation";
  else if (
    /\b(one[- ]time|this (?:one )?test|this (?:campaign|action) only|spend .{0,30} (?:once|on this))\b/i.test(
      t,
    )
  )
    mode = "one_time_authorization";
  else if (
    /\b(authori[sz]e|you may (?:spend|launch|decide)|delegat|discretion|up to|below)\b/i.test(t)
  )
    mode = "standing_delegation";
  else if (/\b(recommend|what (?:would|should) you|advice only)\b/i.test(t))
    mode = "recommendation_only";

  const actionClass = /\b(advertis|ads?|marketing|campaign)\b/i.test(t)
    ? "marketing_spend"
    : /\b(procur|supplier|inventory|purchase order)\b/i.test(t)
      ? "procurement"
      : /\b(pric(?:e|ing)|refund|publish|deploy|infrastruct|customer remediat)\b/i.test(t)
        ? "operations"
        : /\b(spend|budget|financial|payment)\b/i.test(t)
          ? "financial_action"
          : "general_action";

  const cumulativeAmbiguous =
    Boolean(financialLimitText) &&
    !/\b(per (?:day|transaction|campaign|action|test)|cumulative|lifetime|total exposure|daily)\b/i.test(
      t,
    );

  const stopConditions: string[] = [];
  if (/\bstop[- ]loss\b/i.test(t)) stopConditions.push("stop-loss threshold");
  if (/\bkill switch\b/i.test(t)) stopConditions.push("owner kill switch");
  if (financialLimitText) stopConditions.push(`hard ceiling ${financialLimitText}`);

  const escalationConditions: string[] = [];
  if (/\bescalat/i.test(t)) escalationConditions.push("owner-defined escalation triggers");
  if (mode === "dynamic_adjustment") {
    escalationConditions.push("performance or attribution uncertainty beyond the bound");
  }
  if (mode === "unbounded_autonomy_request") {
    escalationConditions.push("unbounded autonomy requires explicit governance redesign");
  }

  return {
    delegator: /\b(grand king|i authori|i (?:am )?(?:delegat|grant)|owner)\b/i.test(t)
      ? "grand_king"
      : "unknown",
    delegate: /\b(pillow|you may|your decision)\b/i.test(t) ? "pillow" : "unknown",
    actionClass,
    mode,
    financialLimitText,
    cumulativeAmbiguous,
    stopConditions,
    escalationConditions,
    revoked,
    doNotAskAgain,
  };
}

/** Financial / side-effect execution is not available from executive chat today. */
export function hasFinancialExecutionCapability(): boolean {
  const regs = getPillowCapabilityRegistry();
  const spendLike = regs.find(
    (c) =>
      /spend|advert|payment|supplier.?spend|publish|deploy/i.test(c.id) ||
      /spend|advert|payment/i.test(c.label),
  );
  if (spendLike) return spendLike.availability === "available" && spendLike.write;
  // Registry has no ads/spend writer; chat tool loop is unavailable.
  return false;
}

export function authorityKindSignals(kind: AuthorityTaskKind): RegExp {
  switch (kind) {
    case "authority_analysis":
      return /\b(authori[sz]|owner|grand king|ultimate authority|recommendation(?:s)? (?:are|is) not|does not (?:by itself )?authori)\b/i;
    case "delegation_analysis":
      return /\b(delegat|discretion|ceiling|standing|one[- ]time|revok|within (?:the )?(?:limit|bound)|automatic(?:ally)? adjust)\b/i;
    case "governance_analysis":
      return /\b(governance|policy|constitutional|permitted|forbidden|approval gate|requires? grand king)\b/i;
    case "capability_analysis":
      return /\b(capability|cannot (?:yet )?execute|not (?:yet )?connected|integration|system (?:can|cannot)|executable)\b/i;
    case "execution_analysis":
      return /\b(execution|did not (?:spend|execute|launch)|no (?:external )?side effect|was not (?:performed|executed)|not claim(?:ed)? execution)\b/i;
    case "approval_requirement":
      return /\b(approval|ask again|further approval|without another|still require)\b/i;
    case "delegation_controls":
      return /\b(stop[- ]loss|kill switch|audit|escalat|rate limit|idempoten|control|boundary|measurement)\b/i;
    default:
      return /\b(authori|delegat|capability|governance|execution)\b/i;
  }
}

function verifiedAuthorityLines(truth: ExecutiveTruthSnapshot): string[] {
  const a = truth.authority;
  return [
    `Verified chat posture: publish=${a.pillowMayPublish}; supplier spend=${a.pillowMaySupplierSpend}; Birth authorisation=${a.pillowMayAuthoriseBirth}; production deploy=${a.pillowMayExecuteProductionDeploy}; in-chat tool loop=${a.chatHasToolCallingLoop}.`,
    a.executableNow.length
      ? `Executable now from this chat: ${a.executableNow.join("; ")}.`
      : "Executable now from this chat: answer / recommend / analyze only.",
    a.requiresGrandKing.length
      ? `Still requires Grand King: ${a.requiresGrandKing.join("; ")}.`
      : "Grand King remains ultimate owner for irreversible actions.",
  ];
}

export function synthesizeAuthorityUnitAnswer(
  kind: AuthorityTaskKind,
  subject: string,
  truth: ExecutiveTruthSnapshot,
  message: string,
): string {
  const d = extractDelegationObject(`${subject} ${message}`);
  const canSpend = hasFinancialExecutionCapability();
  const label = subject.slice(0, 90) || "this authority question";
  const authLines = verifiedAuthorityLines(truth);

  switch (kind) {
    case "authority_analysis":
      return [
        `### Authority reading — ${label}`,
        "**Owner intent:** treat the Grand King instruction as authority input, not as a sales/demand fact claim.",
        "**Owner authorization:** recommendation is not authorization; authorization is not execution.",
        d.mode === "recommendation_only"
          ? "**Reading:** this turn asks for advice — not a spend grant."
          : `**Reading:** owner language looks like ${d.mode.replace(/_/g, " ")}${d.financialLimitText ? ` with bound ${d.financialLimitText}` : ""}.`,
        ...authLines.slice(0, 2),
        "I will not invent owner approval, expand scope, or treat silence as consent.",
      ].join("\n");

    case "delegation_analysis": {
      if (d.revoked || d.mode === "revocation") {
        return [
          `### Delegation reading — ${label}`,
          "**Status:** newer owner instruction revokes or narrows prior delegated discretion.",
          "Newest valid authority state wins over older standing grants.",
          "I will not treat a prior ceiling as still live after revocation.",
          ...authLines.slice(0, 1),
        ].join("\n");
      }
      const scopeNote = d.cumulativeAmbiguous
        ? "The stated ceiling is useful, but cumulative vs per-action exposure is not fully specified — for irreversible spend I would confirm that before treating the bound as standing autonomy."
        : "The stated bound is clear enough for bounded recommendation and control design.";
      return [
        `### Delegation reading — ${label}`,
        `**Mode:** ${d.mode.replace(/_/g, " ")}.`,
        `**Action class:** ${d.actionClass.replace(/_/g, " ")}.`,
        d.financialLimitText
          ? `**Financial bound mentioned:** ${d.financialLimitText}. A ceiling authorizes up to that bound — it does not require spending the maximum.`
          : "**Financial bound:** none explicitly quantified in this span.",
        scopeNote,
        d.mode === "dynamic_adjustment"
          ? "**Dynamic adjustment:** would still need hard ceiling, measurement window, stop-loss, and escalation rules before safe autonomy."
          : d.mode === "one_time_authorization"
            ? "**One-time vs standing:** this reads as a single-action grant, not ongoing autonomous management."
            : d.mode === "unbounded_autonomy_request"
              ? "**Unbounded autonomy:** not equivalent to a bounded ceiling — governance must narrow it before execution."
              : "**Standing discretion:** valid only inside the stated bound, channel, and stop conditions.",
        d.doNotAskAgain
          ? "**Do-not-ask-again:** applies only inside a still-valid bound; crossing the bound re-opens escalation."
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    case "governance_analysis":
      return [
        `### Governance reading — ${label}`,
        "**Governance permission** is distinct from owner authorization and from system capability.",
        "Immutable safety / legal / Birth / production-deploy boundaries cannot be casually bypassed by a chat instruction.",
        "Valid bounded delegation can support safe autonomy; it does not rewrite constitutional owner primacy.",
        ...authLines.slice(0, 2),
      ].join("\n");

    case "capability_analysis":
      return [
        `### Capability reading — ${label}`,
        canSpend
          ? "**System capability:** a write-capable financial execution path is marked available in registry."
          : "**System capability:** this chat does not currently have a connected write path to perform real advertising spend, transfers, or marketplace mutations.",
        "Owner authorization ≠ system capability. Clear authorization still cannot create a missing integration.",
        "Strongest useful next step: keep the authority model and recommended reversible test design ready for when an execution channel exists.",
        ...authLines.slice(1, 2),
      ].join("\n");

    case "execution_analysis":
      return [
        `### Execution reading — ${label}`,
        "**Actual execution:** no external financial side effect was performed in this turn.",
        "I will not claim a spend, launch, purchase, publish, or transfer occurred.",
        canSpend
          ? "If an execution channel exists, it still requires a separate, explicit execution step with audit logging — chat text alone is not the side effect."
          : "Without a connected execution channel, the correct state is: authorized-or-not analyzed; not executed.",
      ].join("\n");

    case "approval_requirement":
      return [
        `### Approval requirement — ${label}`,
        d.doNotAskAgain && d.mode !== "none" && d.mode !== "revocation"
          ? "**Inside a valid bound:** further approval is not required for each micro-decision beneath the owner ceiling."
          : "**Default:** irreversible financial actions still need clear owner authorization before Pillow may treat them as approved.",
        "Crossing the bound, changing action class, or losing capability re-opens the need to escalate.",
        "Recommendation of a smaller test is not itself a spend approval.",
      ].join("\n");

    case "delegation_controls":
      return [
        `### Delegation controls — ${label}`,
        "Safe autonomy needs: hard budget cap, cumulative exposure limit, measurement window, stop-loss, kill switch, audit trail, idempotency for side effects, and escalation on anomaly.",
        d.financialLimitText
          ? `Owner-stated ceiling to respect: ${d.financialLimitText}.`
          : "No numeric ceiling was supplied — do not invent one.",
        d.stopConditions.length
          ? `Stop conditions noted: ${d.stopConditions.join("; ")}.`
          : "Stop conditions should be explicit before automatic adjustment.",
        d.escalationConditions.length
          ? `Escalation: ${d.escalationConditions.join("; ")}.`
          : "Escalate when evidence quality or exposure risk exceeds the bound.",
        "Side-effect retries must remain idempotent — conversational recovery must not duplicate spends.",
      ].join("\n");

    default:
      return synthesizeAuthorityUnitAnswer("authority_analysis", subject, truth, message);
  }
}

/** Authority asks must not inject live commerce grounding. */
export function authorityAskBlocksCommerceGrounding(userMessage: string): boolean {
  const t = String(userMessage || "");
  if (!hasAuthoritySemanticsMarker(t)) return false;
  // Mixed turns that also ask commercial evidence may still need live facts.
  const asksCommerceEvidence =
    /\b(realised (?:orders?|revenue)|sales? (?:count|volume)|demand strength|bound product|mini fan|asin|commissioning)\b/i.test(
      t,
    ) && !/\b(?:do not mention|not (?:about|facts?)|synthetic)\b/i.test(t);
  return !asksCommerceEvidence;
}
