import { Router } from "express";
import { pollConversions } from "../../jobs/pollConversions.job";

export const internalRouter = Router();

internalRouter.post("/sync/conversions", async (_req, res) => {
  try {
    await pollConversions();
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
