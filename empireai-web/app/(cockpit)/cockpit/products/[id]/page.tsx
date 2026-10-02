import {OwnerCandidate} from '@/components/owner/OwnerWorkspace';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <OwnerCandidate id={id}/>;}
