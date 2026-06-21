import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  SHOPEE_PARTNER_ID: z.string().default(""),
  SHOPEE_PARTNER_KEY: z.string().default(""),
  SHOPEE_AFFILIATE_APP_ID: z.string().default(""),
  SHOPEE_API_BASE_URL: z.string().default("https://open-api.affiliate.shopee.com"),
  SHOPEE_WEBHOOK_SECRET: z.string().default(""),
  CONVERSION_POLL_INTERVAL_MINUTES: z.coerce.number().default(15),
});

export const env = envSchema.parse(process.env);
