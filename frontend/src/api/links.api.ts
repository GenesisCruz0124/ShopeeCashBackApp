import { AffiliateLinkDTO } from "@shopee-cashback/shared";
import { apiFetch } from "./client";

export function generateLink(shopeeItemId: number, shopeeShopId: number): Promise<AffiliateLinkDTO> {
  return apiFetch("/links", { method: "POST", body: JSON.stringify({ shopeeItemId, shopeeShopId }) });
}

export function listLinks(): Promise<{ items: AffiliateLinkDTO[] }> {
  return apiFetch("/links");
}
