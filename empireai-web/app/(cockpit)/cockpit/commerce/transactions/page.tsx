"use client";

import Link from "next/link";
import { providerObservationHistory } from "@/lib/commerce-transactions/provider-observation-history";
import { useEffect, useState } from "react";

type Transaction = {
  transactionKey:string;amazonOrderId:string;orderItemId:string;sku:string;asin:string;
  cjPid:string;cjVid:string;quantity:number;orderSourceSha256:string;decisionSha256:string;
  expected:{sellingPriceUsd:number|null;profitUsd:number|null};
  marketplaceEvidence:{sellerOfferPriceCents:number;sellerFulfilledQuantity:number;observedAt:string;
    listingSourceSha256:string;inventorySourceSha256:string}|null;
  simulated:{supplierOrderId:string|null;receiptCount:number;reconciliation:string;
    cancellation?:{outcome:string}|null;
    supplierReturn?:{rmaId:string;quantity:number;receivedReceiptId:string|null}|null;
    supplierCredits?:{issuedCents:number;cashReceivedCents:number;outstandingCents:number};
    tracking:{deliveryStatus:string;carrier:string;trackingNumber:string}|null;
    economics:{actual:{customerRevenueUsd:number|null;amazonFeesUsd:number|null;cjProductCostUsd:number|null;
      cjShippingUsd:number|null;otherDirectCostsUsd:number|null;realisedContributionUsd:number|null};
      marketplacePayoutReceived:string;orderRevenueRecognized:string};
    journal:Array<{receiptId:string;account:string;debitCents:number;creditCents:number}>};
};
function money(value:number|null|undefined) {
  return typeof value==="number" && Number.isFinite(value) ? "US$"+value.toFixed(2) : "Unknown";
}
export default function CommerceTransactionsPage() {
  const [transactions,setTransactions] = useState<Transaction[]|null>(null);
  const [error,setError] = useState<string|null>(null);
  const [loading,setLoading] = useState(true);
  const [refresh,setRefresh] = useState(0);
  useEffect(()=>{
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(),12_000);
    void (async()=>{
      try {
        const response = await fetch("/api/commerce/transactions?limit=20",{
          credentials:"include",cache:"no-store",signal:controller.signal,
        });
        if (!response.ok) throw new Error(response.status===401 ? "Sign in to view transactions." :
          response.status===403 ? "Owner access is required." : "Transaction service unavailable (HTTP "+response.status+").");
        const payload = await response.json();
        if (payload?.evidenceMode!=="OFFLINE_FIXTURE" || payload.realCommerceVerified!==false ||
            !Array.isArray(payload.transactions) || payload.transactions.length>20 ||
            payload.transactions.some((row:Transaction)=>!row?.transactionKey || !row.expected ||
              !row.simulated?.economics?.actual || !Array.isArray(row.simulated.journal))) {
          throw new Error("Transaction evidence could not be verified.");
        }
        if (active) setTransactions(payload.transactions);
      } catch (cause) {
        if (active) setError(controller.signal.aborted ? "Request timed out. Refresh to try again." :
          cause instanceof Error ? cause.message : "Transaction service unavailable.");
      } finally {
        clearTimeout(timer);
        if (active) setLoading(false);
      }
    })();
    return ()=>{active=false;clearTimeout(timer);controller.abort();};
  },[refresh]);
  return <section aria-label="Historical transaction evidence" className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><Link href="/cockpit/orders" className="text-sm text-blue-800 underline">Back to Orders &amp; Fulfilment</Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Transaction lifecycle</h1></div>
      <button type="button" disabled={loading} onClick={()=>{setLoading(true);setError(null);setTransactions(null);setRefresh(n=>n+1);}}
        className="min-h-11 rounded-lg border border-amber-300/40 px-4 py-2 text-amber-900 disabled:opacity-50">
        {loading ? "Loading…" : "Refresh"}
      </button>
    </header>
    <section className="rounded-xl border border-amber-400/40 bg-amber-50 p-4 text-sm text-amber-900">
      <strong>Nonproduction evidence</strong>
      <p className="mt-1">These transactions exercise the connected commerce flow. Receipt amounts below are simulated and do not establish real sales, payments or profit.</p>
    </section>
    <div aria-live="polite">
      {loading && <p className="text-slate-700">Reading saved transaction evidence…</p>}
      {error && <p role="alert" className="rounded-lg border border-red-400/40 p-4 text-red-800">{error}</p>}
      {transactions?.length===0 && <p className="rounded-lg border border-blue-200 p-4 text-slate-700">No saved transactions in this workspace.</p>}
    </div>
    {transactions !== null && <section aria-label="Historical provider observations" className="space-y-3 rounded-xl border border-sky-400/30 p-4">
      <h2 className="text-lg font-semibold text-slate-900">Historical provider observations</h2>
      <p className="text-sm text-slate-700">These dated authenticated reads are separate from the simulated orders below. They are not current stock, qualified products, order receipts or realised profit. Refresh reloads this page; it does not call either provider.</p>
      {providerObservationHistory.map(observation=><article key={observation.provider + observation.observedAt} className="min-w-0 rounded-lg border border-blue-200 p-3 text-sm">
        <h3 className="font-medium text-blue-800">{observation.provider} · Observed, not qualified</h3>
        <time className="text-xs text-slate-600" dateTime={observation.observedAt}>{observation.observedAt}</time>
        <p className="mt-2 break-all text-slate-900">{observation.identity}</p>
        <p className="text-slate-700">{observation.detail}</p>
        <p className="text-amber-900">{observation.limit} Account ownership is not independently verified. Not linked to a transaction.</p>
        <details className="mt-2 text-xs text-slate-600"><summary className="min-h-8 cursor-pointer">Provider observation source</summary>
          <p className="break-all">Receipt: {observation.receiptPath}</p>
          <p className="break-all">Source: {observation.sourceHead}</p>
          <p className="break-all">Response SHA256: {observation.responseHash}</p>
          <a className="underline text-blue-800" href={"https://github.com/empireaios/EmpireAI/actions/runs/"+observation.runId} target="_blank" rel="noreferrer">View verification run</a>
        </details>
      </article>)}
    </section>}
    {transactions?.map(transaction=>{
      const lifecycle = transaction.simulated, actual = lifecycle.economics.actual;
      return <article key={transaction.transactionKey} className="min-w-0 space-y-4 rounded-xl border border-blue-200 bg-white p-4">
        <header><h2 className="break-all text-lg font-semibold text-slate-900">Order {transaction.amazonOrderId}</h2>
          <p className="break-all text-sm text-slate-700">{transaction.sku} · {transaction.asin} · Quantity {transaction.quantity}</p>
          <p className="mt-1 text-xs text-amber-900">Simulated · {lifecycle.receiptCount} receipts · {lifecycle.reconciliation.replaceAll("_"," ")}</p>
        </header>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-slate-600">CJ product / variant</dt><dd className="break-all text-slate-900">{transaction.cjPid} / {transaction.cjVid}</dd></div>
          <div><dt className="text-slate-600">Supplier order</dt><dd className="break-all text-slate-900">{lifecycle.supplierOrderId ?? "Awaiting acknowledgement"}</dd></div>
          <div><dt className="text-slate-600">Delivery</dt><dd className="text-slate-900">{lifecycle.tracking?.deliveryStatus ?? "Unknown"}</dd></div>
          <div><dt className="text-slate-600">Tracking</dt><dd className="break-all text-slate-900">{lifecycle.tracking ? lifecycle.tracking.carrier+" · "+lifecycle.tracking.trackingNumber : "Not received"}</dd></div>
          <div><dt className="text-slate-600">Seller listing price</dt><dd className="text-slate-900">{money(transaction.marketplaceEvidence ? transaction.marketplaceEvidence.sellerOfferPriceCents/100 : null)}</dd></div>
          <div><dt className="text-slate-600">Seller availability</dt><dd className="text-slate-900">{transaction.marketplaceEvidence?.sellerFulfilledQuantity ?? "Unknown"} · supplier stock separate</dd></div>
        </dl>
        <section className="rounded-lg border border-blue-200 p-3 text-sm text-slate-700">
          <h3 className="font-medium text-slate-900">Supplier reversals · simulated</h3>
          <p>Cancellation: {lifecycle.cancellation?.outcome ?? "Not requested"}</p>
          <p>Return: {lifecycle.supplierReturn ? lifecycle.supplierReturn.rmaId+" · "+lifecycle.supplierReturn.quantity+" units · "+
            (lifecycle.supplierReturn.receivedReceiptId ? "Received by supplier" : "Awaiting supplier receipt") : "Not authorized"}</p>
          <p>Credit issued: {money(lifecycle.supplierCredits ? lifecycle.supplierCredits.issuedCents/100 : null)}</p>
          <p>Cash refund received: {money(lifecycle.supplierCredits ? lifecycle.supplierCredits.cashReceivedCents/100 : null)}</p>
          <p>Outstanding supplier credit: {money(lifecycle.supplierCredits ? lifecycle.supplierCredits.outstandingCents/100 : null)}</p>
        </section>
        <div className="grid gap-3 sm:grid-cols-2">
          <section className="rounded-lg bg-blue-50 p-3"><h3 className="font-medium text-slate-900">Projected economics</h3>
            <p className="mt-1 text-sm text-slate-700">Revenue {money(transaction.expected.sellingPriceUsd)}</p>
            <p className="text-sm text-slate-700">Contribution {money(transaction.expected.profitUsd)}</p></section>
          <section className="rounded-lg bg-blue-50 p-3"><h3 className="font-medium text-amber-900">Simulated reconciled economics</h3>
            <dl className="mt-1 space-y-1 text-sm text-slate-700">
              {([["Revenue after refunds",actual.customerRevenueUsd],["Amazon fees after credits",actual.amazonFeesUsd],
                ["Supplier",actual.cjProductCostUsd],["Freight",actual.cjShippingUsd],["Other costs",actual.otherDirectCostsUsd],
                ["Contribution",actual.realisedContributionUsd]] as const).map(([label,value])=>
                <div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd>{money(value)}</dd></div>)}
            </dl>
            <p className="mt-2 text-xs text-slate-600">Fixture payout: {lifecycle.economics.marketplacePayoutReceived}</p>
          </section>
        </div>
        <details className="text-sm text-slate-700"><summary className="cursor-pointer py-2 text-amber-900">Accounting and source evidence</summary>
          <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Account</th><th className="p-2">Debit USD</th><th className="p-2">Credit USD</th></tr></thead>
            <tbody>{lifecycle.journal.map((row,index)=><tr key={row.receiptId+"-"+index}><td className="p-2">{row.account}</td><td className="p-2">{money(row.debitCents/100)}</td><td className="p-2">{money(row.creditCents/100)}</td></tr>)}</tbody>
          </table></div>
          <dl className="mt-3 space-y-2 break-all text-xs"><div><dt>Order source</dt><dd>{transaction.orderSourceSha256}</dd></div>
            <div><dt>Pillow decision</dt><dd>{transaction.decisionSha256}</dd></div>
            <div><dt>Listing source</dt><dd>{transaction.marketplaceEvidence?.listingSourceSha256 ?? "Unknown"}</dd></div>
            <div><dt>Inventory source</dt><dd>{transaction.marketplaceEvidence?.inventorySourceSha256 ?? "Unknown"}</dd></div></dl>
        </details>
      </article>;
    })}
  </section>;
}
