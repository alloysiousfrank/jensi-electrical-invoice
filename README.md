# Jensi Electrical Works — Service & Installation Bill Generator

A standalone invoice generator for **Jensi Electrical Works** (Electrical, Plumbing and Company AMC), styled to match the business's original letterhead.

## Features

- Bill details: Bill To, Address, Bill No., Date, Mobile No.
- Dynamic service/item table — add or remove rows freely, each with Description, Qty, and Rate. Amount is calculated automatically per row (Qty × Rate, or just Rate for flat-rate items where Qty is left blank).
- Total amount calculated automatically from all rows.
- Amount in words, generated automatically (Indian numbering).
- UPI QR code for payment, generated from the invoice total, using the business's UPI ID.
- Authorised signatory's signature embedded automatically.
- One-click PDF download matching the on-screen preview, with the QR code and signature fixed in position regardless of how many item rows are added.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Outputs to `dist/`, ready to deploy on Vercel (static Vite build, root-relative base path).
