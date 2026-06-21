import { EarningDTO, WalletSummaryDTO } from "@shopee-cashback/shared";
import { apiFetch } from "./client";

export function fetchWalletSummary(): Promise<WalletSummaryDTO> {
  return apiFetch("/wallet/summary");
}

export function fetchEarnings(): Promise<{ items: EarningDTO[] }> {
  return apiFetch("/wallet/earnings");
}
