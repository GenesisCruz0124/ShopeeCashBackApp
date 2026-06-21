import { PoolClient } from "pg";
import { EarningStatus, VoidReason, WalletTransactionType } from "@shopee-cashback/shared";

export interface EarningRow {
  id: string;
  order_id: string;
  user_id: string;
  amount: string;
  status: EarningStatus;
}

export async function findEarningByOrderId(client: PoolClient, orderId: string): Promise<EarningRow | undefined> {
  const { rows } = await client.query(`SELECT * FROM earnings WHERE order_id = $1`, [orderId]);
  return rows[0];
}

export async function createEarning(
  client: PoolClient,
  params: {
    orderId: string;
    userId: string;
    amount: number;
    status: EarningStatus;
    voidReason?: VoidReason;
  },
): Promise<EarningRow> {
  const { rows } = await client.query(
    `INSERT INTO earnings (order_id, user_id, amount, status, confirmed_at, voided_at, void_reason)
     VALUES ($1,$2,$3,$4,
       CASE WHEN $4 = 'CONFIRMED' THEN now() ELSE NULL END,
       CASE WHEN $4 = 'VOIDED' THEN now() ELSE NULL END,
       $5)
     RETURNING *`,
    [params.orderId, params.userId, params.amount, params.status, params.voidReason ?? null],
  );
  return rows[0];
}

export async function updateEarningAmount(client: PoolClient, earningId: string, amount: number): Promise<void> {
  await client.query(`UPDATE earnings SET amount = $2, updated_at = now() WHERE id = $1`, [earningId, amount]);
}

export async function confirmEarning(client: PoolClient, earningId: string, amount: number): Promise<void> {
  await client.query(
    `UPDATE earnings SET status = 'CONFIRMED', amount = $2, confirmed_at = now(), updated_at = now() WHERE id = $1`,
    [earningId, amount],
  );
}

export async function voidEarning(client: PoolClient, earningId: string, reason: VoidReason): Promise<void> {
  await client.query(
    `UPDATE earnings SET status = 'VOIDED', void_reason = $2, voided_at = now(), updated_at = now() WHERE id = $1`,
    [earningId, reason],
  );
}

export async function getConfirmedBalance(client: PoolClient, userId: string): Promise<number> {
  const { rows } = await client.query(
    `SELECT COALESCE(SUM(amount), 0) AS balance FROM earnings WHERE user_id = $1 AND status = 'CONFIRMED'`,
    [userId],
  );
  return Number(rows[0].balance);
}

export async function recordWalletTransaction(
  client: PoolClient,
  params: {
    userId: string;
    earningId: string;
    type: WalletTransactionType;
    amount: number;
    description?: string;
  },
): Promise<void> {
  const balanceAfter = await getConfirmedBalance(client, params.userId);
  await client.query(
    `INSERT INTO wallet_transactions (user_id, earning_id, type, amount, balance_after, description)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [params.userId, params.earningId, params.type, params.amount, balanceAfter, params.description ?? null],
  );
}
