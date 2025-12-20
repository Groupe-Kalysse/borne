import { Router } from "express";
import { Badge } from "../Database/entities/Badge";

const router = Router();
router.get("/health", (_, res) => {
  res.send("OK!");
});
router.put("/badges", async (req, res) => {
  const { body } = req;
  const badges = body.map((rawBadge: Badge) => {
    const badge = Badge.create(rawBadge);
    badge.save();
  });

  return res.json(badges);
});

export default router;
