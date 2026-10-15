import {GovernedCommerce} from '@/components/owner/GovernedCommerce';
export default async function GovernedCommercePage({searchParams}:{searchParams:Promise<{mission?:string}>}){const {mission}=await searchParams;return <GovernedCommerce initialMission={mission}/>;}
