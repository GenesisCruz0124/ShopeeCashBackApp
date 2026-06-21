import { OrderStatus } from "@shopee-cashback/shared";
import { shopeeRequest } from "./shopeeClient";
import {
  ShopeeConversionReportPage,
  ShopeeProductResult,
  ShopeeShortLinkResult,
} from "./shopee.types";

const SHOPEE_STATUS_MAP: Record<string, OrderStatus> = {
  UNPAID: OrderStatus.PENDING,
  PENDING: OrderStatus.PENDING,
  COMPLETED: OrderStatus.COMPLETED,
  CANCELLED: OrderStatus.CANCELLED,
  RETURNED: OrderStatus.RETURNED,
  REFUNDED: OrderStatus.RETURNED,
};

export function mapShopeeOrderStatus(raw: string): OrderStatus {
  return SHOPEE_STATUS_MAP[raw.toUpperCase()] ?? OrderStatus.PENDING;
}

export async function searchProducts(keyword: string, page: number, limit: number): Promise<ShopeeProductResult[]> {
  const data = await shopeeRequest<{ items: any[] }>("/api/v1/product/search", { keyword, page, limit });
  return data.items.map((item) => ({
    itemId: item.item_id,
    shopId: item.shop_id,
    name: item.name,
    imageUrl: item.image_url ?? null,
    priceMin: item.price_min ?? null,
    priceMax: item.price_max ?? null,
    commissionRate: item.commission_rate ?? null,
    productUrl: item.product_url,
    raw: item,
  }));
}

export async function generateShortLink(params: {
  itemId: number;
  shopId: number;
  subId: string;
}): Promise<ShopeeShortLinkResult> {
  const data = await shopeeRequest<{ short_link: string; original_url: string }>(
    "/api/v1/link/generate",
    { item_id: params.itemId, shop_id: params.shopId, sub_id1: params.subId },
  );
  return { shortLink: data.short_link, originalUrl: data.original_url };
}

export async function getConversionReport(params: {
  updatedSince: Date | null;
  cursor: string | null;
}): Promise<ShopeeConversionReportPage> {
  const data = await shopeeRequest<{ items: any[]; next_cursor: string | null }>(
    "/api/v1/conversion/report",
    {
      updated_since: params.updatedSince ? params.updatedSince.toISOString() : undefined,
      cursor: params.cursor ?? undefined,
    },
  );

  return {
    items: data.items.map((row) => ({
      shopeeOrderId: row.order_id,
      shopeeOrderItemId: row.order_item_id ?? null,
      subId: row.sub_id1 ?? row.sub_id,
      status: mapShopeeOrderStatus(row.status),
      orderAmount: row.order_amount ?? null,
      commissionAmount: row.commission_amount ?? 0,
      currency: row.currency ?? "PHP",
      orderTime: row.order_time ?? null,
      raw: row,
    })),
    nextCursor: data.next_cursor ?? null,
  };
}
