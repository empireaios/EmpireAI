import type { UxEngineeringSpec, UxValidationResult } from "./types.js";

export function validateUxImplementation(input: {
  originalRequest: string;
  spec: UxEngineeringSpec;
  changedFiles: string[];
  visualChecklist?: Partial<Record<string, boolean>>;
}): UxValidationResult {
  const findings: string[] = [];
  const blockers: string[] = [];

  const checklist = input.visualChecklist ?? {};
  const layoutMatches = checklist.layout ?? input.changedFiles.some((f) => f.includes("page.tsx") || f.includes("components"));
  const stylingMatches = checklist.styling ?? input.changedFiles.some((f) => f.includes("globals.css") || f.includes(".tsx"));
  const responsiveMatches = checklist.responsive ?? true;
  const componentBehaviourMatches = checklist.components ?? !input.changedFiles.some((f) => f.includes("useBrainModule"));
  const visualConsistencyMatches = checklist.consistency ?? input.changedFiles.length <= 10;
  const designIntentMatches = checklist.intent ?? input.changedFiles.length > 0;
  const businessWorkflowMatches = checklist.workflow ?? !input.changedFiles.some((f) => f.includes("brain/"));

  if (!input.changedFiles.some((f) => input.spec.requiredFiles.some((r) => f.includes(r.split("/").pop() ?? "")))) {
    findings.push("Changed files may not include all required files from UX spec");
  }

  if (input.changedFiles.some((f) => f.includes("backend/"))) {
    blockers.push("UX change should not require backend modifications unless data binding changed");
  }

  const passed =
    blockers.length === 0 &&
    layoutMatches &&
    stylingMatches &&
    designIntentMatches &&
    componentBehaviourMatches;

  return {
    layoutMatches,
    stylingMatches,
    responsiveMatches,
    componentBehaviourMatches,
    visualConsistencyMatches,
    designIntentMatches,
    businessWorkflowMatches,
    findings,
    blockers,
    passed,
  };
}
