import type {
  OrchestratorDispatchRequest,
  OrchestratorDispatchResult,
} from "../brain/types.js";

export type BrainClientConfig = {
  baseUrl: string;
};

export class BrainClient {
  constructor(private readonly config: BrainClientConfig) {}

  async dispatch(
    request: OrchestratorDispatchRequest,
  ): Promise<OrchestratorDispatchResult> {
    const response = await fetch(`${this.config.baseUrl}/brain/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Brain dispatch failed: ${error}`);
    }

    return response.json() as Promise<OrchestratorDispatchResult>;
  }

  async health() {
    const response = await fetch(`${this.config.baseUrl}/health`);
    return response.json();
  }
}
