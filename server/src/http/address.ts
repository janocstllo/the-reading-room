import type { Request } from "express";

function normalize(ip: string): string {
  return ip.replace(/^::ffff:/, "").trim();
}

// Set TRUST_PROXY=true when the app runs behind a hosting proxy (e.g. Wasmer Edge).
// The last X-Forwarded-For entry is the one appended by that proxy; earlier
// entries come from the client and can be forged.
const TRUST_PROXY = process.env.TRUST_PROXY === "true";

export function guestAddress(req: Request): string {
  if (TRUST_PROXY) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
      const last = normalize(forwarded.split(",").pop() ?? "");
      if (last) return last;
    }
  }
  const socketIp = normalize(req.socket.remoteAddress || "unknown");
  const loopback = socketIp === "127.0.0.1" || socketIp === "::1";
  if (loopback) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
      const first = normalize(forwarded.split(",")[0] ?? "");
      if (first) return first;
    }
  }
  return socketIp;
}
