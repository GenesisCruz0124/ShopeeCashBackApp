import cron from "node-cron";
import { pool } from "../config/db";
import { env } from "../config/env";
import { getConversionReport } from "../integrations/shopee/shopeeAffiliateApi";
import { ingestConversionRow } from "../modules/orders/orders.service";

const JOB_NAME = "shopee_conversion_sync";

async function getCheckpoint(): Promise<Date | null> {
  const { rows } = await pool.query(`SELECT last_run_at FROM job_checkpoints WHERE job_name = $1`, [JOB_NAME]);
  return rows[0]?.last_run_at ?? null;
}

async function setCheckpoint(): Promise<void> {
  await pool.query(
    `INSERT INTO job_checkpoints (job_name, last_run_at)
     VALUES ($1, now())
     ON CONFLICT (job_name) DO UPDATE SET last_run_at = now()`,
    [JOB_NAME],
  );
}

export async function pollConversions(): Promise<void> {
  const updatedSince = await getCheckpoint();
  let cursor: string | null = null;

  do {
    const page = await getConversionReport({ updatedSince, cursor });
    for (const row of page.items) {
      try {
        await ingestConversionRow(row);
      } catch (err) {
        console.error(`Failed to ingest order ${row.shopeeOrderId}`, err);
      }
    }
    cursor = page.nextCursor;
  } while (cursor !== null);

  await setCheckpoint();
}

export function scheduleConversionPolling(): void {
  const intervalMinutes = env.CONVERSION_POLL_INTERVAL_MINUTES;
  cron.schedule(`*/${intervalMinutes} * * * *`, () => {
    pollConversions().catch((err) => console.error("pollConversions job failed", err));
  });
}
