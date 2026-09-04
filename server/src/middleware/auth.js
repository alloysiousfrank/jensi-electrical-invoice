/**
 * Simple shared-secret auth: the frontend sends the admin key in the
 * x-admin-key header (the same value as ADMIN_PASSWORD in the frontend's
 * authConfig.ts). This is intentionally lightweight — fine for a small
 * shop's shared admin tool, not meant as per-user login security.
 */
function requireAdminKey(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;
  const provided = req.headers["x-admin-key"];
  if (!expected) {
    return res.status(500).json({ error: "Server misconfigured: ADMIN_API_KEY not set." });
  }
  if (provided !== expected) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  next();
}

module.exports = { requireAdminKey };
