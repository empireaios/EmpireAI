export class ExecutiveRecommendationEngine { recommend(summary: string) { return { summary, structuralSignalOnly: true as const, authorizationRequired: true as const }; } }
