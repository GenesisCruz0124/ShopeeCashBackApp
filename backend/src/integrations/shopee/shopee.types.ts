import { OrderStatus } from "@shopee-cashback/shared";

export interface ShopeeProductResult {
  itemId: number;
  shopId: number;
  name: string;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  commissionRate: number | null;
  productUrl: string;
  raw: unknown;
}

export interface ShopeeShortLinkResult {
  shortLink: string;
  originalUrl: string;
}

export interface ShopeeConversionRow {
  shopeeOrderId: string;
  shopeeOrderItemId: string | null;
  subId: string;
  status: OrderStatus;
  orderAmount: number | null;
  commissionAmount: number;
  currency: string;
  orderTime: string | null;
  raw: unknown;
}

export interface ShopeeConversionReportPage {
  items: ShopeeConversionRow[];
  nextCursor: string | null;
}
