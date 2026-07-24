// src/hooks/useAuth.ts
// ── Authentication hook — session, role checks, redirect helpers
//
// !! IMPORTANT: Do NOT import UserRole from @prisma/client here.
//    @prisma/client is a Node.js server-only package. Importing it in
//    a client-side hook causes "Cannot read properties of undefined"
//    because Prisma enums are undefined in the browser.
//    Use USER_ROLES from @/lib/constants instead — plain string literals.

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { USER_ROLES, type UserRoleType } from "@/lib/constants";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading      = status === "loading";
  const isAuthenticated = status === "authenticated";
  const user           = session?.user;

  // Role checks — compare against plain string literals, never Prisma enums
  const isAdmin  = user?.role === USER_ROLES.ADMIN;
  const isLawyer = user?.role === USER_ROLES.LAWYER || isAdmin;
  const isClient = user?.role === USER_ROLES.CLIENT;

  /** Redirect to login if not authenticated */
  const requireAuth = useCallback(
    (redirectTo = "/login") => {
      if (!isLoading && !isAuthenticated) {
        router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(router.asPath)}`);
      }
    },
    [isLoading, isAuthenticated, router]
  );

  /** Redirect to /unauthorized if user doesn't have the required role */
  const requireRole = useCallback(
    (role: UserRoleType, redirectTo = "/unauthorized") => {
      if (!isLoading && user?.role !== role && !isAdmin) {
        router.push(redirectTo);
      }
    },
    [isLoading, user, isAdmin, router]
  );

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: "/" });
  }, []);

  const login = useCallback(
    async (email: string, password: string, totpCode?: string) => {
      return signIn("credentials", {
        email,
        password,
        totpCode: totpCode ?? "",
        redirect: false,
      });
    },
    []
  );

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    isAdmin,
    isLawyer,
    isClient,
    requireAuth,
    requireRole,
    logout,
    login,
  };
}
