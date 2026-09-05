const mongoose = require("mongoose");

const LineItemSchema = new mongoose.Schema(
  {
    description: { type: String, default: "" },
    qty: { type: String, default: "" },
    rate: { type: String, default: "0" },
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    bill: {
      billTo: { type: String, default: "" },
      address: { type: String, default: "" },
      date: { type: String, default: "" },
      mobileNo: { type: String, default: "" },
    },
    items: { type: [LineItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", InvoiceSchema, "jensi_invoices");
