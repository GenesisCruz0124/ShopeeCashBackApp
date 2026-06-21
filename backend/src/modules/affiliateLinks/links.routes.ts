import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { AuthedRequest, requireAuth } from "../auth/auth.middleware";
import { generateShortLink } from "../../integrations/shopee/shopeeAffiliateApi";
import { insertAffiliateLink, listAffiliateLinksForUser } from "./links.repository";

export const linksRouter = Router();

const generateLinkSchema = z.object({
  shopeeItemId: z.number(),
  shopeeShopId: z.number(),
});

linksRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = generateLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const subId = `u_${req.userId}_${randomUUID().slice(0, 8)}`;
  const shopeeLink = await generateShortLink({
    itemId: parsed.data.shopeeItemId,
    shopId: parsed.data.shopeeShopId,
    subId,
  });

  const link = await insertAffiliateLink({
    userId: req.userId!,
    shopeeItemId: parsed.data.shopeeItemId,
    shopeeShopId: parsed.data.shopeeShopId,
    subId,
    shortLink: shopeeLink.shortLink,
    originalUrl: shopeeLink.originalUrl,
  });

  res.status(201).json(link);
});

linksRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const links = await listAffiliateLinksForUser(req.userId!);
  res.json({ items: links });
});
