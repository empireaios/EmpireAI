export class CockpitValidator { validate(validated: boolean) { return { decision: validated ? "pass" as const : "partial" as const, structuralSignalOnly: true as const }; } }
