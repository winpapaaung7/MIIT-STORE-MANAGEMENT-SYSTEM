/**
 * The single browser API origin. Vite exposes only variables prefixed with
 * VITE_; localhost keeps a new local checkout usable without a .env file.
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"
).replace(/\/$/, "");
