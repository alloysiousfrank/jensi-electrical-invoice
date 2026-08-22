import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { LOGO_BASE64 } from "../assets/logo";
import { SIGNATURE_BASE64 } from "../assets/signature";
import { amountInWords, calcLineAmount, calcTotal } from "../types";
import type { InvoiceData } from "../types";
import { generateUpiQrDataUrl } from "./qrCode";
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

// Colors sampled directly from the business's original letterhead artwork.
const PURPLE: [number, number, number] = [76, 9, 88]; // #4c0958
const PURPLE_BORDER: [number, number, number] = [102, 37, 95]; // #66255f
const INK: [number, number, number] = [40, 20, 38];
const SLATE: [number, number, number] = [110, 90, 108];
const LINE: [number, number, number] = [222, 200, 220];
const PANEL: [number, number, number] = [250, 245, 251]; // pale lavender
const WHITE: [number, number, number] = [255, 255, 255];

function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export async function buildInvoicePdf(data: InvoiceData): Promise<jsPDF> {
  const { bill, items } = data;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // --- Outer decorative frame (drawn on every page) ---
  const drawFrame = () => {
    doc.setDrawColor(...PURPLE_BORDER);
    doc.setLineWidth(2.5);
    doc.rect(14, 14, pageWidth - 28, pageHeight - 28);
  };
  drawFrame();

  let y = 46;

  // --- Header: logo + business identity ---
  const logoSize = 84;
  try {
    doc.addImage(LOGO_BASE64, "PNG", margin + 4, y, logoSize, logoSize * (200 / 188));
  } catch {
    // If the logo image ever fails to decode, continue without blocking PDF generation.
  }

  const textX = margin + logoSize + 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text(BUSINESS_NAME, textX, y + 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11.5);
  doc.setTextColor(...INK);
  doc.text(BUSINESS_TAGLINE, textX, y + 42);

  doc.setFontSize(10);
  doc.setTextColor(...PURPLE);
  doc.text(BUSINESS_ADDRESS, textX, y + 60);
  doc.text(`Ph: ${BUSINESS_PHONE}   |   Email: ${BUSINESS_EMAIL}`, textX, y + 76);

  y += logoSize * (200 / 188) + 16;

  // --- Title pill ---
  const pillY = y;
  const pillWidth = 260;
  const pillHeight = 26;
  const pillX = (pageWidth - pillWidth) / 2;
  doc.setDrawColor(...PURPLE_BORDER);
  doc.setLineWidth(0.75);
  doc.line(margin + 20, pillY + pillHeight / 2, pillX - 10, pillY + pillHeight / 2);
  doc.line(pillX + pillWidth + 10, pillY + pillHeight / 2, pageWidth - margin - 20, pillY + pillHeight / 2);
  doc.setFillColor(...PURPLE);
  doc.roundedRect(pillX, pillY, pillWidth, pillHeight, 13, 13, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...WHITE);
  doc.text(BILL_TITLE, pageWidth / 2, pillY + pillHeight / 2 + 4, { align: "center" });

  y = pillY + pillHeight + 20;

  // --- Bill meta (Bill To / Address | Bill No / Date / Mobile) ---
  const metaLeftX = margin;
  const metaRightX = pageWidth / 2 + 10;
  const metaLineEndLeft = metaRightX - 30;
  const metaLineEndRight = pageWidth - margin;
  const labelColW = 62;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);

  const drawMetaRow = (x: number, rowY: number, label: string, value: string, lineEndX: number) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, x, rowY);
    doc.text(":", x + labelColW, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PURPLE);
    if (value) doc.text(value, x + labelColW + 14, rowY);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.6);
    doc.line(x + labelColW + 10, rowY + 3, lineEndX, rowY + 3);
    doc.setTextColor(...INK);
  };

  drawMetaRow(metaLeftX, y, "Bill To", bill.billTo, metaLineEndLeft);
  drawMetaRow(metaRightX, y, "Bill No.", bill.billNo, metaLineEndRight);
  y += 22;
  drawMetaRow(metaLeftX, y, "Address", bill.address, metaLineEndLeft);
  drawMetaRow(metaRightX, y, "Date", formatDate(bill.date), metaLineEndRight);
  y += 22;
  drawMetaRow(metaRightX, y, "Mobile No.", bill.mobileNo, metaLineEndRight);
  y += 18;

  // --- Line items table ---
  const rows = items.map((item, idx) => [
    `${idx + 1}.`,
    item.description || "—",
    item.qty.trim() || "\u2013",
    (parseFloat(item.rate || "0") || 0).toLocaleString("en-IN"),
    calcLineAmount(item).toLocaleString("en-IN"),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, bottom: 60 },
    head: [["S.No.", "Description", "Qty", "Rate (Rs.)", "Amount (Rs.)"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 9.2, textColor: INK, cellPadding: 5.5, lineColor: LINE, lineWidth: 0.6 },
    headStyles: { fillColor: PURPLE, textColor: WHITE, fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 44, halign: "center" },
      1: { cellWidth: pageWidth - margin * 2 - 44 - 60 - 90 - 100 },
      2: { cellWidth: 60, halign: "center" },
      3: { cellWidth: 90, halign: "center" },
      4: { cellWidth: 100, halign: "center", fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: PANEL },
    didDrawPage: () => {
      // Redraw the decorative frame on every page the table spans.
      drawFrame();
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY;

  // --- Total bar ---
  const total = calcTotal(items);
  const totalBarHeight = 28;
  const amountColWidth = 100;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.6);
  doc.rect(margin, y, pageWidth - margin * 2 - amountColWidth, totalBarHeight);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...PURPLE);
  doc.text("TOTAL AMOUNT", margin + (pageWidth - margin * 2 - amountColWidth) / 2, y + totalBarHeight / 2 + 4, {
    align: "center",
  });
  doc.setFillColor(...PURPLE);
  doc.rect(pageWidth - margin - amountColWidth, y, amountColWidth, totalBarHeight, "F");
  doc.setTextColor(...WHITE);
  doc.text(`Rs. ${total.toLocaleString("en-IN")}`, pageWidth - margin - amountColWidth / 2, y + totalBarHeight / 2 + 4, {
    align: "center",
  });
  y += totalBarHeight + 14;

  // --- Amount in words ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text("Amount in Words :", margin, y);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...PURPLE);
  const wordsText = amountInWords(total);
  const wordsLines = doc.splitTextToSize(wordsText, pageWidth - margin * 2 - 130);
  doc.text(wordsLines, margin + 128, y);
  y += 13 * wordsLines.length + 8;

  // --- Thank-you note (flows with content, not fixed) ---
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10.5);
  doc.setTextColor(...PURPLE);
  doc.text(THANK_YOU_NOTE, margin, y);
  y += 4;

  // --- Fixed-position bottom block: QR (left) + signature (right), always ---
  // at the same distance from the bottom of the page, regardless of how
  // tall the item table or the content above it is. If content runs long,
  // a fresh page is started instead of letting anything overlap.
  const sigLineWidth = 170;
  const sigImgWidth = 120;
  const sigImgHeight = sigImgWidth / 2.49;
  const qrSize = 78;
  const bottomBlockHeight = 90; // space reserved for the QR / signature block
  let bottomY = pageHeight - 68;

  const sigZoneTop = bottomY - bottomBlockHeight - 6;
  if (y > sigZoneTop) {
    doc.addPage();
    drawFrame();
    bottomY = pageHeight - 68;
  }

  const qrTop = bottomY - bottomBlockHeight;
  try {
    const qrDataUrl = await generateUpiQrDataUrl(total.toFixed(0), `${BUSINESS_NAME} - ${bill.billTo || "Bill"}`);
    doc.setDrawColor(...LINE);
    doc.roundedRect(margin, qrTop, qrSize + 12, qrSize + 12, 4, 4);
    doc.addImage(qrDataUrl, "PNG", margin + 6, qrTop + 6, qrSize, qrSize);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`Scan to Pay (UPI) - Rs. ${total.toLocaleString("en-IN")}`, margin + qrSize + 26, qrTop + 34);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text("Any UPI app \u2014 GPay, PhonePe, Paytm", margin + qrSize + 26, qrTop + 48);
  } catch {
    // If the QR fails to generate, the rest of the invoice still renders fine.
  }

  // Authorised signatory's signature image, centered above its line.
  const rightSigX = pageWidth - margin - sigLineWidth;
  doc.addImage(
    SIGNATURE_BASE64,
    "PNG",
    rightSigX + (sigLineWidth - sigImgWidth) / 2,
    bottomY - sigImgHeight - 4,
    sigImgWidth,
    sigImgHeight
  );
  doc.setDrawColor(...LINE);
  doc.line(rightSigX, bottomY, pageWidth - margin, bottomY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.text(SIGNATORY_LINE, rightSigX, bottomY + 16);

  return doc;
}

export async function downloadInvoicePdf(data: InvoiceData): Promise<void> {
  const doc = await buildInvoicePdf(data);
  const safeBillNo = data.bill.billNo.trim().replace(/[^a-z0-9-]+/gi, "_") || "Bill";
  doc.save(`JensiElectricalWorks_${safeBillNo}.pdf`);
}
