import lockers from "../../config/lockers.json";
import CommBus, { Command } from "../CommBus";
import { dataSource } from "../Database/dataSource";
import { Locker } from "../Database/entities/Locker";

// type LockerType = {
//   id: number;
//   lockerNumber: string;
//   status: string;
//   unlockBadge?: string;
//   unlockCode?: string;
// };
export class JsonLocker {
  private commandBus: CommBus;
  // private state: LockerType[];

  constructor(commandBus: CommBus) {
    this.commandBus = commandBus;
    this.initialize();
  }

  async initialize() {
    const repo = dataSource.getRepository(Locker);

    const newLockers = Locker.create(
      lockers.map((locker) => ({
        lockerNumber: locker.label,
        status: "open",
        port: locker.port,
      }))
    );
    await repo.save(newLockers);
    this.openAllLocks();
    this.commandBus.listenEvent("serial-status", this.onUpdatedStatus);
    this.commandBus.listenEvent("api-openAll", this.openAllLocks);
    this.commandBus.listenEvent("web-asked-open", this.openLock);
    this.commandBus.listenEvent("web-asked-close", this.closeLock);

    this.commandBus.listenEvent("socket-ask-close", this.closeLock);
    this.commandBus.listenEvent("socket-ask-open", this.openLock);
  }

  onBadge(): void | Promise<void> {}
  onUpdatedStatus() {}

  closeLock = async (command: Command) => {
    const locker = command.payload?.locker;
    const idType = command.payload?.idType;
    const code = command.payload?.code;

    const lockers = await Locker.find();

    const lock = lockers.find((candidate) => candidate.id === locker); //TODO Fix this, unreadable
    if (!lock) return;

    this.commandBus.fireEvent({
      label: "locker-ask-close", //"locker-close",
      type: "info",
      message: `🔒 Ask locking lock ${lock.lockerNumber}`,
      payload: {
        locker,
        idType,
        code,
        action: "close",
      },
    });
  };

  openLock = async (command: Command) => {
    const locker = command.payload?.locker;
    const idType = command.payload?.idType;
    const code = command.payload?.code;

    const lockers = await Locker.find();

    const lock = lockers.find((candidate) => candidate.id === locker); //TODO Fix this, unreadable
    if (!lock) return;
    if (idType === "badge" && code !== lock.unlockBadge) return;


    this.commandBus.fireEvent({
      label: "locker-open",
      type: "info",
      message: `🔓Ask unlocking lock ${lock.lockerNumber}`,
      payload: {
        locker,
        idType,
        code,
        action: "open",
      },
    });
  };
  openAllLocks = async () => {
    const lockers = await Locker.find();

    for (let i = 1; i <= lockers.length; i++) {
      setTimeout(() => {
        this.openLock({
          label: "irrelevant-internal-event",
          message: "This is a bandaid to spare time, plz fix",
          type: "warning",
          payload: { id: i },
        });
      }, i * 1000);
    }
  };
}
