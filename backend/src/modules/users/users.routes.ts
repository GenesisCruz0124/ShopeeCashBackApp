import { Router } from "express";
import { AuthedRequest, requireAuth } from "../auth/auth.middleware";
import { findUserById } from "../auth/auth.service";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await findUserById(req.userId!);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, displayName: user.display_name });
});
