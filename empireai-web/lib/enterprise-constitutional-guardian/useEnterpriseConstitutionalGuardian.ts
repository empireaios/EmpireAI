"use client";

import { useCallback, useEffect, useState } from "react";
import type { EnterpriseConstitutionalGuardian } from "@/lib/enterprise-constitutional-guardian/types";

const REFRESH_MS = 5000;

type EnterpriseConstitutionalGuardianPayload = {
  computedAt: string;
  live?: boolean;
  enterpriseConstitutionalGuardian: EnterpriseConstitutionalGuardian;
};

export function useEnterpriseConstitutionalGuardian() {
  const [data, setData] = useState<EnterpriseConstitutionalGuardianPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/pillow/enterprise-constitutional-guardian", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Enterprise Constitutional Guardian unavailable (${res.status})`);
      }
      setData((await res.json()) as EnterpriseConstitutionalGuardianPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Enterprise Constitutional Guardian");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const id = setInterval(() => void reload(), REFRESH_MS);
    return () => clearInterval(id);
  }, [reload]);

  const view = data?.enterpriseConstitutionalGuardian ?? null;
  const live = data?.live !== false;

  return { data, view, loading, error, reload, live };
}
