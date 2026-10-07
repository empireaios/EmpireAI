import {OwnerAdvisor} from '@/components/owner/OwnerAdvisor';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const query=await searchParams;const initialQuery=Object.fromEntries(Object.entries(query).filter((entry):entry is [string,string]=>typeof entry[1]==='string'));return <OwnerAdvisor initialQuery={initialQuery}/>;}
