import { PoolClient } from "pg";
import { EarningStatus, OrderStatus, VoidReason, WalletTransactionType } from "@shopee-cashback/shared";
import { OrderRow } from "../orders/orders.repository";
import {
  confirmEarning,
  createEarning,
  findEarningByOrderId,
  recordWalletTransaction,
  updateEarningAmount,
  voidEarning,
} from "./earnings.repository";

const VOID_REASON_BY_STATUS: Partial<Record<OrderStatus, VoidReason>> = {
  [OrderStatus.CANCELLED]: VoidReason.CANCELLED,
  [OrderStatus.RETURNED]: VoidReason.RETURNED,
};

/**
 * Idempotent state transition: given the freshly observed order status/commission,
 * brings the order's earning record in line. Safe to call repeatedly with the same
 * or stale data — re-applying an already-applied transition is a no-op.
 */
export async function syncEarningForOrder(
  client: PoolClient,
  order: OrderRow,
  newStatus: OrderStatus,
  commissionAmount: number,
): Promise<void> {
  const earning = await findEarningByOrderId(client, order.id);

  if (newStatus === OrderStatus.PENDING) {
    if (!earning) {
      await createEarning(client, {
        orderId: order.id,
        userId: order.user_id,
        amount: commissionAmount,
        status: EarningStatus.PENDING,
      });
    } else if (earning.status === EarningStatus.PENDING) {
      await updateEarningAmount(client, earning.id, commissionAmount);
    }
    // CONFIRMED or VOIDED already decided — a stale PENDING report row must not regress state.
    return;
  }

  if (newStatus === OrderStatus.COMPLETED) {
    if (!earning) {
      const created = await createEarning(client, {
        orderId: order.id,
        userId: order.user_id,
        amount: commissionAmount,
        status: EarningStatus.PENDING,
      });
      await confirmEarning(client, created.id, commissionAmount);
      await recordWalletTransaction(client, {
        userId: order.user_id,
        earningId: created.id,
        type: WalletTransactionType.EARNING_CONFIRMED,
        amount: commissionAmount,
      });
      return;
    }
    if (earning.status === EarningStatus.PENDING) {
      await confirmEarning(client, earning.id, commissionAmount);
      await recordWalletTransaction(client, {
        userId: order.user_id,
        earningId: earning.id,
        type: WalletTransactionType.EARNING_CONFIRMED,
        amount: commissionAmount,
      });
    }
    // already CONFIRMED -> no-op idempotent re-poll. Already VOIDED -> anomaly, leave for manual review.
    return;
  }

  if (newStatus === OrderStatus.CANCELLED || newStatus === OrderStatus.RETURNED) {
    const reason = VOID_REASON_BY_STATUS[newStatus]!;
    if (!earning) {
      await createEarning(client, {
        orderId: order.id,
        userId: order.user_id,
        amount: commissionAmount,
        status: EarningStatus.VOIDED,
        voidReason: reason,
      });
      return;
    }
    if (earning.status === EarningStatus.PENDING) {
      await voidEarning(client, earning.id, reason);
      // never credited — no wallet transaction needed.
      return;
    }
    if (earning.status === EarningStatus.CONFIRMED) {
      // Late cancellation/return after commission was already paid out — reverse it.
      await voidEarning(client, earning.id, reason);
      await recordWalletTransaction(client, {
        userId: order.user_id,
        earningId: earning.id,
        type: WalletTransactionType.EARNING_VOIDED,
        amount: -Number(earning.amount),
      });
    }
    // already VOIDED -> no-op.
  }
}
