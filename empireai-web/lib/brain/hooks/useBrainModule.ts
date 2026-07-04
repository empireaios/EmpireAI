"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ModuleId } from "@/lib/platform/types";
import { brainDispatch } from "@/lib/brain/client";
import type { BrainError } from "@/lib/brain/types";

export function useBrainModule<T>(
  module: ModuleId,
  action = "load",
  options?: {
    enabled?: boolean;
    payload?: Record<string, unknown>;
    companyId?: string;
  },
) {
  const enabled = options?.enabled ?? true;
  const payload = options?.payload;
  const companyId = options?.companyId;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<BrainError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const dataRef = useRef<T | null>(null);
  dataRef.current = data;

  const reload = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function load() {
      const hasCachedData = dataRef.current !== null;
      if (!hasCachedData) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await brainDispatch<T>({
          module,
          action,
          companyId,
          payload,
        });
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
  }, [module, action, enabled, attempt, companyId, JSON.stringify(payload ?? null)]);

  return { data, loading: enabled && loading && data === null, error, reload, refreshing: enabled && loading && data !== null };
}
