import {ProductDecisionCentre} from '@/components/owner/work7/ProductDecisionCentre';
export default async function Page({searchParams}:{searchParams:Promise<{mission?:string}>}){const {mission}=await searchParams;return <ProductDecisionCentre initialMission={mission} initialDecisions/>;}
