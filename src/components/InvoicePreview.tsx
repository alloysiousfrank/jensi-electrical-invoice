import { useEffect, useState } from "react";
import { LOGO_BASE64 } from "../assets/logo";
import { SIGNATURE_BASE64 } from "../assets/signature";
import { amountInWords, calcLineAmount, calcTotal } from "../types";
import type { InvoiceData } from "../types";
import { downloadInvoicePdf } from "../utils/generateInvoicePdf";
import { generateUpiQrDataUrl } from "../utils/qrCode";
import {
  BUSINESS_NAME,
  BUSINESS_TAGLINE,
  BUSINESS_ADDRESS,
  BUSINESS_PHONE,
  BUSINESS_EMAIL,
  BILL_TITLE,
  THANK_YOU_NOTE,
  SIGNATORY_LINE,
} from "../config/businessConfig";

interface Props {
  data: InvoiceData;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export default function InvoicePreview({ data }: Props) {
  const { bill, items } = data;
  const total = calcTotal(items);
  const totalStr = total.toFixed(0);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    generateUpiQrDataUrl(totalStr, `${BUSINESS_NAME} - ${bill.billTo || "Bill"}`)
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalStr, bill.billTo]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadInvoicePdf(data);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="card preview">
      <div className="preview-toolbar">
        <h2>Invoice Preview</h2>
        <button type="button" className="btn" onClick={handleDownload} disabled={downloading}>
          {downloading ? "Generating…" : "Download PDF"}
        </button>
      </div>

      <div className="invoice-sheet">
        <div className="invoice-frame">
          <div className="invoice-header">
            <img src={LOGO_BASE64} alt="JEW logo" className="invoice-logo" />
            <div className="header-text">
              <h1>{BUSINESS_NAME}</h1>
              <p className="tagline">{BUSINESS_TAGLINE}</p>
              <p className="contact-line">📍 {BUSINESS_ADDRESS}</p>
              <p className="contact-line">
                📞 {BUSINESS_PHONE} &nbsp;|&nbsp; ✉ {BUSINESS_EMAIL}
              </p>
            </div>
          </div>

          <div className="invoice-body">
            <div className="title-pill-wrap">
              <span className="title-line" />
              <span className="title-dot" />
              <span className="title-pill">{BILL_TITLE}</span>
              <span className="title-dot" />
              <span className="title-line" />
            </div>

            <div className="bill-meta-grid">
              <div className="bill-meta-col">
                <div className="meta-row">
                  <span className="meta-label">Bill To</span>
                  <span className="meta-colon">:</span>
                  <span className="meta-value underline">{bill.billTo}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Address</span>
                  <span className="meta-colon">:</span>
                  <span className="meta-value underline">{bill.address}</span>
                </div>
              </div>
              <div className="bill-meta-col">
                <div className="meta-row">
                  <span className="meta-label">Bill No.</span>
                  <span className="meta-colon">:</span>
                  <span className="meta-value underline">{bill.billNo}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Date</span>
                  <span className="meta-colon">:</span>
                  <span className="meta-value underline">{formatDate(bill.date)}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Mobile No.</span>
                  <span className="meta-colon">:</span>
                  <span className="meta-value underline">{bill.mobileNo}</span>
                </div>
              </div>
            </div>

            <table className="items-preview-table">
              <thead>
                <tr>
                  <th className="col-sno">S.No.</th>
                  <th className="col-desc">Description</th>
                  <th className="col-qty">Qty</th>
                  <th className="col-rate">Rate (₹)</th>
                  <th className="col-amount">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="col-sno">{idx + 1}.</td>
                    <td className="col-desc">{item.description || "—"}</td>
                    <td className="col-qty">{item.qty.trim() || "–"}</td>
                    <td className="col-rate">{(parseFloat(item.rate || "0") || 0).toLocaleString("en-IN")}</td>
                    <td className="col-amount">{calcLineAmount(item).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="total-bar">
              <span className="total-label">TOTAL AMOUNT</span>
              <span className="total-value">₹ {total.toLocaleString("en-IN")}</span>
            </div>

            <p className="amount-words">
              <strong>Amount in Words :</strong> <em>{amountInWords(total)}</em>
            </p>

            <div className="bottom-row">
              <div className="qr-block">
                {qrDataUrl && <img src={qrDataUrl} alt="UPI QR code" className="qr-image" />}
                <div>
                  <span className="qr-caption qr-caption-strong">Scan to Pay (UPI) — ₹ {total.toLocaleString("en-IN")}</span>
                  <br />
                  <span className="qr-caption">Any UPI app — GPay, PhonePe, Paytm</span>
                </div>
              </div>
              <p className="thank-you">{THANK_YOU_NOTE}</p>
            </div>

            <div className="signature-row">
              <div className="sig-line-authorised">
                <img src={SIGNATURE_BASE64} alt="Authorised signatory signature" className="sig-image" />
                <span>{SIGNATORY_LINE}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
