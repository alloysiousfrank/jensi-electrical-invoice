export interface LineItem {
  id: string;
  description: string;
  /** Blank/"-" means a flat-rate item (amount = rate, no multiplication). */
  qty: string;
  rate: string;
}

export interface BillDetails {
  billTo: string;
  address: string;
  billNo: string;
  date: string;
  mobileNo: string;
  /** Optional — left blank when no advance was paid. */
  advanceAmount: string;
}

export const emptyBillDetails: BillDetails = {
  billTo: "",
  address: "",
  billNo: "",
  date: new Date().toISOString().slice(0, 10),
  mobileNo: "",
  advanceAmount: "",
};

let idCounter = 0;
export function newLineItem(): LineItem {
  idCounter += 1;
  return { id: `item-${Date.now()}-${idCounter}`, description: "", qty: "", rate: "" };
}

export function defaultLineItems(): LineItem[] {
  return [newLineItem()];
}

/** Amount for a single row: qty × rate when a qty is given, otherwise just the rate (flat-rate item). */
export function calcLineAmount(item: LineItem): number {
  const rate = parseFloat(item.rate || "0") || 0;
  const qtyTrimmed = (item.qty || "").trim();
  if (qtyTrimmed === "" || qtyTrimmed === "-" || qtyTrimmed === "–") return rate;
  const qty = parseFloat(qtyTrimmed);
  if (Number.isNaN(qty)) return rate;
  return qty * rate;
}

export function calcTotal(items: LineItem[] | undefined | null): number {
  return (items || []).reduce((sum, item) => sum + calcLineAmount(item), 0);
}

/** Advance paid by the customer up-front, if any. Defaults to 0 when left blank. */
export function calcAdvance(advanceAmount: string | undefined | null): number {
  return parseFloat(advanceAmount || "0") || 0;
}

/**
 * Balance Due = Total - Advance Paid, floored at 0 so an accidental
 * overpayment entry never shows a negative amount owed.
 */
export function calcBalanceDue(total: number, advanceAmount: string | undefined | null): number {
  const balance = total - calcAdvance(advanceAmount);
  return balance > 0 ? balance : 0;
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? " " + ONES[o] : ""}`;
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
}

/** Converts a rupee amount into Indian-numbering words, e.g. 8900 -> "Eight Thousand Nine Hundred". */
export function numberToIndianWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return "Zero";

  const crore = Math.floor(rounded / 10000000);
  const lakh = Math.floor((rounded % 10000000) / 100000);
  const thousand = Math.floor((rounded % 100000) / 1000);
  const hundred = rounded % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));

  return parts.join(" ");
}

export function amountInWords(amount: number): string {
  return `Rupees ${numberToIndianWords(amount)} Only`;
}

export interface InvoiceData {
  bill: BillDetails;
  items: LineItem[];
}
