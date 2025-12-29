import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useSocket } from "../hooks/useSocket";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type Locker = {
  id: number;
  lockerNumber: string;
  status: "open" | "closed" | "claimed";
};
type Lockers = Locker[];
type Badge = {
  id: number;
  name: string;
  role: string;
  trace: string;
};
export default function Admin() {
  const [lockers, setLockers] = useState<Lockers>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [focusedLockerId, setFocusedLockerId] = useState<number | null>(null);
  const focusedLocker = lockers.find((l) => l.id === focusedLockerId) ?? null;
  const focusedLockerRef = useRef<Locker | null>(null);
  const { socket } = useSocket();
  const location = useLocation();
  const [badge, setBadge] = useState<Badge | null>(null);
  const navigate = useNavigate();

  const hFeedback = (data: { locks: Lockers }) => {
    setLockers(data.locks);
    setOpen(false);
    setFocusedLockerId(null);
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("welcome", hFeedback);
    socket.on("open", hFeedback);
    socket.on("close", hFeedback);

    return () => {
      socket.off("welcome", hFeedback);
      socket.off("open", hFeedback);
      socket.off("close", hFeedback);
    };
  }, [socket]);

  useEffect(() => {
    setBadge(location.state);
  }, [location]);

  return (
    <>
      <section>
        <Dialog
          open={open}
          onOpenChange={(open) => {
            if (!open) {
              setFocusedLockerId(null);
              setOpen(false);
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

          <DialogContent className="text-3xl">
            <DialogHeader>
              <DialogTitle>
                Que faire avec le casier {focusedLocker?.lockerNumber} ?
              </DialogTitle>
              <DialogDescription className="text-xl font-bold">
                <button>❌ Visiter</button>
                <button>❌ Libérer</button>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </section>
      <section>
        <button
          onClick={() => {
            if (!socket) return;
            if (!badge) return;

            socket.emit("admin-ask-openAll", {
              locker: null,
              idType: "admin",
              code: badge.trace,
            });
          }}
        >
          ❔ Libérer tous les casiers
        </button>
        {/* <button>❌ Configurer une heure d'ouverture automatique</button> // TODO*/}
        <button
          onClick={() => {
            setBadge(null);
            return navigate("/");
          }}
        >
          🔙 Retourner à l'interface Client
        </button>
      </section>
    </>
  );
}
