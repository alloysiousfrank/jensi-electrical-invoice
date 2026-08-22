const COUNTER_KEY = "jew_invoice_counter";

function format(n: number): string {
  return `JEW-${String(n).padStart(4, "0")}`;
}

/** Returns what the next invoice number will be, without consuming it. Safe to call for display/preview. */
export function peekNextInvoiceNumber(): string {
  const current = parseInt(localStorage.getItem(COUNTER_KEY) || "0", 10);
  return format(current + 1);
}

/** Consumes the next invoice number (e.g. "JEW-0001") and persists the counter so it only increases. */
export function generateInvoiceNumber(): string {
  const current = parseInt(localStorage.getItem(COUNTER_KEY) || "0", 10);
  const next = current + 1;
  localStorage.setItem(COUNTER_KEY, String(next));
  return format(next);
}
