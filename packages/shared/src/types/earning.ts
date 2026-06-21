export enum EarningStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  VOIDED = "VOIDED",
}

export enum VoidReason {
  CANCELLED = "CANCELLED",
  RETURNED = "RETURNED",
}

export enum WalletTransactionType {
  EARNING_CONFIRMED = "EARNING_CONFIRMED",
  EARNING_VOIDED = "EARNING_VOIDED",
  WITHDRAWAL_REQUEST = "WITHDRAWAL_REQUEST",
  ADJUSTMENT = "ADJUSTMENT",
}

export interface EarningDTO {
  id: string;
  orderId: string;
  amount: number;
  status: EarningStatus;
  confirmedAt: string | null;
  voidedAt: string | null;
  voidReason: VoidReason | null;
}

export interface WalletSummaryDTO {
  pendingBalance: number;
  confirmedBalance: number;
}
