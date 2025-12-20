import badges from "../../config/badges.json";
import CommBus, { Command } from "../CommBus";
import { Badge, Role } from "../Database/entities/Badge";

export class JsonBadgeCollection {
  private commandBus: CommBus;

  constructor(commandBus: CommBus) {
    this.commandBus = commandBus;
    Promise.all(
      badges.map((rawBadge) => {
        const badge = Badge.create({
          ...rawBadge,
          role: rawBadge.role as Role,
        });
        badge.save();
      })
    );
    this.commandBus.listenEvent("nfc-hit", this.findBadgeFromNfc);
  }
  findBadgeFromNfc = async (command: Command) => {
    const nfcTrace = command.payload?.trace as string;
    const badge = await Badge.findOneBy({ trace: nfcTrace }); // badges.find((candidate) => candidate.trace === nfcTrace);
    if (badge)
      this.commandBus.fireEvent({
        label: "badge-hit",
        type: "info",
        message: `🪪 Badge reconnu: ${badge.name}`,
        payload: {
          data: badge,
        },
      });
    else
      this.commandBus.fireEvent({
        label: "badge-miss",
        type: "warning",
        message: `⚠️ Badge non reconnu: ${nfcTrace}`,
        payload: {
          data: nfcTrace,
        },
      });
  };
  getList = () => {
    return Badge.find();
  };
}
