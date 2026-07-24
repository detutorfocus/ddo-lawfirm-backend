// pages/api/trpc/[trpc].ts
import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/context";

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError:
    process.env.NODE_ENV === "development"
      ? ({ path, error }) => console.error(`❌ tRPC error on /${path}:`, error)
      : undefined,
});

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};
