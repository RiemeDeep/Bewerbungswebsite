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
    (first === 192 && second === 0 && (octets[2] ?? 0) === 0) ||
    (first === 192 && second === 0 && (octets[2] ?? 0) === 2) ||
    (first === 192 && second === 88 && (octets[2] ?? 0) === 99) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && (octets[2] ?? 0) === 100) ||
    (first === 203 && second === 0 && (octets[2] ?? 0) === 113) ||
    first >= 224
  );
}

function parseIpv6Groups(address: string): number[] | null {
  const normalized = address.toLowerCase();
  const compressionParts = normalized.split("::");
  if (compressionParts.length > 2) return null;

  const parsePart = (part: string): number[] | null => {
    if (!part) return [];
    const tokens = part.split(":");
    const groups: number[] = [];
    for (const [index, token] of tokens.entries()) {
      if (token.includes(".")) {
        if (index !== tokens.length - 1 || isIP(token) !== 4) return null;
        const octets = token.split(".").map((value) => Number.parseInt(value, 10));
        if (
          octets.length !== 4 ||
          octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)
        ) {
          return null;
        }
        groups.push(((octets[0] ?? 0) << 8) | (octets[1] ?? 0));
        groups.push(((octets[2] ?? 0) << 8) | (octets[3] ?? 0));
        continue;
      }
      if (!/^[0-9a-f]{1,4}$/u.test(token)) return null;
      groups.push(Number.parseInt(token, 16));
    }
    return groups;
  };

  const left = parsePart(compressionParts[0] ?? "");
  const right = parsePart(compressionParts[1] ?? "");
  if (!left || !right) return null;

  if (compressionParts.length === 1) return left.length === 8 ? left : null;
  const omittedGroupCount = 8 - left.length - right.length;
  if (omittedGroupCount < 1) return null;
  return [...left, ...Array<number>(omittedGroupCount).fill(0), ...right];
}

function embeddedIpv4(groups: number[], offset: number) {
  return [groups[offset] ?? 0, groups[offset + 1] ?? 0]
    .flatMap((group) => [(group >> 8) & 0xff, group & 0xff])
    .join(".");
}

function isBlockedIpv6(address: string): boolean {
  const groups = parseIpv6Groups(address);
  if (!groups) return true;

  const first = groups[0] ?? 0;
  const firstSixAreZero = groups.slice(0, 6).every((group) => group === 0);
  const mappedPrefix = groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff;
  if (firstSixAreZero || mappedPrefix) return isBlockedIpv4(embeddedIpv4(groups, 6));

  if (
    first === 0x0064 &&
    groups[1] === 0xff9b &&
    groups.slice(2, 6).every((group) => group === 0)
  ) {
    return isBlockedIpv4(embeddedIpv4(groups, 6));
  }
  if (first === 0x2002) return isBlockedIpv4(embeddedIpv4(groups, 1));

  return (
    (first & 0xe000) !== 0x2000 ||
    (first === 0x2001 && groups[1] === 0) ||
    (first === 0x2001 && groups[1] === 0x0db8)
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
  if (
    url.port &&
    ((url.protocol === "http:" && url.port !== "80") ||
      (url.protocol === "https:" && url.port !== "443"))
  ) {
    throw new UrlSecurityError("Only default http and https ports are allowed.");
  }
  if (!url.hostname) {
    throw new UrlSecurityError("URL hostname is required.");
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[/u, "").replace(/\]$/u, "");
  const literalFamily = isIP(hostname);
  let addresses: ResolvedAddress[];
  try {
    addresses = literalFamily
      ? [{ address: hostname, family: literalFamily as 4 | 6 }]
      : await resolver(hostname);
  } catch {
    throw new UrlSecurityError("URL hostname could not be resolved safely.");
  }

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
