import { EarningStatus } from "@shopee-cashback/shared";

const COLORS: Record<EarningStatus, string> = {
  [EarningStatus.PENDING]: "#d97706",
  [EarningStatus.CONFIRMED]: "#16a34a",
  [EarningStatus.VOIDED]: "#dc2626",
};

export function EarningStatusBadge({ status }: { status: EarningStatus }) {
  return <span style={{ color: COLORS[status], fontWeight: 600 }}>{status}</span>;
}
