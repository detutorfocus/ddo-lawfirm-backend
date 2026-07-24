// src/server/context/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import type { UserRoleType } from "@/lib/constants";

export type TRPCContext = {
  req: NextApiRequest;
  res: NextApiResponse;
  prisma: typeof prisma;
  session: {
    user: {
      id: string;
      email: string;
      role: UserRoleType;
      firstName: string;
      lastName: string;
    };
  } | null;
};

export async function createContext({
  req,
  res,
}: {
  req: NextApiRequest;
  res: NextApiResponse;
}): Promise<TRPCContext> {
  // Dynamically import authOptions to avoid circular dependency
  const { authOptions } = await import("../../../pages/api/auth/[...nextauth]");
  const session = await getServerSession(req, res, authOptions);
  return { req, res, prisma, session: session as TRPCContext["session"] };
}
