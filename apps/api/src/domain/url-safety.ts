import dns from "node:dns/promises";
import net from "node:net";
import { normalizeUrl } from "./validation.js";

export type UrlSafetyErrorCode =
  | "empty"
  | "invalid"
  | "protocol"
  | "private"
  | "blocked";

export class UrlSafetyError extends Error {
  constructor(
    message: string,
    public readonly code: UrlSafetyErrorCode,
  ) {
    super(message);
    this.name = "UrlSafetyError";
  }
}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function isPrivateIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  const ranges: Array<[number, number]> = [
    [ipv4ToInt("0.0.0.0"), ipv4ToInt("0.255.255.255")],
    [ipv4ToInt("10.0.0.0"), ipv4ToInt("10.255.255.255")],
    [ipv4ToInt("127.0.0.0"), ipv4ToInt("127.255.255.255")],
    [ipv4ToInt("169.254.0.0"), ipv4ToInt("169.254.255.255")],
    [ipv4ToInt("172.16.0.0"), ipv4ToInt("172.31.255.255")],
    [ipv4ToInt("192.168.0.0"), ipv4ToInt("192.168.255.255")],
  ];
  return ranges.some(([start, end]) => n >= start && n <= end);
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
  if (normalized.startsWith("fe80")) return true; // link-local
  // IPv4-mapped IPv6
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  return false;
}

export function isPrivateIpAddress(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateIpv4(ip);
  if (version === 6) return isPrivateIpv6(ip);
  return true;
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
]);

/** Parse and validate that a URL is public HTTP(S). Does not resolve DNS. */
export function assertPublicHttpUrl(raw: string): URL {
  if (!raw || !raw.trim()) {
    throw new UrlSafetyError("URL is required", "empty");
  }

  const normalized = normalizeUrl(raw);
  if (!normalized) {
    throw new UrlSafetyError("URL must be a valid HTTP or HTTPS address", "invalid");
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new UrlSafetyError("URL must be a valid HTTP or HTTPS address", "invalid");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UrlSafetyError("Only HTTP and HTTPS URLs are allowed", "protocol");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new UrlSafetyError("Requests to local or internal hosts are not allowed", "blocked");
  }

  // Literal IP in hostname
  if (net.isIP(hostname) && isPrivateIpAddress(hostname)) {
    throw new UrlSafetyError(
      "Requests to private or internal IP addresses are not allowed",
      "private",
    );
  }

  return parsed;
}

/** Resolve hostname and reject private/reserved addresses (SSRF protection). */
export async function assertResolvedPublicHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase();
  if (net.isIP(host)) {
    if (isPrivateIpAddress(host)) {
      throw new UrlSafetyError(
        "Requests to private or internal IP addresses are not allowed",
        "private",
      );
    }
    return;
  }

  let addresses: Array<{ address: string }>;
  try {
    addresses = await dns.lookup(host, { all: true, verbatim: true });
  } catch {
    throw new UrlSafetyError("Unable to resolve hostname", "invalid");
  }

  if (!addresses.length) {
    throw new UrlSafetyError("Unable to resolve hostname", "invalid");
  }

  for (const { address } of addresses) {
    if (isPrivateIpAddress(address)) {
      throw new UrlSafetyError(
        "Requests to private or internal IP addresses are not allowed",
        "private",
      );
    }
  }
}

export async function assertSafeFetchUrl(raw: string): Promise<URL> {
  const parsed = assertPublicHttpUrl(raw);
  await assertResolvedPublicHost(parsed.hostname);
  return parsed;
}
