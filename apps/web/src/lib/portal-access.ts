import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { customerService, type Me } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

/** Returns false when the session was cleared and the user was sent away. */
export async function blockOwnerAccountFromPlayerPortal(
  router: AppRouterInstance,
  profile?: Me,
): Promise<boolean> {
  const me = profile ?? (await customerService.me());
  if (me.accountKind !== "OWNER") {
    return true;
  }
  await createClient().auth.signOut();
  router.replace("/player-only");
  return false;
}
