import { EarningDTO, WalletSummaryDTO } from "@shopee-cashback/shared";
import { useEffect, useState } from "react";
import { fetchEarnings, fetchWalletSummary } from "../api/earnings.api";
import { EarningStatusBadge } from "../components/EarningStatusBadge";

export function WalletPage() {
  const [summary, setSummary] = useState<WalletSummaryDTO | null>(null);
  const [earnings, setEarnings] = useState<EarningDTO[]>([]);

  useEffect(() => {
    fetchWalletSummary().then(setSummary);
    fetchEarnings().then((res) => setEarnings(res.items));
  }, []);

  return (
    <div>
      <h1>Wallet</h1>
      {summary && (
        <div>
          <p>Confirmed (available) balance: ${summary.confirmedBalance.toFixed(2)}</p>
          <p>Pending balance: ${summary.pendingBalance.toFixed(2)}</p>
        </div>
      )}
      <h2>Earnings</h2>
      <table>
        <thead>
          <tr>
            <th>Amount</th>
            <th>Status</th>
            <th>Confirmed At</th>
          </tr>
        </thead>
        <tbody>
          {earnings.map((earning) => (
            <tr key={earning.id}>
              <td>${earning.amount.toFixed(2)}</td>
              <td>
                <EarningStatusBadge status={earning.status} />
              </td>
              <td>{earning.confirmedAt ? new Date(earning.confirmedAt).toLocaleDateString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
