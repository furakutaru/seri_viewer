import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "httpOnly" | "path" | "sameSite" | "secure"> {
  const isDevelopment = process.env.NODE_ENV === "development";

  // Since we use app.set("trust proxy", 1), req.secure automatically
  // respects the X-Forwarded-Proto header from Vercel/Render.
  const isSecure = isDevelopment ? false : req.secure;

  return {
    httpOnly: true,
    path: "/",
    // The frontend and backend are on the identical origin, so "lax" is standard and secure.
    sameSite: "lax",
    secure: isSecure,
  };
}
