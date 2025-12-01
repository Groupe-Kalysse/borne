import { Server } from "socket.io";
import CommBus, { Command } from "../CommBus";
import { Locker } from "../Database/entities/Locker";

class SocketServer {
  public io: Server;
  private commandBus: CommBus;

  constructor(httpServer: any, commandBus: CommBus) {
    this.commandBus = commandBus;
    this.initialize(httpServer);
    // this.commandBus.listenEvent("locker-claim", this.onClaim);
    // this.commandBus.listenEvent("locker-free", this.onFree);
    //this.commandBus.listenEvent("locker-close", this.onLock);
    // this.commandBus.listenEvent("locker-open", this.onUnlock);

    this.commandBus.listenEvent("nfc-hit", this.onBadge);
    this.commandBus.listenEvent("db-ok-close", this.onLock);
    this.commandBus.listenEvent("db-ok-open", this.onUnlock);
  }
  initialize(httpServer: any) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      path: "/socket.io/",
      transports: ["websocket"],
    });
    this.io.on("connection", async (socket) => {
      const locks = await Locker.find();
      socket.emit("welcome", { locks });
      this.commandBus.fireEvent({
        label: "socket-login",
        type: "info",
        message: `🟢 Client connecté :${socket.id}`,
      });

      socket.on("ask-close", (data) =>
        this.commandBus.fireEvent({
          label: "socket-ask-close",
          type: "info",
          message: `🔒:Frontend asked to close a locker`,
          payload: data,
        })
      );

      socket.on("ask-open", (data) =>
        this.commandBus.fireEvent({
          label: "socket-ask-open",
          type: "info",
          message: `🔒:Frontend asked to open a locker`,
          payload: data,
        })
      );

      socket.on("disconnect", () =>
        this.commandBus.fireEvent({
          label: "socket-logoff",
          type: "info",
          message: `🔴 Client déconnecté :${socket.id}`,
        })
      );
    });
  }

  onLock = async () => {
    const locks = await Locker.find();
    this.io.emit("close", { locks });
  };
  onUnlock = async () => {
    const locks = await Locker.find();
    this.io.emit("open", { locks });
  };
  onBadge = (command: Command) => {
    this.io.emit("badge", command.payload);
  };
}

export default SocketServer;
