"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveReviewBoard } from "@/lib/executive-review-board/types";

const REFRESH_MS = 5000;

type ExecutiveReviewBoardPayload = {
  computedAt: string;
  live?: boolean;
  executiveReviewBoard: ExecutiveReviewBoard;
};

export function useExecutiveReviewBoard() {
  const [data, setData] = useState<ExecutiveReviewBoardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/pillow/executive-review-board", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Executive Review Board unavailable (${res.status})`);
      }
      setData((await res.json()) as ExecutiveReviewBoardPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Review Board");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const id = setInterval(() => void reload(), REFRESH_MS);
    return () => clearInterval(id);
  }, [reload]);

  const view = data?.executiveReviewBoard ?? null;
  const live = data?.live !== false;

  return { data, view, loading, error, reload, live };
}
