import { Locker } from "./infrastructure/Database/entities/Locker";
import getServices from "./infrastructure/services";

getServices().then((services) => {
  console.log(Locker.find());
  services.serial.status();
});
