import { calcLineAmount, calcTotal, newLineItem } from "../types";
import type { LineItem } from "../types";

interface Props {
  items: LineItem[];
  onChange: (next: LineItem[]) => void;
}

export default function LineItemsSection({ items, onChange }: Props) {
  const updateItem = <K extends keyof LineItem>(id: string, key: K, value: LineItem[K]) =>
    onChange(items.map((it) => (it.id === id ? { ...it, [key]: value } : it)));

  const addItem = () => onChange([...items, newLineItem()]);

  const removeItem = (id: string) => {
    // Always keep at least one row so the table never looks broken/empty.
    if (items.length <= 1) return;
    onChange(items.filter((it) => it.id !== id));
  };

  const total = calcTotal(items);

  return (
    <section className="card">
      <h2>Service / Item Details</h2>
      <div className="items-table">
        <div className="items-header">
          <span className="col-sno">S.No.</span>
          <span className="col-desc">Description</span>
          <span className="col-qty">Qty</span>
          <span className="col-rate">Rate (₹)</span>
          <span className="col-amount">Amount (₹)</span>
          <span className="col-remove" aria-hidden="true" />
        </div>
        {items.map((item, idx) => (
          <div className="items-row" key={item.id}>
            <span className="col-sno">{idx + 1}.</span>
            <input
              className="col-desc"
              value={item.description || ""}
              onChange={(e) => updateItem(item.id, "description", e.target.value)}
              placeholder="e.g. Ceiling Fan Fixed"
            />
            <input
              className="col-qty"
              value={item.qty || ""}
              onChange={(e) => updateItem(item.id, "qty", e.target.value)}
              placeholder="1"
              inputMode="decimal"
            />
            <input
              className="col-rate"
              value={item.rate || ""}
              onChange={(e) => updateItem(item.id, "rate", e.target.value)}
              placeholder="0"
              inputMode="decimal"
            />
            <span className="col-amount amount-readout">{calcLineAmount(item).toFixed(0)}</span>
            <button
              type="button"
              className="row-remove-btn"
              onClick={() => removeItem(item.id)}
              disabled={items.length <= 1}
              title="Remove this row"
              aria-label="Remove this row"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="add-row-btn" onClick={addItem}>
        + Add Service
      </button>

      <div className="live-total">
        <span>Total Amount</span>
        <strong>₹ {total.toFixed(0)}</strong>
      </div>
    </section>
  );
}
