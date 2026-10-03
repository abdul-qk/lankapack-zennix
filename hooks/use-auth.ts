"use client";

import { useAuthContext } from "@/components/auth-provider";
import { USER_LEVELS } from "@/lib/auth-constants";

export function useAuth() {
  const ctx = useAuthContext();
  return {
    ...ctx,
    isAdmin: ctx.user?.userLevel === USER_LEVELS.ADMIN,
  };
}
