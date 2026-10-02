"use client";

import { useEffect, useState } from "react";

type RuntimeObservation = { verified?: boolean; checkedAt?: string; birth?: string; commerce?: string; transportReady?: boolean };

/** Readiness is several independent facts, never one green business-ready light. */
export function PillowVerificationStatus() {
  const [observation, setObservation] = useState<RuntimeObservation | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function read() {
      try {
        const response = await fetch("/api/owner/runtime", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Runtime evidence unavailable");
        const value = await response.json() as RuntimeObservation;
        if (active) { setObservation(value); setUnavailable(false); setNow(Date.now()); }
      } catch { if (active) { setUnavailable(true); setNow(Date.now()); } }
    }
    void read();
    const timer = setInterval(() => { setNow(Date.now()); void read(); }, 60_000);
    return () => { active = false; controller.abort(); clearInterval(timer); };
  }, []);
  const time = Date.parse(observation?.checkedAt ?? "");
  const fresh = !unavailable && Number.isFinite(time) && now >= time && now - time < 120_000;
  const confirmedLocks = fresh && observation?.verified === true && observation.birth === "NOT_BORN" && observation.commerce === "LOCKED";
  return <div data-testid="pillow-verification-status" className="mt-3 space-y-2 border-t border-gold/15 pt-3 text-xs text-[#b6a987]">
    <p><strong>Runtime evidence:</strong> {confirmedLocks ? "NOT_BORN · Commerce LOCKED" : observation ? "Stale or unavailable — current runtime state UNKNOWN" : "Current runtime state UNKNOWN"}</p>
    <p><strong>Certification:</strong> INCOMPLETE — Pillow is not certified.</p>
    <p><strong>Work assurance:</strong> Continuous independent assurance is not established. Current audit coverage UNKNOWN.</p>
    <p><strong>Provider integration:</strong> INCOMPLETE. Recorded OpenAI and Claude calls succeeded; Gemini success remains unverified. The recorded Gemini attempt returned 503 UNAVAILABLE.</p>
    <p className="text-[11px] text-[#8a847a]">Provider evidence checkpoint: 2 Oct 2026, 05:25 UTC. Historical verification, not a current provider availability check.</p>
    <p className="text-[11px] text-[#8a847a]">{observation?.checkedAt ? `Runtime observed: ${observation.checkedAt}` : "No current authenticated runtime receipt."} Chat availability does not grant Birth, commerce or spending authority.</p>
  </div>;
}
