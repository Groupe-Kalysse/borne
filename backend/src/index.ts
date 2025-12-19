import "reflect-metadata";
import getServices from "./infrastructure/services";

const PORT = 3001;

getServices()
  .then((services) => {
    services.http.listen(PORT, async () => {
      services.socket.io.emit("init", { msg: "Server initialized" });
      console.info(`🚀 Serveur en écoute sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error during initialization:", err);
  });
