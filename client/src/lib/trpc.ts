import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";

// 強制的に型を再定義してgetByLotNumberを認識させる
export const trpc = createTRPCReact<AppRouter>();
