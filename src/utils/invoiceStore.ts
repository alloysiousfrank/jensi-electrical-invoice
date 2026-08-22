import * as XLSX from "xlsx";
import { calcLineAmount, calcTotal } from "../types";
import type { InvoiceData } from "../types";

const STORAGE_KEY = "jew_invoice_records";

export interface InvoiceRecord {
  savedAt: string; // ISO timestamp of when it was generated
  invoiceNumber: string;
  billTo: string;
  address: string;
  date: string;
  mobileNo: string;
  itemCount: number;
  total: string;
  items: { description: string; qty: string; rate: string; amount: string }[];
}

function toRecord(data: InvoiceData): InvoiceRecord {
  const total = calcTotal(data.items);
  return {
    savedAt: new Date().toISOString(),
    invoiceNumber: data.bill.billNo,
    billTo: data.bill.billTo,
    address: data.bill.address,
    date: data.bill.date,
    mobileNo: data.bill.mobileNo,
    itemCount: data.items.length,
    total: total.toFixed(0),
    items: data.items.map((item) => ({
      description: item.description,
      qty: item.qty.trim() || "-",
      rate: (parseFloat(item.rate || "0") || 0).toFixed(0),
      amount: calcLineAmount(item).toFixed(0),
    })),
  };
}

export function getAllRecords(): InvoiceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveInvoiceRecord(data: InvoiceData): void {
  const records = getAllRecords();
  records.push(toRecord(data));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatDateForSheet(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/**
 * Exports every saved invoice as an .xlsx workbook with two sheets:
 * - "Invoices": one row per invoice (quick overview).
 * - "Line Items": one row per item across every invoice (full itemized detail).
 */
export function exportRecordsToExcel(): void {
  const records = getAllRecords();
  if (records.length === 0) {
    alert("No invoices saved yet — generate an invoice first.");
    return;
  }

  const invoiceRows = records.map((r) => ({
    "Invoice No.": r.invoiceNumber,
    Date: formatDateForSheet(r.date),
    "Bill To": r.billTo,
    Address: r.address,
    "Mobile No.": r.mobileNo,
    "Item Count": r.itemCount,
    "Total Amount (Rs.)": r.total,
    "Saved At": new Date(r.savedAt).toLocaleString("en-IN"),
  }));

  const lineItemRows: Record<string, string | number>[] = [];
  for (const r of records) {
    r.items.forEach((item, idx) => {
      lineItemRows.push({
        "Invoice No.": r.invoiceNumber,
        Date: formatDateForSheet(r.date),
        "Bill To": r.billTo,
        "S.No.": idx + 1,
        Description: item.description,
        Qty: item.qty,
        "Rate (Rs.)": item.rate,
        "Amount (Rs.)": item.amount,
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
