import QRCode from "qrcode";
import { UPI_ID, PAYEE_NAME } from "../config/paymentConfig";

/** Builds a standard UPI deep-link string that any UPI app can scan and pay. */
export function buildUpiString(amount: string, note: string): string {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: PAYEE_NAME,
    am: amount || "0",
    cu: "INR",
    tn: note || "Jensi Electrical Works Bill",
  });
  return `upi://pay?${params.toString()}`;
}

/** Returns a PNG data URI for the QR code — usable directly in <img src> or jsPDF addImage. */
export async function generateUpiQrDataUrl(amount: string, note: string): Promise<string> {
  const upiString = buildUpiString(amount, note);
  return QRCode.toDataURL(upiString, {
    width: 240,
    margin: 1,
    color: { dark: "#4c0958", light: "#ffffff" },
  });
}
