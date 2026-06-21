import { pool } from "../../config/db";

export async function insertAffiliateLink(params: {
  userId: string;
  shopeeItemId: number;
  shopeeShopId: number;
  subId: string;
  shortLink: string;
  originalUrl: string;
}) {
  const { rows } = await pool.query(
    `INSERT INTO affiliate_links (user_id, shopee_item_id, shopee_shop_id, sub_id, short_link, original_url)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [params.userId, params.shopeeItemId, params.shopeeShopId, params.subId, params.shortLink, params.originalUrl],
  );
  return rows[0];
}

export async function listAffiliateLinksForUser(userId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM affiliate_links WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
}
