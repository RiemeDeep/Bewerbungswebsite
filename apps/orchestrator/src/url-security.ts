import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type ResolvedAddress = {
  address: string;
  family: 4 | 6;
};

export type DnsResolver = (hostname: string) => Promise<ResolvedAddress[]>;

export type SafePublicUrl = {
  normalizedUrl: string;
  hostname: string;
  addresses: ResolvedAddress[];
};

export class UrlSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlSecurityError";
  }
}

const defaultResolver: DnsResolver = async (hostname) => {
  const resolved = await lookup(hostname, { all: true });

  return resolved.map((item) => ({ address: item.address, family: item.family as 4 | 6 }));
};

function isBlockedIpv4(address: string): boolean {
  const octets = address.split(".").map((part) => Number.parseInt(part, 10));
  if (
    octets.length !== 4 ||
    octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true;
  }

  const [first = 0, second = 0] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 192 && second === 0) ||
    (first === 198 && (second === 18 || second === 19 || second === 51)) ||
    (first === 203 && second === 0) ||
    first >= 224
  );
}

function isBlockedIpv6(address: string): boolean {
  const normalized = address.toLowerCase();

  if (normalized === "::" || normalized === "::1") {
    return true;
  }
  if (normalized.startsWith("::ffff:")) {
    return isBlockedIpv4(normalized.slice("::ffff:".length));
  }

  const firstGroup = Number.parseInt(normalized.split(":")[0] ?? "0", 16);
  if (!Number.isInteger(firstGroup)) {
    return true;
  }

  return (
    (firstGroup & 0xfe00) === 0xfc00 ||
    (firstGroup & 0xffc0) === 0xfe80 ||
    (firstGroup & 0xff00) === 0xff00
  );
}

function isBlockedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    return isBlockedIpv4(address);
  }
  if (family === 6) {
    return isBlockedIpv6(address);
  }

  return true;
}

export async function validatePublicHttpUrl(
  input: string,
  resolver: DnsResolver = defaultResolver,
): Promise<SafePublicUrl> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new UrlSecurityError("URL is invalid.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UrlSecurityError("Only http and https URLs are allowed.");
  }
  if (url.username || url.password) {
    throw new UrlSecurityError("URLs must not contain credentials.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new UrlSecurityError("Only default http and https ports are allowed.");
  }
  if (!url.hostname) {
    throw new UrlSecurityError("URL hostname is required.");
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[/u, "").replace(/\]$/u, "");
  const literalFamily = isIP(hostname);
  const addresses = literalFamily
    ? [{ address: hostname, family: literalFamily as 4 | 6 }]
    : await resolver(hostname);

  if (addresses.length === 0) {
    throw new UrlSecurityError("URL hostname did not resolve.");
  }
  if (addresses.some((item) => isBlockedAddress(item.address))) {
    throw new UrlSecurityError("URL resolves to a blocked network address.");
  }

  url.hash = "";

  return {
    normalizedUrl: url.toString(),
    hostname,
    addresses,
  };
}
