import "dotenv/config";
import { app } from "./app";
import { env } from "./config/env";
import { scheduleConversionPolling } from "./jobs/pollConversions.job";

app.listen(env.PORT, () => {
  console.log(`Backend listening on port ${env.PORT}`);
  scheduleConversionPolling();
});
