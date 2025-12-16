import type { MixedList } from "typeorm";
import { CommandLog } from "./CommandLog";
import { Locker } from "./Locker";
import { Badge } from "./Badge";

// biome-ignore lint/complexity/noBannedTypes: Using same type as TypeORM library
const entities: MixedList<Function> = [CommandLog, Locker, Badge];
export default entities;
