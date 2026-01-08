import { useEffect, useRef, useState } from "react";
import "./LockerStatus.css";
import "./LockerStatus_Layout.css";
import { useSocket } from "../hooks/useSocket";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { LuArrowDown, LuTrash2 } from "react-icons/lu";
import rfidLogo from "/RFID.svg";
import pinLogo from "/keypad.svg";
import { useNavigate } from "react-router-dom";

type Locker = {
  id: number;
  lockerNumber: string;
  status: "open" | "closed" | "claimed";
};
type Lockers = Locker[];
function LockerStatus() {
  const [lockers, setLockers] = useState<Lockers>([]);
  const [pin, setPin] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [focusedLockerId, setFocusedLockerId] = useState<number | null>(null);
  const focusedLocker = lockers.find((l) => l.id === focusedLockerId) ?? null;
  const focusedLockerRef = useRef<Locker | null>(null);
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [prefferredMode, setMode]=useState<string|null>(null)

  const hFeedback = (data: { locks: Lockers }) => {
    setLockers(data.locks);
    setOpen(false);
    setFocusedLockerId(null);
  };
  const hNumber = (num: string) => {
    setPin(pin + num);
  };

  const hBadge = async ({ data }) => {
    if (!socket) return;

    if (data.role === "STAFF") {
      return navigate("/admin", { state: data });
    }
    if (focusedLockerRef.current === null) {
      return;
    }

    if (focusedLockerRef.current.status === "open") {
      socket.emit("ask-close", {
        locker: focusedLockerRef.current.id,
        idType: "badge",
        code: data.trace,
      });
    }

    if (focusedLockerRef.current.status === "closed") {
      socket.emit("ask-open", {
        locker: focusedLockerRef.current.id,
        idType: "badge",
        code: data.trace,
      });
    }
  };

  useEffect(() => {
    if (!socket) return;
    if (!focusedLockerRef.current) return; //TODO si pas de casier focus, check badges admin ?

    if (focusedLockerRef.current.status === "open") {
      if (pin.length !== 8) return;
      if (pin.substring(0, 4) !== pin.substring(4, 8)) return setPin("");
      socket.emit("ask-close", {
        locker: focusedLockerRef.current.id,
        idType: "code",
        code: pin.substring(0, 4),
      });
    }
    if (focusedLockerRef.current.status === "closed") {
      if (pin.length !== 4) return;
      socket.emit("ask-open", {
        locker: focusedLockerRef.current.id,
        idType: "code",
        code: pin.substring(0, 4),
      });
    }
    setOpen(false);
    setFocusedLockerId(null);
  }, [pin]);

  useEffect(() => {
    focusedLockerRef.current = focusedLocker;
  }, [focusedLocker]);

  useEffect(() => {
    setPin("");
  }, [open]);

  useEffect(() => {
    if (!socket) return;

    socket.on("welcome", hFeedback);
    socket.on("open", hFeedback);
    socket.on("close", hFeedback);
    socket.on("badge", hBadge);

    return () => {
      socket.off("welcome", hFeedback);
      socket.off("open", hFeedback);
      socket.off("close", hFeedback);
      socket.off("badge", hBadge);
    };
  }, [socket]);

  if (!lockers) return <p>Status loading...</p>;

  if (!isConnected)
    return (
      <>
        <h2>❌ Contact rompu avec les casiers</h2>
        <ul>
          <li>Merci de prendre contact avec un responsable</li>
          <li>Pour tout renseignement complémentaire, contacter Kalysse</li>
        </ul>
      </>
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setFocusedLockerId(null);
          setOpen(false);
          setMode(null)
        }
      }}
    >
      <ul className="container">
        {lockers.map((locker) => {
          return (
            <DialogTrigger
              key={locker.id}
              asChild
              onClick={async () => {
                setFocusedLockerId(locker.id);
                setOpen(true);
              }}
            >
              <li
                className={`${locker.status} ${
                  focusedLocker?.id === locker.id && "claimed"
                } ${locker.lockerNumber}`}
              >
                {locker.lockerNumber}
              </li>
            </DialogTrigger>
          );
        })}
        <li className="Terminal" />
      </ul>
      <p>
        <span className="blue">Libre</span> -{" "}
        <span className="orange">En réservation</span> -{" "}
        <span className="red">Occupé</span>
      </p>
      <section>
        <h2>✅ Borne en attente d'instructions</h2>
        <ul>
          <li>Cliquer sur un casier bleu pour le réserver</li>
          <li>
            Cliquer sur un casier rouge préalablement réservé pour le libérer
          </li>
        </ul>
      </section>

      <DialogContent className="h-[90vh] min-w-[90vw] text-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center">
            {focusedLocker?.status === "closed" ? "Ouvrir" : "Verrouiller"} le
            casier {focusedLocker?.lockerNumber}
          </DialogTitle>
          <DialogDescription className="text-xl font-bold">
            {!prefferredMode && <><p className="flex items-center justify-center text-2xl">Choisissez votre mode d'identification:</p>
              <div className="flex items-center justify-center switch-mode gap-4 pt-16">
                <Button className="text-gray-500 flex-1 h-100 bg-blue-600 text-2xl flex-col" onClick={()=>{setMode("code")}}>
                  <p>PIN 4 chiffres</p>
                  <img src={pinLogo} className="w-1/3" />
                </Button>
                <Button className="text-gray-500 flex-1 h-100 bg-blue-600 text-2xl flex-col" onClick={()=>{setMode("badge")}}>
                  Badge
                  <img src={rfidLogo} className="w-1/3" />
                </Button>
              </div></>}
            
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center sm:justify-center ">
          {prefferredMode==="code" && <div className="w-5/10">
            <div className="">
              {pin.length<4 && <>
                <p className="flex text-xl items-center justify-center">Choisissez votre code (4 chiffres)</p>
                <p
                className="flex items-center justify-center m-2 p-1 border-2 border-black border-green-600 && text-green-600 h-12"
              >
                {pin.substring(0, 4).replace(/./g, "* ")}
              </p>
</>}              
              {pin.length>=4 && <><p className="flex text-xl items-center justify-center font-bold text-red-600">Confirmez votre code</p>
              <p
                className="flex items-center justify-center m-2 p-1 border-2 border-black border-red-600 && text-red-600 h-12"
              >
                {pin.substring(4, 8).replace(/./g, "* ")}
              </p></>}
              &nbsp;
              {focusedLocker?.status === "open" && pin.length >= 4 && (
                <div className="w-40 text-red-600">
                  
                </div>
              )}
            </div>
            <div className="flex flex-wrap flex-1 gap-3 text-5xl justify-evenly bg-gray-300 p-4">
              {"1234567890".split("").map((num) => (
                <Button
                  className="aspect-square text-grey-600 "
                  key={num}
                  onClick={(evt) => {
                    evt.preventDefault();
                    hNumber(num);
                  }}
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="destructive"
                className="aspect-square"
                onClick={(evt) => {
                  evt.preventDefault();
                  setPin("");
                }}
              >
                <LuTrash2 className="size-8 text-red-400" />
              </Button>
            </div>
          </div>}
          {prefferredMode==="badge" && <div className="flex flex-col flex-1 justify-center items-center text-9xl">
            <img src={rfidLogo} className="w-1/2" />
            <LuArrowDown className="text-8xl text-gray-400" />
          </div>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LockerStatus;
