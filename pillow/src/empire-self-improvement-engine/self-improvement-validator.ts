export class ResilienceValidator { validate(validated?: boolean) { return validated === true ? "pass" as const : "partial" as const; } }
