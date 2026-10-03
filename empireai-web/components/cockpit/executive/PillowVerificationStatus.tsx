"use client";

import { useEffect, useState } from "react";

type RuntimeObservation = { verified?: boolean; checkedAt?: string; birth?: string; commerce?: string; transportReady?: boolean };
type AssuranceObservation = {status?:string; coverage?:{passed?:number;required?:number}; pillowCertification?:{
  historical?:{status?:string;observedAt?:string;satisfied?:number;required?:number;sha256?:string;representativeBattery?:{score?:number;maximum?:number;multiTurnScore?:number;multiTurnMaximum?:number}};
  currentOperability?:{status?:string;requiredGate?:string};
}};

/** Readiness is several independent facts, never one green business-ready light. */
export function PillowVerificationStatus() {
  const [observation, setObservation] = useState<RuntimeObservation | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [assurance, setAssurance] = useState<AssuranceObservation | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function read() {
      try {
        const [response, evidence] = await Promise.all([
          fetch("/api/owner/runtime", { cache: "no-store", signal: controller.signal }),
          fetch("/api/owner/assurance", { cache: "no-store", signal: controller.signal }),
        ]);
        if (active) setAssurance(evidence.ok ? await evidence.json() as AssuranceObservation : null);
        if (!response.ok) throw new Error("Runtime evidence unavailable");
        const value = await response.json() as RuntimeObservation;
        if (active) { setObservation(value); setUnavailable(false); setNow(Date.now()); }
      } catch { if (active) { setUnavailable(true); setAssurance(null); setNow(Date.now()); } }
    }
    void read();
    const timer = setInterval(() => { setNow(Date.now()); void read(); }, 60_000);
    return () => { active = false; controller.abort(); clearInterval(timer); };
  }, []);
  const time = Date.parse(observation?.checkedAt ?? "");
  const fresh = !unavailable && Number.isFinite(time) && now >= time && now - time < 120_000;
  const confirmedLocks = fresh && observation?.verified === true && observation.birth === "NOT_BORN" && observation.commerce === "LOCKED";
  const certification = assurance?.pillowCertification;
  const historical = certification?.historical;
  const battery = historical?.representativeBattery;
  return <div data-testid="pillow-verification-status" className="mt-3 space-y-2 border-t border-gold/15 pt-3 text-xs text-[#b6a987]">
    <p><strong>Runtime evidence:</strong> {confirmedLocks ? "NOT_BORN · Commerce LOCKED" : observation ? "Stale or unavailable — current runtime state UNKNOWN" : "Current runtime state UNKNOWN"}</p>
    <p><strong>Historical bounded reasoning:</strong> {historical?.status === 'SATISFIED'
      ? `Satisfied — ${historical.satisfied}/${historical.required} domains; representative battery ${battery?.score}/${battery?.maximum}; fresh multi-turn sequence ${battery?.multiTurnScore}/${battery?.multiTurnMaximum}.`
      : 'Evidence unavailable or incomplete — UNKNOWN.'}</p>
    {historical?.observedAt ? <p className="text-[11px]">Historical evidence recorded: {historical.observedAt}. This does not certify current production usability or commerce readiness.</p> : null}
    <p><strong>Current production operability:</strong> {certification?.currentOperability?.status === 'FAILED_OWNER_ACCEPTANCE'
      ? 'FAILED OWNER ACCEPTANCE — regression reopened. King must personally verify a fresh completed answer and normal conversation after repair.'
      : 'UNKNOWN — owner acceptance is not established.'}</p>
    <p><strong>Independent Assurance:</strong> {assurance?.status ?? 'UNKNOWN'}. <a href="/cockpit/assurance" className="underline">View live coverage and retained findings</a>.</p>
    <p><strong>Provider integration:</strong> INCOMPLETE. Recorded OpenAI and Claude calls succeeded; Gemini success remains unverified. The recorded Gemini attempt returned 503 UNAVAILABLE.</p>
    <p className="text-[11px] text-[#8a847a]">Provider evidence checkpoint: 2 Oct 2026, 05:25 UTC. Historical verification, not a current provider availability check.</p>
    <p className="text-[11px] text-[#8a847a]">{observation?.checkedAt ? `Runtime observed: ${observation.checkedAt}` : "No current authenticated runtime receipt."} Chat availability does not grant Birth, commerce or spending authority.</p>
  </div>;
}
