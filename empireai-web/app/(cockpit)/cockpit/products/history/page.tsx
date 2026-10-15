import Link from 'next/link';
import {OwnerProducts} from '@/components/owner/OwnerWorkspace';

export default function Page(){
 return <div className="space-y-5"><Link href="/cockpit/products">← Current product portfolio</Link><p>Historical provider reviews · saved evidence, not the current catalogue.</p><OwnerProducts/></div>;
}
