import { PoolClient } from "pg";
import { OrderStatus } from "@shopee-cashback/shared";

export interface OrderRow {
  id: string;
  affiliate_link_id: string;
  user_id: string;
  shopee_order_id: string;
  shopee_order_item_id: string | null;
  sub_id: string;
  status: OrderStatus;
  commission_amount: string;
}

export async function findAffiliateLinkBySubId(client: PoolClient, subId: string) {
  const { rows } = await client.query(
    `SELECT id, user_id FROM affiliate_links WHERE sub_id = $1`,
    [subId],
  );
  return rows[0] as { id: string; user_id: string } | undefined;
}

export async function findOrderByShopeeIds(
  client: PoolClient,
  shopeeOrderId: string,
  shopeeOrderItemId: string | null,
): Promise<OrderRow | undefined> {
  const { rows } = await client.query(
    `SELECT * FROM orders WHERE shopee_order_id = $1 AND shopee_order_item_id IS NOT DISTINCT FROM $2`,
    [shopeeOrderId, shopeeOrderItemId],
  );
  return rows[0];
}

export async function insertOrder(
  client: PoolClient,
  params: {
    affiliateLinkId: string;
    userId: string;
    shopeeOrderId: string;
    shopeeOrderItemId: string | null;
    subId: string;
    status: OrderStatus;
    orderAmount: number | null;
    commissionAmount: number;
    currency: string;
    orderTime: string | null;
    rawPayload: unknown;
  },
): Promise<OrderRow> {
  const { rows } = await client.query(
    `INSERT INTO orders
      (affiliate_link_id, user_id, shopee_order_id, shopee_order_item_id, sub_id, status,
       order_amount, commission_amount, currency, order_time, raw_payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      params.affiliateLinkId,
      params.userId,
      params.shopeeOrderId,
      params.shopeeOrderItemId,
      params.subId,
      params.status,
      params.orderAmount,
      params.commissionAmount,
      params.currency,
      params.orderTime,
      params.rawPayload,
    ],
  );
  return rows[0];
}

export async function updateOrderStatus(
  client: PoolClient,
  orderId: string,
  status: OrderStatus,
  commissionAmount: number,
  rawPayload: unknown,
): Promise<void> {
  await client.query(
    `UPDATE orders
     SET status = $2, commission_amount = $3, raw_payload = $4,
         status_updated_at = now(), updated_at = now()
     WHERE id = $1`,
    [orderId, status, commissionAmount, rawPayload],
  );
}
