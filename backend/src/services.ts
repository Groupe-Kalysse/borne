import newBadgeCollection from "./infrastructure/BadgeCollection";
import CommBus from "./infrastructure/CommBus";
import newLocker from "./infrastructure/Locker";
import newNfcReader from "./infrastructure/NfcReader";
import newSerialHandler from "./infrastructure/SerialComm";
import SocketServer from "./infrastructure/SocketServer";
import express from "express";
import { createServer } from "http";
import apiRoutes from "./infrastructure/Api/routes";
import { dataSource } from "./infrastructure/Database/dataSource";
import DatabaseListener from "./infrastructure/Database/DatabaseListener";

const app = express();
const httpServer = createServer(app);

let servicesPromise: ReturnType<typeof initAll> | null = null;

async function initAll() {
  await dataSource.initialize();
  app.use(express.json());
  app.use("/api", apiRoutes);

  const commBus = new CommBus();
  const socketServer = new SocketServer(httpServer, commBus);

  return {
    commBus,
    nfc: newNfcReader(commBus),
    serial: newSerialHandler(commBus),
    locker: newLocker(commBus),
    badges: newBadgeCollection(commBus),
    socket: socketServer,
    http: httpServer,
    dbListener: new DatabaseListener(commBus),
  };
}

export default function getServices() {
  if (!servicesPromise) {
    servicesPromise = initAll();
  }
  return servicesPromise;
}
