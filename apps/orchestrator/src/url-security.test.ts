import { describe, expect, it } from "vitest";

import { UrlSecurityError, validatePublicHttpUrl, type DnsResolver } from "./url-security.js";

const publicResolver: DnsResolver = async () => [{ address: "93.184.216.34", family: 4 }];

describe("validatePublicHttpUrl", () => {
  it("accepts a normalized public http URL", async () => {
    await expect(
      validatePublicHttpUrl("https://Example.com/jobs#fragment", publicResolver),
    ).resolves.toMatchObject({
      normalizedUrl: "https://example.com/jobs",
      hostname: "example.com",
    });
  });

  it("rejects non-http protocols", async () => {
    await expect(
      validatePublicHttpUrl("file:///etc/passwd", publicResolver),
    ).rejects.toBeInstanceOf(UrlSecurityError);
  });

  it("rejects URLs with credentials", async () => {
    await expect(
      validatePublicHttpUrl("https://user:secret@example.com/jobs", publicResolver),
    ).rejects.toBeInstanceOf(UrlSecurityError);
  });

  it("rejects non-default ports", async () => {
    await expect(
      validatePublicHttpUrl("https://example.com:8443/jobs", publicResolver),
    ).rejects.toBeInstanceOf(UrlSecurityError);
  });

  it("rejects localhost and private IPv4 literals", async () => {
    await expect(validatePublicHttpUrl("http://127.0.0.1", publicResolver)).rejects.toBeInstanceOf(
      UrlSecurityError,
    );
    await expect(validatePublicHttpUrl("http://10.0.0.1", publicResolver)).rejects.toBeInstanceOf(
      UrlSecurityError,
    );
    await expect(
      validatePublicHttpUrl("http://192.168.1.20", publicResolver),
    ).rejects.toBeInstanceOf(UrlSecurityError);
  });

  it("rejects private addresses returned by DNS", async () => {
    await expect(
      validatePublicHttpUrl("https://example.com/jobs", async () => [
        { address: "93.184.216.34", family: 4 },
        { address: "172.16.0.5", family: 4 },
      ]),
    ).rejects.toBeInstanceOf(UrlSecurityError);
  });

  it("rejects loopback and unique-local IPv6 addresses", async () => {
    await expect(validatePublicHttpUrl("http://[::1]", publicResolver)).rejects.toBeInstanceOf(
      UrlSecurityError,
    );
    await expect(
      validatePublicHttpUrl("https://example.com", async () => [{ address: "fd00::1", family: 6 }]),
    ).rejects.toBeInstanceOf(UrlSecurityError);
  });
});
