import { useState } from "react";
import { calcTotal } from "../types";
import type { InvoiceApiRecord } from "../utils/invoiceStore";
import { toInvoiceData, deleteInvoice } from "../utils/invoiceStore";
import { downloadInvoicePdf } from "../utils/generateInvoicePdf";

interface Props {
  records: InvoiceApiRecord[];
  loading: boolean;
  error: string | null;
  onEdit: (record: InvoiceApiRecord) => void;
  onDeleted: (id: string) => void;
  editingId: string | null;
}

export default function InvoiceRecordsList({ records, loading, error, onEdit, onDeleted, editingId }: Props) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDownload = async (record: InvoiceApiRecord) => {
    setDownloadingId(record._id);
    try {
      await downloadInvoicePdf(toInvoiceData(record));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate that PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (record: InvoiceApiRecord) => {
    const confirmed = window.confirm(
      `Delete invoice ${record.invoiceNumber || "this invoice"} for ${record.bill?.billTo || "this customer"}? This cannot be undone — it will be permanently removed for everyone.`
    );
    if (!confirmed) return;
    setDeletingId(record._id);
    try {
      await deleteInvoice(record._id);
      onDeleted(record._id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete that invoice.");
    } finally {
      setDeletingId(null);
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
            <div className={`record-row${editingId === r._id ? " record-row-editing" : ""}`} key={r._id}>
              <div className="record-main">
                <span className="record-number">{r.invoiceNumber || "—"}</span>
                <span className="record-name">{r.bill?.billTo || "—"}</span>
                <span className="record-phone">{r.bill?.mobileNo || "—"}</span>
                <span className="record-amount">Rs. {calcTotal(r.items || []).toLocaleString("en-IN")}</span>
              </div>
              <div className="record-actions">
                <button
                  type="button"
                  className="btn btn-row-edit"
                  onClick={() => onEdit(r)}
                  disabled={editingId === r._id}
                >
                  {editingId === r._id ? "Editing…" : "Edit"}
                </button>
                <button
                  type="button"
                  className="btn btn-row-download"
                  onClick={() => handleDownload(r)}
                  disabled={downloadingId === r._id}
                >
                  {downloadingId === r._id ? "…" : "Download PDF"}
                </button>
                <button
                  type="button"
                  className="btn btn-row-delete"
                  onClick={() => handleDelete(r)}
                  disabled={deletingId === r._id || editingId === r._id}
                  title={editingId === r._id ? "Finish or cancel editing first" : "Delete this invoice"}
                >
                  {deletingId === r._id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
