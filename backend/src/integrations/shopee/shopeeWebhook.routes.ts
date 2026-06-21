import { Router } from "express";
import { mapShopeeOrderStatus } from "./shopeeAffiliateApi";
import { verifyWebhookSignature } from "./shopeeClient";
import { ingestConversionRow } from "../../modules/orders/orders.service";

export const shopeeWebhookRouter = Router();

shopeeWebhookRouter.post("/conversion", async (req, res) => {
  const signature = req.headers["x-shopee-signature"];
  const rawBody = JSON.stringify(req.body);

  if (typeof signature !== "string" || !verifyWebhookSignature(rawBody, signature)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  res.status(200).json({ received: true });

  const row = req.body;
  await ingestConversionRow({
    shopeeOrderId: row.order_id,
    shopeeOrderItemId: row.order_item_id ?? null,
    subId: row.sub_id1 ?? row.sub_id,
    status: mapShopeeOrderStatus(row.status),
    orderAmount: row.order_amount ?? null,
    commissionAmount: row.commission_amount ?? 0,
    currency: row.currency ?? "PHP",
    orderTime: row.order_time ?? null,
    raw: row,
  }).catch((err) => console.error("Failed to ingest webhook conversion row", err));
});
