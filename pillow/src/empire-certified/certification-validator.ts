export class CertificationValidator {
  validateInput(validated?: boolean) {
    return validated === false
      ? { decision: "fail" as const, errors: ["Certification requires validated=true"] }
      : { decision: "pass" as const, errors: [] as string[] };
  }
}
