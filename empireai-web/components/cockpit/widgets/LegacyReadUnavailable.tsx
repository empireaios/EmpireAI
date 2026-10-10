import Link from 'next/link';
import {Panel} from '@/components/platform/ui/PlatformPrimitives';
import type {BrainError} from '@/lib/brain/types';
export function LegacyReadUnavailable({title,error,href,onRetry}:{title:string;error:BrainError|null;href:string;onRetry:()=>void}){
 const locked=error?.status===423;
 return <Panel title={title} subtitle={locked?'Unavailable while commerce is locked':'Saved view unavailable'}>
  <p role="status">{locked?'This legacy view uses a dispatch route protected by NOT_BORN and Commerce LOCKED. No operation ran. Current owner evidence remains available through the main navigation.':'The required source did not return usable records. No current business state is inferred.'}</p>
  <Link href={href} className="mt-3 inline-block underline">Return to current owner view</Link>
  <button type="button" className="ml-4 text-sm text-[#d4af37]" disabled={locked} onClick={onRetry}>Retry</button>
  {locked&&<p className="mt-2 text-xs">Retry is disabled because it cannot remove the authority restriction.</p>}
 </Panel>;
}
