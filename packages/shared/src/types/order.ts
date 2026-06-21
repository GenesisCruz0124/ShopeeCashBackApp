export enum OrderStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  RETURNED = "RETURNED",
}

export interface OrderDTO {
  id: string;
  affiliateLinkId: string;
  shopeeOrderId: string;
  subId: string;
  status: OrderStatus;
  orderAmount: number | null;
  commissionAmount: number;
  currency: string;
  orderTime: string | null;
  statusUpdatedAt: string;
}
