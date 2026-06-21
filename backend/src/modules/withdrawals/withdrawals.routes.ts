import { Router } from "express";
import { z } from "zod";
import { pool } from "../../config/db";
import { AuthedRequest, requireAuth } from "../auth/auth.middleware";

export const withdrawalsRouter = Router();

const requestSchema = z.object({ amount: z.number().positive() });

withdrawalsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { rows } = await pool.query(
    `INSERT INTO withdrawal_requests (user_id, amount, status) VALUES ($1, $2, 'NOT_IMPLEMENTED') RETURNING *`,
    [req.userId, parsed.data.amount],
  );
  res.status(202).json({ ...rows[0], message: "Withdrawals are not yet available." });
});

withdrawalsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM withdrawal_requests WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.userId],
  );
  res.json({ items: rows });
});
