import {Listings} from '@/components/owner/work7/OwnerJourneys';
export default async function Page({searchParams}:{searchParams:Promise<{mission?:string}>}){const {mission}=await searchParams;return <Listings initialMission={mission}/>;}
