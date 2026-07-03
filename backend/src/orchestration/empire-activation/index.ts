/**
 * Empire Activation — Version 1 public surface.
 */

export {
  EMPIRE_ACTIVATION_VERSION,
  EMPIRE_V1_PROGRAMME_MISSIONS,
  EMPIRE_ACTIVATION_READINESS_RATINGS,
  EMPIRE_ACTIVATION_CONDITIONS,
  type EmpireV1ProgrammeMission,
  type EmpireActivationReadinessRating,
  type EmpireActivationVerificationArea,
  type EmpireActivationCertification,
  type EmpireActivationVerificationReport,
} from "./contracts/empire-activation-types.js";

export {
  EMPIRE_V1_PRODUCTION_DOMAIN,
  createEmpireV1ActivationCertification,
  assessEmpireV1Activation,
} from "./services/empire-activation-certification-service.js";
