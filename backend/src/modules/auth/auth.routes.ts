import { Router } from "express";
import { z } from "zod";
import { findUserByEmail, issueToken, register, verifyPassword } from "./auth.service";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().optional(),
});

authRouter.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existing = await findUserByEmail(parsed.data.email);
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const user = await register(parsed.data.email, parsed.data.password, parsed.data.displayName);
  const token = issueToken(user);
  res.status(201).json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } });
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.pick({ email: true, password: true }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user || !(await verifyPassword(user, parsed.data.password))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = issueToken(user);
  res.json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } });
});
