const mongoose = require("mongoose");

const CounterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", CounterSchema);

/** Atomically increments and returns the next invoice number, e.g. "JEW-0001". */
async function nextInvoiceNumber() {
  const counter = await Counter.findOneAndUpdate(
    { name: "invoice" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `JEW-${String(counter.seq).padStart(4, "0")}`;
}

module.exports = { Counter, nextInvoiceNumber };
