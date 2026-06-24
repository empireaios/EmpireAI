export type { BuyerSignal } from "./contracts/buyer-signal.js";
export {
  buyerSignalSchema,
  validateBuyerSignal,
  buyerSignalFromProductSignal,
} from "./contracts/buyer-signal.js";

export type {
  BuyerPersonaProfile,
  BuyerPersonaSpendingPower,
  BuyerPersonaUrgencyLevel,
} from "./contracts/buyer-persona-profile.js";
export {
  BUYER_PERSONA_SPENDING_POWERS,
  BUYER_PERSONA_URGENCY_LEVELS,
  buyerPersonaProfileSchema,
  validateBuyerPersonaProfile,
} from "./contracts/buyer-persona-profile.js";

export type { BuyerIntentContract } from "./contracts/buyer-intent-contract.js";
export {
  buyerIntentContractSchema,
  validateBuyerIntentContract,
} from "./contracts/buyer-intent-contract.js";

export {
  BuyerPersonaMapper,
  defaultBuyerPersonaMapper,
} from "./mappers/buyer-persona-mapper.js";
