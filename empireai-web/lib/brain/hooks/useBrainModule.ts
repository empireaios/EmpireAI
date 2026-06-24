"use client";

import { useCallback, useEffect, useState } from "react";
import type { ModuleId } from "@/lib/platform/types";
import { brainDispatch } from "@/lib/brain/client";
import type { BrainError } from "@/lib/brain/types";

export function useBrainModule<T>(
  module: ModuleId,
  action = "load",
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<BrainError | null>(null);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await brainDispatch<T>({ module, action });
        if (!cancelled) {
          setData(response.result ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as BrainError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [module, action, enabled, attempt]);

  return { data, loading, error, reload };
}
