'use client';
import Link from 'next/link';
import {useAssurance} from '@/lib/owner/useAssurance';
export function AssuranceAlert(){
 const {data,fresh}=useAssurance();const cp=data?.controlPlane;
 return <section aria-label="Live operational attention" className={'rounded-xl border p-4 '+(!fresh||!!cp?.summary.ownerActionRequired?'border-amber-300/60 bg-amber-300/10':'border-white/15 bg-white/[0.03]')}>
  <h2 className="text-lg font-semibold">Operational attention</h2>
  <p className="mt-2">{!fresh?'Current Assurance status is unverified. Open Assurance for saved evidence and monitoring freshness.':cp!.summary.ownerActionRequired?`${cp!.summary.ownerActionRequired} incident${cp!.summary.ownerActionRequired===1?'':'s'} need your decision. Review the proposed remedy and its consequences.`:`${cp!.summary.activeIncidents} active incidents · ${cp!.summary.automaticallyRecovered} automatic recoveries verified.`}</p>
  <Link className="mt-2 inline-flex min-h-11 items-center font-semibold text-amber-200 underline" href="/cockpit/assurance#owner-actions">{fresh&&cp?.summary.ownerActionRequired?'Review required action':'Open live Assurance'}</Link>
 </section>;
}
