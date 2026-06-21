import cors from "cors";
import express from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { usersRouter } from "./modules/users/users.routes";
import { productsRouter } from "./modules/products/products.routes";
import { linksRouter } from "./modules/affiliateLinks/links.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { earningsRouter } from "./modules/earnings/earnings.routes";
import { withdrawalsRouter } from "./modules/withdrawals/withdrawals.routes";
import { shopeeWebhookRouter } from "./integrations/shopee/shopeeWebhook.routes";
import { internalRouter } from "./modules/internal/internal.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/products", productsRouter);
app.use("/api/links", linksRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/wallet", earningsRouter);
app.use("/api/withdrawals", withdrawalsRouter);
app.use("/webhooks/shopee", shopeeWebhookRouter);
app.use("/api/internal", internalRouter);
