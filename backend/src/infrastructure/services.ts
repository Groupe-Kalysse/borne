import newBadgeCollection from "./BadgeCollection";
import CommBus from "./CommBus";
import newLocker from "./Locker";
import newNfcReader from "./NfcReader";
import newSerialHandler from "./SerialComm";
import SocketServer from "./SocketServer";
import express from "express";
import { createServer } from "http";
import apiRoutes from "./Api/routes";
import { dataSource } from "./Database/dataSource";
import DatabaseListener from "./Database/DatabaseListener";

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
