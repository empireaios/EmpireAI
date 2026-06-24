import type {
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMProviderName,
} from "../types.js";

export interface LLMProvider {
  readonly name: LLMProviderName;
  complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse>;
  isAvailable(): boolean;
}
