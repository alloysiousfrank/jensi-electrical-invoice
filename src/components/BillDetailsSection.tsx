import type { BillDetails } from "../types";

interface Props {
  bill: BillDetails;
  onChange: (next: BillDetails) => void;
}

export default function BillDetailsSection({ bill, onChange }: Props) {
  const set = <K extends keyof BillDetails>(key: K, value: BillDetails[K]) =>
    onChange({ ...bill, [key]: value });

  return (
    <section className="card">
      <h2>Bill Details</h2>
      <div className="grid">
        <div className="field full">
          <label htmlFor="billTo">Bill To</label>
          <input id="billTo" value={bill.billTo} onChange={(e) => set("billTo", e.target.value)} placeholder="Customer name" />
        </div>
        <div className="field full">
          <label htmlFor="address">Address</label>
          <textarea id="address" value={bill.address} onChange={(e) => set("address", e.target.value)} placeholder="Customer address" />
        </div>
        <div className="field">
          <label htmlFor="billNo">Bill No.</label>
          <input id="billNo" value={bill.billNo} readOnly className="readonly-field" title="Auto-generated when you click Generate Invoice" />
        </div>
        <div className="field">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" value={bill.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="mobileNo">Mobile No.</label>
          <input id="mobileNo" value={bill.mobileNo} onChange={(e) => set("mobileNo", e.target.value)} placeholder="10-digit mobile number" />
        </div>
      </div>
    </section>
  );
}
