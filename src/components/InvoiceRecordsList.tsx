import { useState } from "react";
import { calcTotal } from "../types";
import type { InvoiceApiRecord } from "../utils/invoiceStore";
import { toInvoiceData } from "../utils/invoiceStore";
import { downloadInvoicePdf } from "../utils/generateInvoicePdf";

interface Props {
  records: InvoiceApiRecord[];
  loading: boolean;
  error: string | null;
}

export default function InvoiceRecordsList({ records, loading, error }: Props) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (record: InvoiceApiRecord) => {
    setDownloadingId(record._id);
    try {
      await downloadInvoicePdf(toInvoiceData(record));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <section className="card records-card">
      <h2>All Generated Invoices</h2>

      {loading && <p className="hint">Loading invoices…</p>}
      {error && <p className="gate-error">{error}</p>}
      {!loading && !error && records.length === 0 && (
        <p className="hint">No invoices generated yet — this list is shared across every device.</p>
      )}

      {!loading && !error && records.length > 0 && (
        <div className="records-list">
          {records.map((r) => (
            <div className="record-row" key={r._id}>
              <div className="record-main">
                <span className="record-number">{r.invoiceNumber}</span>
                <span className="record-name">{r.bill.billTo || "—"}</span>
                <span className="record-phone">{r.bill.mobileNo || "—"}</span>
                <span className="record-amount">Rs. {calcTotal(r.items).toLocaleString("en-IN")}</span>
              </div>
              <button
                type="button"
                className="btn btn-row-download"
                onClick={() => handleDownload(r)}
                disabled={downloadingId === r._id}
              >
                {downloadingId === r._id ? "…" : "Download PDF"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
