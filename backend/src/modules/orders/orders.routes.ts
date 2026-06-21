import { Router } from "express";
import { pool } from "../../config/db";
import { AuthedRequest, requireAuth } from "../auth/auth.middleware";

export const ordersRouter = Router();

ordersRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [req.userId],
  );
  res.json({ items: rows });
});
