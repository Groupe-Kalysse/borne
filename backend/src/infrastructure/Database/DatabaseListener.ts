import CommBus, { Command } from "../CommBus";
import { Locker } from "./entities/Locker";

export default class DatabaseListener {
  private commandBus: CommBus;

  constructor(commandBus: CommBus) {
    this.commandBus = commandBus;
    this.commandBus.listenEvent("serial-open", this.onLockOpen);
  }

  onError() {
    // TODO Log error to DB
  }

  onLockOpen = async (command: Command) => {
    const locker = command.payload?.locker as number;
    const idType = command.payload?.idType as string;
    const code = command.payload?.code as string;
    const action = command.payload?.action as string;

    const lock = await Locker.findOneByOrFail({ id: locker });
    if (action === "close") {
      if (lock.status === "closed")
        //TODO
        // log bad open tentative
        // fire event
        return;

      lock.status = "closed";
      switch (idType) {
        case "badge":
          lock.unlockBadge = code;
          break;
        case "code":
          lock.unlockCode = code;
          break;
        default:
          //TODO
          // log bad open tentative
          // fire event
          return;
      }
      await lock.save();
      this.commandBus.fireEvent({
        label: "db-ok-close",
        type: "info",
        message: `🏬 Stored the update for locker.id#${locker}`,
      });
    }

    if (action === "open") {
      if (lock.status === "open")
        //TODO
        // log bad open tentative
        // fire event
        return;

      switch (idType) {
        case "badge":
          if (lock.unlockBadge !== code)
            //TODO
            // log bad open tentative
            // fire event
            return;
          break;
        case "code":
          if (lock.unlockCode !== code)
            //TODO
            // log bad open tentative
            // fire event
            return;
          break;
      }
      lock.status = "open";
      lock.unlockBadge = undefined;
      lock.unlockCode = undefined;
      await lock.save();

      this.commandBus.fireEvent({
        label: "db-ok-open",
        type: "info",
        message: `🏬 Stored the update for locker #${locker}`,
      });
    }
  };
}
