// Change this before you deploy. This is a simple front-end gate meant to
// keep casual visitors off the admin form — it is NOT strong security,
// since anyone who views the deployed JS bundle can read this value.
// If you need real access control later (separate logins, can't-be-bypassed
// protection), that requires a backend/auth service — happy to add one.
export const ADMIN_PASSWORD = "jensi2026";

// How the "unlocked" state is remembered: "session" clears when the browser
// tab closes; "local" stays unlocked on that device until manually cleared.
export const UNLOCK_STORAGE: "session" | "local" = "session";
