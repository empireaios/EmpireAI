export class KnowledgeValidator {
  validate(validated: boolean, distributing: boolean) { return distributing && !validated ? { decision: "fail" as const, errors: ["Never distribute unvalidated enterprise knowledge"] } : { decision: validated ? "pass" as const : "partial" as const, errors: [] }; }
}
