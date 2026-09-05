/**
 * One-time cleanup: before this fix, both chromatic-invoice's and
 * jensi-electrical-invoice's servers were (accidentally, via a Render env
 * var mix-up) pointed at the exact same MongoDB database, and both used
 * the same Mongoose model/collection names ("invoices" / "counters") and
 * the same counter key ("invoice"). That meant every invoice from both
 * projects landed in one shared collection, and both projects were
 * incrementing the same shared counter — which is why CP- and JEW-
 * numbers were interleaved in the same sequence.
 *
 * This script splits that shared data back apart:
 *   - Copies every "CP-*" document into its own "chromatic_invoices" collection.
 *   - Copies every "JEW-*" document into its own "jensi_invoices" collection.
 *   - Sets each project's counter (chromatic_counters / jensi_counters) to
 *     the highest number actually used, so the next invoice generated
 *     continues on from there instead of restarting at 0001.
 *
 * Safe to run more than once — existing documents are skipped, not
 * duplicated.
 *
 * HOW TO RUN (once, from either project's Render Shell tab — they share
 * the same database, so it only needs to run from one of them):
 *
 *   node server/scripts/migrate-split-collections.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected.");

  const db = mongoose.connection.db;
  const oldInvoices = db.collection("invoices");
  const oldCounters = db.collection("counters");

  const allDocs = await oldInvoices.find({}).toArray();
  console.log(`Found ${allDocs.length} document(s) in the old shared 'invoices' collection.`);

  const groups = {
    "CP-": { target: "chromatic_invoices", counterCollection: "chromatic_counters", counterName: "chromatic_invoice", prefix: "CP-" },
    "JEW-": { target: "jensi_invoices", counterCollection: "jensi_counters", counterName: "jensi_invoice", prefix: "JEW-" },
  };

  const maxSeq = { "CP-": 0, "JEW-": 0 };
  const toInsert = { "CP-": [], "JEW-": [] };

  for (const doc of allDocs) {
    const num = doc.invoiceNumber || "";
    const matchedPrefix = Object.keys(groups).find((p) => num.startsWith(p));
    if (!matchedPrefix) {
      console.log(`Skipping document with unrecognized invoiceNumber: ${num}`);
      continue;
    }
    toInsert[matchedPrefix].push(doc);
    const seqPart = parseInt(num.slice(matchedPrefix.length), 10);
    if (!Number.isNaN(seqPart) && seqPart > maxSeq[matchedPrefix]) {
      maxSeq[matchedPrefix] = seqPart;
    }
  }

  for (const [prefix, group] of Object.entries(groups)) {
    const docs = toInsert[prefix];
    if (docs.length === 0) {
      console.log(`No ${prefix}* documents to migrate.`);
      continue;
    }

    const targetCollection = db.collection(group.target);
    let inserted = 0;
    let skipped = 0;
    for (const doc of docs) {
      const exists = await targetCollection.findOne({ invoiceNumber: doc.invoiceNumber });
      if (exists) {
        skipped++;
        continue;
      }
      await targetCollection.insertOne(doc);
      inserted++;
    }
    console.log(`${group.target}: inserted ${inserted}, skipped ${skipped} (already present).`);

    const counterCollection = db.collection(group.counterCollection);
    const existingCounter = await counterCollection.findOne({ name: group.counterName });
    const newSeq = Math.max(maxSeq[prefix], existingCounter?.seq || 0);
    await counterCollection.updateOne(
      { name: group.counterName },
      { $set: { seq: newSeq } },
      { upsert: true }
    );
    console.log(`${group.counterCollection}: counter '${group.counterName}' set to ${newSeq}.`);
  }

  console.log("\nDone. The old 'invoices' and 'counters' collections were left untouched (not deleted) — this only copied data into the new separated collections.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
