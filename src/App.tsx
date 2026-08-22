import { useState } from "react";
import BillDetailsSection from "./components/BillDetailsSection";
import LineItemsSection from "./components/LineItemsSection";
import InvoicePreview from "./components/InvoicePreview";
import { emptyBillDetails, defaultLineItems } from "./types";
import type { BillDetails, LineItem } from "./types";
import { BUSINESS_NAME } from "./config/businessConfig";
import { downloadInvoicePdf } from "./utils/generateInvoicePdf";
import { generateInvoiceNumber, peekNextInvoiceNumber } from "./utils/invoiceNumber";
import { saveInvoiceRecord, exportRecordsToExcel, getAllRecords } from "./utils/invoiceStore";

export default function App() {
  const [bill, setBill] = useState<BillDetails>(() => ({ ...emptyBillDetails, billNo: peekNextInvoiceNumber() }));
  const [items, setItems] = useState<LineItem[]>(defaultLineItems);
  const [generating, setGenerating] = useState(false);
  const [recordCount, setRecordCount] = useState(() => getAllRecords().length);

  const canGenerate = bill.billTo.trim() !== "" && items.some((it) => it.description.trim() !== "");

  const handleGenerate = async () => {
    if (!canGenerate || generating) return;
    setGenerating(true);
    try {
      const invoiceNumber = generateInvoiceNumber();
      const finalBill: BillDetails = { ...bill, billNo: invoiceNumber };
      const data = { bill: finalBill, items };

      saveInvoiceRecord(data);
      setRecordCount(getAllRecords().length);
      await downloadInvoicePdf(data);

      // Reset the form for the next customer, with the next invoice number
      // already queued up and ready to go.
      setBill({ ...emptyBillDetails, billNo: peekNextInvoiceNumber() });
      setItems(defaultLineItems());
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>{BUSINESS_NAME}</h1>
        <p>Service &amp; Installation Bill Generator</p>
      </header>

      <main className="app-main">
        <div className="form-column">
          <BillDetailsSection bill={bill} onChange={setBill} />
          <LineItemsSection items={items} onChange={setItems} />

          <button type="button" className="btn btn-generate" disabled={!canGenerate || generating} onClick={handleGenerate}>
            {generating ? "Generating…" : "Generate Invoice"}
          </button>
          {!canGenerate && (
            <p className="hint center">Enter who the bill is for and at least one service to generate.</p>
          )}

          <section className="card records-card">
            <h2>Invoice Records</h2>
            <p className="hint">
              {recordCount === 0
                ? "No invoices saved on this device yet."
                : `${recordCount} invoice${recordCount === 1 ? "" : "s"} saved on this device.`}
            </p>
            <button type="button" className="btn btn-export" onClick={exportRecordsToExcel}>
              Export All to Excel
            </button>
            <p className="hint">
              Records are stored in this browser only — export includes an invoice summary sheet plus a
              fully itemized line-items sheet.
            </p>
          </section>
        </div>
        <div className="preview-column">
          <InvoicePreview data={{ bill, items }} />
        </div>
      </main>

      <footer className="app-footer">
        <p>Jensi Electrical Works — Electrical, Plumbing and Company AMC</p>
      </footer>
    </div>
  );
}

