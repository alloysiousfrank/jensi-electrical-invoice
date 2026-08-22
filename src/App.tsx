import { useState } from "react";
import BillDetailsSection from "./components/BillDetailsSection";
import LineItemsSection from "./components/LineItemsSection";
import InvoicePreview from "./components/InvoicePreview";
import { emptyBillDetails, defaultLineItems } from "./types";
import type { BillDetails, LineItem } from "./types";
import { BUSINESS_NAME } from "./config/businessConfig";

export default function App() {
  const [bill, setBill] = useState<BillDetails>(emptyBillDetails);
  const [items, setItems] = useState<LineItem[]>(defaultLineItems);

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
