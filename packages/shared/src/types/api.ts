export interface ProductDTO {
  id: string;
  shopeeItemId: number;
  shopeeShopId: number;
  name: string;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  commissionRate: number | null;
  productUrl: string;
}

export interface AffiliateLinkDTO {
  id: string;
  productId: string | null;
  shopeeItemId: number;
  shopeeShopId: number;
  subId: string;
  shortLink: string;
  originalUrl: string;
  createdAt: string;
}

export interface AuthUserDTO {
  id: string;
  email: string;
  displayName: string | null;
}
