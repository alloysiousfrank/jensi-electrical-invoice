# Jensi Electrical Works Invoice — Backend

Small Express + MongoDB API so every device sees the same invoice list —
sharing the same MongoDB Atlas cluster as chromatic-invoice's backend, just
in its own separate database.

## 1. Reuse your existing MongoDB Atlas cluster

You already created a cluster for chromatic-invoice's server. Reuse it here
instead of creating a new one:

1. Go to your MongoDB Atlas project → the same cluster chromatic-invoice uses.
2. Under **Database Access**, you can reuse the same database user, or add a
   new one scoped to this project — either works since Network Access and
   the cluster itself are already set up.
3. Take chromatic-invoice's connection string and just change the database
   name at the end of the path:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/jensi-electrical-invoice?retryWrites=true&w=majority`

   That `jensi-electrical-invoice` database is a separate "folder" from
   chromatic-invoice's `chromatic-invoice` database — same cluster/storage,
   fully isolated data.

## 2. Deploy this folder to Render

1. Go to https://render.com and sign up (free) if you haven't already.
2. **New → Web Service** → connect the `jensi-electrical-invoice` GitHub repo.
3. Set **Root Directory** to `server`.
4. Build command: `npm install`. Start command: `npm start`.
5. Add environment variables (Render dashboard → Environment):
   - `MONGODB_URI` — the connection string from step 1
   - `ADMIN_API_KEY` — must match `ADMIN_PASSWORD` in the frontend's `src/config/authConfig.ts`
   - `ALLOWED_ORIGIN` — your Vercel frontend URL, e.g. `https://jensi-electrical-invoice.vercel.app`
6. Deploy. Render gives you a URL like `https://jensi-electrical-invoice-api.onrender.com`.

## 3. Point the frontend at it

In Vercel → Project Settings → Environment Variables, add:
- `VITE_API_URL` = your Render URL from step 2 (no trailing slash)

Redeploy the frontend after adding it.

## Notes

- Free Render web services sleep after inactivity — the first request after
  idle can take ~30-50 seconds to wake up. Fine for a small shop's usage
  pattern; upgrade to a paid instance later if that delay becomes annoying.
- Invoice numbers (`JEW-0001`, ...) are assigned by the server, atomically,
  so two devices generating invoices at the same moment never collide.
- This is a completely separate Render service from chromatic-invoice's —
  they just happen to point at databases living in the same MongoDB cluster.
