import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TransactionMatchingEngine} from '../../reconciliation-engine/transaction-matching-engine.js';
import {ReconciliationMetadataGenerator} from '../../reconciliation-engine/reconciliation-metadata-generator.js';
import {buildReconciliationEngineConfiguration} from '../../reconciliation-engine/configuration.js';
import type {PaymentRecord} from '../../payment-gateway-integration/types.js';
import type {RevenueRecord} from '../../revenue-engine/types.js';
import type {BankingTransactionRecord} from '../../banking-integration/types.js';
import type {ExpenseRecord} from '../../expense-engine/types.js';
import type {CashFlowRecord} from '../../cash-flow-monitor/types.js';
const engine=new TransactionMatchingEngine(),config=buildReconciliationEngineConfiguration(undefined,{defaultCurrency:'USD'});
const payment={paymentId:'pay-1',paymentAmount:20,currency:'USD',paymentStatus:'captured',validationStatus:'passed'} as PaymentRecord;
const revenue={revenueRecordId:'rev-1',paymentReference:'pay-1',netRevenue:20,currency:'USD',validationStatus:'passed'} as RevenueRecord;
const bank={transactionId:'bank-txn-1',bankingRecordId:'account-1',amount:20,currency:'USD',transactionType:'credit'} as BankingTransactionRecord;
test('equal amounts or account references cannot prove bank transaction identity',()=>{
 for(const payments of [[payment],[]])assert.equal(engine.matchBankingTransactions([bank],payments,[{...revenue,bankingReference:'account-1'}],config).matched,0);
 const linked={...payment,bankTransactionReference:bank.transactionId};
 assert.equal(engine.matchBankingTransactions([bank],[linked],[],config).matched,1);
 for(const transactions of [[bank,bank],[{...bank,transactionType:'debit' as const}],[{...bank,transactionId:'other'}]])assert.equal(engine.matchBankingTransactions(transactions,[linked],[],config).matched,0);
 assert.equal(engine.matchBankingTransactions([bank],[linked,linked],[],config).matched,0);
 assert.equal(engine.matchBankingTransactions([bank],[{...linked,paymentStatus:'authorized'}],[],config).matched,0);
 assert.equal(engine.matchBankingTransactions([bank],[linked],[],config,'account').matched,0);
});
test('currency, exact minor units and unique references are mandatory; tolerance cannot hide variance',()=>{
 assert.equal(engine.matchPaymentsToRevenue([payment],[revenue],config).matched,1);
 assert.equal(engine.matchPaymentsToRevenue([payment],[revenue,revenue],config).matched,0);
 assert.equal(engine.matchPaymentsToRevenue([payment,payment],[revenue],config).matched,0);
 assert.equal(engine.matchRevenueRecords([revenue,revenue],[payment],config).matched,0);
 assert.equal(engine.matchRevenueRecords([revenue],[{...payment,paymentStatus:'authorized'}],config).matched,0);
 const different=engine.matchPaymentsToRevenue([payment],[{...revenue,netRevenue:19.99}],{...config,amountTolerance:100});
 assert.equal(different.matched,0);assert.equal(different.differenceAmount,0.01);
 for(const patch of [{currency:'SGD'},{netRevenue:NaN},{netRevenue:Infinity},{netRevenue:20.001},{netRevenue:Number.MAX_VALUE}])assert.throws(()=>engine.matchPaymentsToRevenue([payment],[{...revenue,...patch}],config));
 const converted={...config,defaultCurrency:'JPY'};
 assert.equal(engine.matchPaymentsToRevenue([{...payment,currency:'JPY'}],[{...revenue,currency:'JPY'}],converted).matched,1);
 assert.throws(()=>engine.matchPaymentsToRevenue([{...payment,currency:'JPY',paymentAmount:20.5}],[{...revenue,currency:'JPY'}],converted));
});
test('empty sources and empty reports remain pending, never financially matched',()=>{
 const metadata=new ReconciliationMetadataGenerator();
 const empty=engine.matchPaymentsToRevenue([],[],config);
 const record=metadata.buildReconciliationRecord(empty,'matched');assert.equal(record.reconciliationStatus,'pending');
 assert.equal(metadata.buildReport({scope:'empty',records:[]}).reconciliationStatus,'pending');
 assert.equal(metadata.buildReport({scope:'empty',records:[record]}).reconciliationStatus,'pending');
 const cash={cashFlowRecordId:'cash',netCashFlow:0} as CashFlowRecord;
 assert.equal(engine.matchCashFlowRecords([cash],[],[],config).matched,0);
 assert.throws(()=>engine.matchCashFlowRecords([cash],[{...revenue,currency:'SGD'}],[],config));
});

test('customer receipts cannot reconcile supplier expenses without outbound evidence',()=>{
 const expense={expenseRecordId:'expense',paymentReference:'pay-1',expenseAmount:20,currency:'USD',validationStatus:'passed'} as ExpenseRecord;
 assert.equal(engine.matchExpenseRecords([expense],[payment],config).matched,0);
 assert.equal(engine.matchExpenseRecords([expense],[{...payment,direction:'outbound'}],config).matched,1);
 assert.equal(engine.matchExpenseRecords([expense,expense],[{...payment,direction:'outbound'}],config).matched,0);
 assert.equal(engine.matchRevenueRecords([revenue],[{...payment,direction:'outbound'}],config).matched,0);
});
