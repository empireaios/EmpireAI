"use client";

import { useCallback, useState } from "react";
import { brainDispatch } from "@/lib/brain/client";
import type { BrainDispatchRequest, BrainDispatchResult, BrainError } from "@/lib/brain/types";

export function useBrainAction<T = unknown>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<BrainError | null>(null);

  const execute = useCallback(
    async (request: BrainDispatchRequest): Promise<BrainDispatchResult<T>> => {
      setLoading(true);
      setError(null);
      try {
        return await brainDispatch<T>(request);
      } catch (err) {
        const brainError = err as BrainError;
        setError(brainError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { execute, loading, error, clearError: () => setError(null) };
}
