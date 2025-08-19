// api/auth/google.js
import { googleAuthHandler } from "../../backend/routes/auth";

export default async function handler(req, res) {
  // Call your existing route logic
  await googleAuthHandler(req, res);
}