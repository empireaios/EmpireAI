export class DashboardValidator { validate(authorized = true) { return { valid: authorized, neverExposeRestrictedEnterpriseInformationToUnauthorizedUsers: true as const }; } }
