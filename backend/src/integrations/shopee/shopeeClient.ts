import crypto from "crypto";
import { env } from "../../config/env";

// Signing scheme is a placeholder (Partner ID/Key + HMAC-SHA256 over path+timestamp+body)
// modeled on Shopee Open Platform's documented pattern; confirm exact fields against
// real Shopee Affiliate Open API docs before going live.
function sign(path: string, timestamp: number, body: string): string {
  const base = `${env.SHOPEE_PARTNER_ID}${path}${timestamp}${body}`;
  return crypto.createHmac("sha256", env.SHOPEE_PARTNER_KEY).update(base).digest("hex");
}

export async function shopeeRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify(body);
  const signature = sign(path, timestamp, payload);

  const res = await fetch(`${env.SHOPEE_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Partner-Id": env.SHOPEE_PARTNER_ID,
      "X-Timestamp": String(timestamp),
      "X-Signature": signature,
    },
    body: payload,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopee API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export function verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  const expected = crypto.createHmac("sha256", env.SHOPEE_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
