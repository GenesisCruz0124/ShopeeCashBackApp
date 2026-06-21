import { Router } from "express";
import { pool } from "../../config/db";
import { AuthedRequest, requireAuth } from "../auth/auth.middleware";

export const earningsRouter = Router();

earningsRouter.get("/summary", requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query(
    `SELECT pending_balance, confirmed_balance FROM user_wallet_summary WHERE user_id = $1`,
    [req.userId],
  );
  const summary = rows[0] ?? { pending_balance: 0, confirmed_balance: 0 };
  res.json({ pendingBalance: Number(summary.pending_balance), confirmedBalance: Number(summary.confirmed_balance) });
});

earningsRouter.get("/earnings", requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM earnings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [req.userId],
  );
  res.json({ items: rows });
});

earningsRouter.get("/transactions", requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [req.userId],
  );
  res.json({ items: rows });
});
