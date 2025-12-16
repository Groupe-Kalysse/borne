import { Router } from "express";
import { Badge } from "../Database/entities/Badge";

const router = Router();
router.get("/health", (_, res) => {
  res.send("OK!");
});
router.put("/badges", async (req, res) => {
  const { body } = req;
  const badges = body.map((rawBadges: Badge) => {
    const badge = Badge.create(rawBadges);
    badge.save();
  });

  return res.json(badges);
});

export default router;
