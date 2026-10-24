"use client";
import {usePathname} from 'next/navigation';
import {OwnerShell} from '@/components/owner/OwnerShell';
import {CockpitInteractionProvider} from '@/lib/cockpit/interaction/CockpitInteractionProvider';
import {CockpitInteractionDrawer} from '@/components/cockpit/interaction/CockpitInteractionDrawer';
import {GlobalAiAssistantProvider} from '@/lib/cockpit/global-assistant/GlobalAiAssistantProvider';
import {GlobalAiAssistantPanel} from '@/components/cockpit/global-assistant/GlobalAiAssistantPanel';
import {CockpitRealtimeBridge} from '@/components/cockpit/ux/CockpitRealtimeBridge';
import {FounderShellProvider} from '@/lib/founder-shell/FounderShellProvider';
const native=['/cockpit','/cockpit/ceo','/cockpit/products','/cockpit/listings','/cockpit/orders','/cockpit/finance','/cockpit/cost-centre','/cockpit/eyes','/cockpit/assurance','/cockpit/approvals','/cockpit/calendar','/cockpit/system','/cockpit/advisor','/cockpit/commerce/governed','/cockpit/commerce/transactions'];
export function CockpitShell({children}:{children:React.ReactNode}){
 const path=usePathname();const owner=native.some(p=>path===p||(p!=='/cockpit'&&path.startsWith(p+'/')));
 return <CockpitInteractionProvider><FounderShellProvider><GlobalAiAssistantProvider><OwnerShell>{owner ? children : <div data-legacy-workspace>{children}</div>}</OwnerShell>{!owner && <><CockpitInteractionDrawer/><CockpitRealtimeBridge/><GlobalAiAssistantPanel/></>}</GlobalAiAssistantProvider></FounderShellProvider></CockpitInteractionProvider>;
}
