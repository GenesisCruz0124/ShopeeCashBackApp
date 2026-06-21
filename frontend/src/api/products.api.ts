import { apiFetch } from "./client";

export interface ProductSearchItem {
  itemId: number;
  shopId: number;
  name: string;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  productUrl: string;
}

export function searchProducts(keyword: string): Promise<{ items: ProductSearchItem[] }> {
  return apiFetch(`/products/search?keyword=${encodeURIComponent(keyword)}`);
}
