import { useCallback, useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import PasswordGate from "./components/PasswordGate";
import BillDetailsSection from "./components/BillDetailsSection";
import LineItemsSection from "./components/LineItemsSection";
import InvoicePreview from "./components/InvoicePreview";
import InvoiceRecordsList from "./components/InvoiceRecordsList";
import { emptyBillDetails, defaultLineItems } from "./types";
import type { BillDetails, LineItem } from "./types";
import { BUSINESS_NAME } from "./config/businessConfig";
import { downloadInvoicePdf } from "./utils/generateInvoicePdf";
import { createInvoice, fetchAllInvoices, exportRecordsToExcel, toInvoiceData } from "./utils/invoiceStore";
import type { InvoiceApiRecord } from "./utils/invoiceStore";

function InvoiceApp() {
  const [bill, setBill] = useState<BillDetails>(emptyBillDetails);
  const [items, setItems] = useState<LineItem[]>(defaultLineItems);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [records, setRecords] = useState<InvoiceApiRecord[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const data = await fetchAllInvoices();
      setRecords(data);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load invoices.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const canGenerate = bill.billTo.trim() !== "" && items.some((it) => it.description.trim() !== "") && !generating;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const record = await createInvoice({ bill, items });
      const data = toInvoiceData(record);
      setRecords((prev) => [record, ...prev]);
      await downloadInvoicePdf(data);

      // Reset the form for the next customer.
      setBill(emptyBillDetails);
      setItems(defaultLineItems());
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Failed to generate invoice.");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportRecordsToExcel();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export invoices.");
    } finally {
      setExporting(false);
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
          <LineItemsSection items={items} onChange={setItems} advanceAmount={bill.advanceAmount} />

          <button type="button" className="btn btn-generate" disabled={!canGenerate} onClick={handleGenerate}>
            {generating ? "Generating…" : "Generate Invoice"}
          </button>
          {!canGenerate && !generating && (
            <p className="hint center">Enter who the bill is for and at least one service to generate.</p>
          )}
          {generateError && <p className="gate-error center">{generateError}</p>}

          <InvoiceRecordsList records={records} loading={listLoading} error={listError} />

          <section className="card records-card">
            <button type="button" className="btn btn-export" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting…" : "Export All to Excel"}
            </button>
            <p className="hint">
              Every generated invoice is saved to the shared record book — visible from any device
              — and can be exported as an .xlsx file any time.
            </p>
          </section>
        </div>
        <div className="preview-column">
          <InvoicePreview data={{ bill, items }} />
        </div>
      </main>

      <footer className="app-footer">
        <p>Invoices are stored securely on the shared server. PDFs are generated and downloaded only — never emailed automatically.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PasswordGate>
        <InvoiceApp />
      </PasswordGate>
    </ErrorBoundary>
  );
}
