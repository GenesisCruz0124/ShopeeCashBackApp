import { withTransaction } from "../../config/db";
import { ShopeeConversionRow } from "../../integrations/shopee/shopee.types";
import { syncEarningForOrder } from "../earnings/earnings.service";
import {
  findAffiliateLinkBySubId,
  findOrderByShopeeIds,
  insertOrder,
  updateOrderStatus,
} from "./orders.repository";

export async function ingestConversionRow(row: ShopeeConversionRow): Promise<void> {
  await withTransaction(async (client) => {
    const link = await findAffiliateLinkBySubId(client, row.subId);
    if (!link) {
      console.warn(`No affiliate_link found for sub_id=${row.subId}, skipping order ${row.shopeeOrderId}`);
      return;
    }

    let order = await findOrderByShopeeIds(client, row.shopeeOrderId, row.shopeeOrderItemId);

    if (!order) {
      order = await insertOrder(client, {
        affiliateLinkId: link.id,
        userId: link.user_id,
        shopeeOrderId: row.shopeeOrderId,
        shopeeOrderItemId: row.shopeeOrderItemId,
        subId: row.subId,
        status: row.status,
        orderAmount: row.orderAmount,
        commissionAmount: row.commissionAmount,
        currency: row.currency,
        orderTime: row.orderTime,
        rawPayload: row.raw,
      });
    } else if (order.status !== row.status || order.commission_amount !== String(row.commissionAmount)) {
      await updateOrderStatus(client, order.id, row.status, row.commissionAmount, row.raw);
    }

    await syncEarningForOrder(client, order, row.status, row.commissionAmount);
  });
}
