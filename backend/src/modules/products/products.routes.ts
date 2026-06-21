import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware";
import { searchProducts } from "../../integrations/shopee/shopeeAffiliateApi";

export const productsRouter = Router();

const searchSchema = z.object({
  keyword: z.string().min(1),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

productsRouter.get("/search", requireAuth, async (req, res) => {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const results = await searchProducts(parsed.data.keyword, parsed.data.page, parsed.data.limit);
  res.json({ items: results });
});
