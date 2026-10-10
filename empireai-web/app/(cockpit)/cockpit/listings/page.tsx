import {ListingCatalogue} from '@/components/owner/work7/ListingCatalogue';
export default async function Page({searchParams}:{searchParams:Promise<{mission?:string}>}){const {mission}=await searchParams;return <ListingCatalogue initialMission={mission}/>;}
