import { SerialPort } from "serialport";
import CommBus, { Command } from "../CommBus";

export class Cu16Serial {
  // CU-dependant
  private codeStart = 0x02;
  private codeOpening = 0x31;
  private codeResponseStatus = 0x35;
  private codeEnd = 0x03;
  private baudRate = 19200;

  // Setup physique, dépend du branchement CU-borne
  private serialPath = "/dev/ttyUSB0";

  // Config
  private dataTimeout = 300;

  private commandBus: CommBus;
  private portHandle: SerialPort;
  private lastMsgFromCU = new Uint8Array();
  private dataFlag: NodeJS.Timeout;

  constructor(commandBus: CommBus) {
    this.commandBus = commandBus;
    this.portHandle = new SerialPort({
      path: this.serialPath,
      baudRate: this.baudRate,
    });
    this.portHandle.on("data", this.onDataChunk);

    this.commandBus.listenEvent("locker-open", this.unlock);
    this.commandBus.listenEvent("locker-admin-open", this.unlock);
    this.commandBus.listenEvent("locker-close", this.unlock);
    this.commandBus.listenEvent("locker-status", this.status);

    this.commandBus.listenEvent("locker-ask-close", this.unlock);
  }
  unlock = (command: Command) => {
    const locker = command.payload?.locker;
    const idType = command.payload?.idType;
    const code = command.payload?.code;
    const action = command.payload?.action;

    //FIX ⚠️ .locker devrait être .port
    const num = command.payload?.locker as number;
    const commandToSerial = this.buildCommand("open", num);
    this.send(commandToSerial);
    this.commandBus.fireEvent({
      label: "serial-open",
      type: "info",
      message: `🪛 Opened lock#${num} via cu16Serial `,
      payload: {
        locker,
        idType,
        code,
        action,
      },
    });
  };
  status = (_command?: Command) => {
    const commandToSerial = this.buildCommand("getStatus");
    this.send(commandToSerial);
  };

  buildCommand = (command: "open" | "getStatus", slot: number = 0) => {
    let commandCode;
    switch (command) {
      case "open":
        commandCode = this.codeOpening;
        break;
      case "getStatus":
        commandCode = this.codeResponseStatus;
        break;
    }

    const message = [
      this.codeStart,
      slot, // 0x30 for broadcast,
      commandCode,
      this.codeEnd,
    ];

    message.push(this.checksum(...message));
    return message;
  };

  checksum = (...values: number[]) => {
    return values.reduce((acc, val) => acc + val, 0);
  };

  onData = (data: Uint8Array<ArrayBuffer>) => {
    let values: Number[] = [];
    for (let i = 3; i < data.length - 4; i++) values.push(data[i]);
    const locksStatusBits = values
      // number -> octets en string (ex: ["00101010", "10011001"])
      .map((byte) => byte.toString(2).padStart(8, "0"))
      // remettre les octets dans le bon ordre pour la lecture (ex: ["10011001","00101010"])
      .reverse()
      // joindre les octets (ex: "1001100100101010")
      .join("")
      // séparer les bits (ex: ["1","0","0",...])
      .split("")
      .reverse();

    const closedLockers = locksStatusBits.reduce((acc, bit, index) => {
      if (bit === "0") return acc;
      return [...acc, index + 1];
    }, new Array());

    this.commandBus.fireEvent({
      label: "serial-status",
      type: "info",
      message: `👁️ Updated status from cu16Serial: ${closedLockers.length} locks closed`,
    });
  };

  send = (data: number[]) => {
    this.portHandle.write(data, (err) => {
      if (err) {
        throw err;
      }
    });
  };

  onDataChunk = (data: Uint8Array<ArrayBuffer>) => {
    if (!this.lastMsgFromCU) this.lastMsgFromCU = data;
    else {
      let tmp = new Uint8Array(this.lastMsgFromCU.byteLength + data.byteLength);
      tmp.set(new Uint8Array(this.lastMsgFromCU), 0);
      tmp.set(new Uint8Array(data), this.lastMsgFromCU.byteLength);
      this.lastMsgFromCU = tmp;
    }

    // Si this.dataTimeout ms passent sans nouveau paquet, considérer le message comme complet
    if (this.dataFlag) {
      clearTimeout(this.dataFlag);
    }
    this.dataFlag = setTimeout(() => {
      this.onData(this.lastMsgFromCU);
      this.lastMsgFromCU = new Uint8Array();
    }, this.dataTimeout);
  };
}
