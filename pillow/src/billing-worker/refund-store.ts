import type { CreditNote, RefundRecord } from "./types.js";
export class RefundStore { private readonly refunds:RefundRecord[]=[]; private readonly notes:CreditNote[]=[]; addRefund(value:RefundRecord){this.refunds.push(value);return value;} addCreditNote(value:CreditNote){this.notes.push(value);return value;} listRefunds(){return [...this.refunds];} listCreditNotes(){return [...this.notes];} }
