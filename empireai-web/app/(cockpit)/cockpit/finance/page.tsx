import {FinanceView} from '@/components/owner/work7/BusinessViews';
export default async function FinancePage({searchParams}:{searchParams:Promise<{order?:string}>}){const {order}=await searchParams;return <FinanceView initialOrder={order}/>;}
