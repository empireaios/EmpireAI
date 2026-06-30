import type { PromiseRepository } from "../repositories/promise-repository.js";
import { getPromiseRepository } from "../repositories/sqlite-promise-repository.js";

export const PROMISE_REGISTER_MODULE_ID = "promise-register" as const;

export type PromiseRegisterCapability =
  | "promise-register.read"
  | "promise-register.register"
  | "promise-register.progress"
  | "promise-register.dependencies"
  | "promise-register.lifecycle"
  | "promise-register.fulfill";

export const PROMISE_REGISTER_CAPABILITIES: PromiseRegisterCapability[] = [
  "promise-register.read",
  "promise-register.register",
  "promise-register.progress",
  "promise-register.dependencies",
  "promise-register.lifecycle",
  "promise-register.fulfill",
];

export type PromiseRegisterModuleContract = {
  moduleId: typeof PROMISE_REGISTER_MODULE_ID;
  capabilities: PromiseRegisterCapability[];
  repository: PromiseRepository;
};

export function createPromiseRegisterModuleContract(): PromiseRegisterModuleContract {
  return {
    moduleId: PROMISE_REGISTER_MODULE_ID,
    capabilities: PROMISE_REGISTER_CAPABILITIES,
    repository: getPromiseRepository(),
  };
}
