import type { ExecutiveAcceptancePackCollection } from "./types.js";

import type { GrandKingAcceptanceGateDependencies } from "./integrations.js";

import type { Q1110ContractConsumption } from "./types.js";



export type PrerequisiteInputs = {

  packCollection: ExecutiveAcceptancePackCollection;

  q1110ContractConsumed: Q1110ContractConsumption;

  deps: GrandKingAcceptanceGateDependencies;

};



export function verifyPrerequisiteCertifications(inputs: PrerequisiteInputs) {

  const now = new Date().toISOString();

  const outstandingIssues: string[] = [];

  const evidence: string[] = [];



  const pccrt = inputs.deps.productionCertificationCore;

  let pccrtCertified = false;

  if (pccrt && typeof pccrt.getLatestReport === "function") {

    const report = pccrt.getLatestReport();

    pccrtCertified = report?.decision === "certify";

    evidence.push(`pccrt decision=${report?.decision ?? "none"}`);

    if (!pccrtCertified) outstandingIssues.push("Production Certification Core (PCCRT) not certified");

  } else {

    outstandingIssues.push("Production Certification Core (PCCRT) not injected");

    evidence.push("pccrt not injected");

  }



  const pack = inputs.packCollection.packReport;

  const packAuditCertified =

    pack != null &&

    pack.auditStatus !== "failed" &&

    pack.auditStatus !== "rejected" &&

    pack.auditStatus !== "missing";

  const packCertSummaryComplete =

    pack != null &&

    pack.certificationSummary.failedCount === 0 &&

    pack.certificationSummary.missingCount === 0 &&

    pack.certificationSummary.blockedCount === 0;

  const packDecisionCertify = pack?.decision === "certify";

  const packNotWithholdOrFailed =

    pack != null && pack.decision !== "withhold" && pack.decision !== "escalate";



  if (!pack) {

    outstandingIssues.push("Executive Acceptance Pack report missing");

  } else {

    evidence.push(`packDecision=${pack.decision} auditStatus=${pack.auditStatus}`);

    if (!packAuditCertified) outstandingIssues.push(`Executive Acceptance Pack audit status: ${pack.auditStatus}`);

    if (!packCertSummaryComplete) {

      outstandingIssues.push(

        `Executive Acceptance Pack certification incomplete: failed=${pack.certificationSummary.failedCount} missing=${pack.certificationSummary.missingCount}`,

      );

    }

    if (!packDecisionCertify) {

      outstandingIssues.push(`Executive Acceptance Pack decision=${pack.decision} — withhold blocks deployment authorisation`);

    }

    if (!packNotWithholdOrFailed) {

      outstandingIssues.push("Executive Acceptance Pack withhold/failed — deployment authorisation blocked");

    }

  }



  if (!inputs.q1110ContractConsumed.consumed) {

    outstandingIssues.push(`Q1110 contract not consumed: ${inputs.q1110ContractConsumed.evidence}`);

    evidence.push(inputs.q1110ContractConsumed.evidence);

  } else {

    evidence.push(`q1110ContractConsumed version=${inputs.q1110ContractConsumed.contractVersion}`);

  }



  const allPrerequisitesMet =

    pccrtCertified &&

    packAuditCertified &&

    packCertSummaryComplete &&

    inputs.q1110ContractConsumed.consumed &&

    packDecisionCertify &&

    packNotWithholdOrFailed;



  return {

    verifiedAt: now,

    allPrerequisitesMet,

    pccrtCertified,

    packAuditCertified,

    packCertSummaryComplete,

    q1110ContractConsumed: inputs.q1110ContractConsumed.consumed,

    packDecisionCertify,

    packNotWithholdOrFailed,

    outstandingIssues,

    evidence,

  };

}

