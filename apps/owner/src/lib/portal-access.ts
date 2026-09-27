import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ownerApi, type Me } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

/** Returns false when the session was cleared and the user was sent away. */
export async function blockPlayerAccountFromOwnerPortal(
  router: AppRouterInstance,
  profile?: Me,
): Promise<boolean> {
  const me = profile ?? (await ownerApi.me());
  if (me.accountKind !== "CUSTOMER") {
    return true;
  }
  await createClient().auth.signOut();
  router.replace("/owner-only");
  return false;
}
