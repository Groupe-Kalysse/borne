import CommBus, { Command } from "../CommBus";

export default class MockSerial {
  private commandBus: CommBus;

  constructor(commandBus: CommBus) {
    this.commandBus = commandBus;
    this.commandBus.listenEvent("locker-open", this.unlock);
    this.commandBus.listenEvent("locker-admin-open", this.unlock);
    this.commandBus.listenEvent("locker-status", this.status);
  }

  unlock = ({ payload }: Command) => {
    const num = payload?.num as number;
    this.commandBus.fireEvent({
      label: "serial-open",
      type: "info",
      message: `🪛 Opened lock#${num} via MockSerial `,
      payload: {},
    });
  };
  status = (_command?: Command) => {
    this.commandBus.fireEvent({
      label: "serial-status",
      type: "info",
      message: `👁️ Updated status from MockSerial: -1 locks closed`,
      payload: {},
    });
  };
}
