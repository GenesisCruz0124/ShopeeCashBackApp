import { describe, expect, it, vi, beforeEach } from "vitest";
import { EarningStatus, OrderStatus, VoidReason, WalletTransactionType } from "@shopee-cashback/shared";
import { syncEarningForOrder } from "../src/modules/earnings/earnings.service";
import * as repo from "../src/modules/earnings/earnings.repository";
import { OrderRow } from "../src/modules/orders/orders.repository";

vi.mock("../src/modules/earnings/earnings.repository");

const fakeClient = {} as any;

function makeOrder(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: "order-1",
    affiliate_link_id: "link-1",
    user_id: "user-1",
    shopee_order_id: "SO-1",
    shopee_order_item_id: null,
    sub_id: "u_user-1_abc",
    status: OrderStatus.PENDING,
    commission_amount: "10.00",
    ...overrides,
  };
}

describe("syncEarningForOrder", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a PENDING earning on first PENDING report", async () => {
    vi.mocked(repo.findEarningByOrderId).mockResolvedValue(undefined);

    await syncEarningForOrder(fakeClient, makeOrder(), OrderStatus.PENDING, 10);

    expect(repo.createEarning).toHaveBeenCalledWith(fakeClient, {
      orderId: "order-1",
      userId: "user-1",
      amount: 10,
      status: EarningStatus.PENDING,
    });
    expect(repo.confirmEarning).not.toHaveBeenCalled();
    expect(repo.recordWalletTransaction).not.toHaveBeenCalled();
  });

  it("confirms a PENDING earning and credits the wallet on COMPLETED", async () => {
    vi.mocked(repo.findEarningByOrderId).mockResolvedValue({
      id: "earning-1",
      order_id: "order-1",
      user_id: "user-1",
      amount: "10.00",
      status: EarningStatus.PENDING,
    });

    await syncEarningForOrder(fakeClient, makeOrder(), OrderStatus.COMPLETED, 10);

    expect(repo.confirmEarning).toHaveBeenCalledWith(fakeClient, "earning-1", 10);
    expect(repo.recordWalletTransaction).toHaveBeenCalledWith(fakeClient, {
      userId: "user-1",
      earningId: "earning-1",
      type: WalletTransactionType.EARNING_CONFIRMED,
      amount: 10,
    });
  });

  it("is idempotent: re-applying COMPLETED on an already-CONFIRMED earning is a no-op", async () => {
    vi.mocked(repo.findEarningByOrderId).mockResolvedValue({
      id: "earning-1",
      order_id: "order-1",
      user_id: "user-1",
      amount: "10.00",
      status: EarningStatus.CONFIRMED,
    });

    await syncEarningForOrder(fakeClient, makeOrder(), OrderStatus.COMPLETED, 10);

    expect(repo.confirmEarning).not.toHaveBeenCalled();
    expect(repo.recordWalletTransaction).not.toHaveBeenCalled();
  });

  it("voids a PENDING earning on CANCELLED without touching the wallet", async () => {
    vi.mocked(repo.findEarningByOrderId).mockResolvedValue({
      id: "earning-1",
      order_id: "order-1",
      user_id: "user-1",
      amount: "10.00",
      status: EarningStatus.PENDING,
    });

    await syncEarningForOrder(fakeClient, makeOrder(), OrderStatus.CANCELLED, 10);

    expect(repo.voidEarning).toHaveBeenCalledWith(fakeClient, "earning-1", VoidReason.CANCELLED);
    expect(repo.recordWalletTransaction).not.toHaveBeenCalled();
  });

  it("voids a PENDING earning on RETURNED without touching the wallet", async () => {
    vi.mocked(repo.findEarningByOrderId).mockResolvedValue({
      id: "earning-1",
      order_id: "order-1",
      user_id: "user-1",
      amount: "10.00",
      status: EarningStatus.PENDING,
    });

    await syncEarningForOrder(fakeClient, makeOrder(), OrderStatus.RETURNED, 10);

    expect(repo.voidEarning).toHaveBeenCalledWith(fakeClient, "earning-1", VoidReason.RETURNED);
    expect(repo.recordWalletTransaction).not.toHaveBeenCalled();
  });

  it("reverses a CONFIRMED earning with a negative wallet transaction on a late CANCELLED/RETURNED", async () => {
    vi.mocked(repo.findEarningByOrderId).mockResolvedValue({
      id: "earning-1",
      order_id: "order-1",
      user_id: "user-1",
      amount: "10.00",
      status: EarningStatus.CONFIRMED,
    });

    await syncEarningForOrder(fakeClient, makeOrder(), OrderStatus.RETURNED, 10);

    expect(repo.voidEarning).toHaveBeenCalledWith(fakeClient, "earning-1", VoidReason.RETURNED);
    expect(repo.recordWalletTransaction).toHaveBeenCalledWith(fakeClient, {
      userId: "user-1",
      earningId: "earning-1",
      type: WalletTransactionType.EARNING_VOIDED,
      amount: -10,
    });
  });

  it("is idempotent: re-applying CANCELLED on an already-VOIDED earning is a no-op", async () => {
    vi.mocked(repo.findEarningByOrderId).mockResolvedValue({
      id: "earning-1",
      order_id: "order-1",
      user_id: "user-1",
      amount: "10.00",
      status: EarningStatus.VOIDED,
    });

    await syncEarningForOrder(fakeClient, makeOrder(), OrderStatus.CANCELLED, 10);

    expect(repo.voidEarning).not.toHaveBeenCalled();
    expect(repo.recordWalletTransaction).not.toHaveBeenCalled();
  });

  it("does not regress a CONFIRMED earning when a stale PENDING row arrives", async () => {
    vi.mocked(repo.findEarningByOrderId).mockResolvedValue({
      id: "earning-1",
      order_id: "order-1",
      user_id: "user-1",
      amount: "10.00",
      status: EarningStatus.CONFIRMED,
    });

    await syncEarningForOrder(fakeClient, makeOrder(), OrderStatus.PENDING, 10);

    expect(repo.updateEarningAmount).not.toHaveBeenCalled();
    expect(repo.createEarning).not.toHaveBeenCalled();
  });
});
