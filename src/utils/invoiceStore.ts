import * as XLSX from "xlsx";
import { apiGet, apiPost } from "./api";
import { calcLineAmount, calcTotal } from "../types";
import type { InvoiceData, BillDetails, LineItem } from "../types";

export interface InvoiceApiRecord {
  _id: string;
  invoiceNumber: string;
  bill: BillDetails;
  items: LineItem[];
  createdAt: string;
}

/** Creates the invoice on the shared backend. Invoice number is assigned server-side. */
export async function createInvoice(data: InvoiceData): Promise<InvoiceApiRecord> {
  return apiPost<InvoiceApiRecord>("/api/invoices", {
    bill: data.bill,
    items: data.items,
  });
}

/** Fetches every invoice from every device — this is the shared list. */
export async function fetchAllInvoices(): Promise<InvoiceApiRecord[]> {
  return apiGet<InvoiceApiRecord[]>("/api/invoices");
}

export function toInvoiceData(record: InvoiceApiRecord): InvoiceData {
  return {
    bill: { ...record.bill, billNo: record.invoiceNumber },
    items: record.items,
  };
}

function formatDateForSheet(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/**
 * Exports every shared invoice as a downloadable .xlsx workbook with two
 * sheets: "Invoices" (one row per invoice — quick overview) and
 * "Line Items" (one row per service across every invoice — full itemized
 * detail for bookkeeping).
 */
export async function exportRecordsToExcel(): Promise<void> {
  const records = await fetchAllInvoices();
  if (records.length === 0) {
    alert("No invoice records saved yet.");
    return;
  }

  const invoiceRows = records.map((r) => ({
    "Invoice No.": r.invoiceNumber,
    Date: formatDateForSheet(r.bill.date),
    "Bill To": r.bill.billTo,
    Address: r.bill.address,
    "Mobile No.": r.bill.mobileNo,
    "Item Count": r.items.length,
    "Total Amount (Rs.)": calcTotal(r.items).toFixed(0),
    "Saved At": new Date(r.createdAt).toLocaleString("en-IN"),
  }));

  const lineItemRows: Record<string, string | number>[] = [];
  for (const r of records) {
    r.items.forEach((item, idx) => {
      lineItemRows.push({
        "Invoice No.": r.invoiceNumber,
        Date: formatDateForSheet(r.bill.date),
        "Bill To": r.bill.billTo,
        "S.No.": idx + 1,
        Description: item.description,
        Qty: item.qty.trim() || "-",
        "Rate (Rs.)": (parseFloat(item.rate || "0") || 0).toFixed(0),
        "Amount (Rs.)": calcLineAmount(item).toFixed(0),
      });
    });
  }

  const invoiceSheet = XLSX.utils.json_to_sheet(invoiceRows);
  invoiceSheet["!cols"] = [
    { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 30 }, { wch: 14 }, { wch: 11 }, { wch: 16 }, { wch: 20 },
  ];

  const itemsSheet = XLSX.utils.json_to_sheet(lineItemRows);
  itemsSheet["!cols"] = [
    { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 7 }, { wch: 32 }, { wch: 8 }, { wch: 12 }, { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, invoiceSheet, "Invoices");
  XLSX.utils.book_append_sheet(workbook, itemsSheet, "Line Items");

  const filename = `JensiElectricalWorks_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
