"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("تعذر تحديث كلمة المرور. اطلب رابطًا جديدًا ثم حاول مرة أخرى.");
      return;
    }
    toast.success("تم تحديث كلمة المرور.");
    router.replace("/account/bookings");
  }

  return (
    <AuthFrame title="كلمة مرور جديدة" subtitle="أدخل كلمة مرور جديدة لحسابك في ميدان.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="كلمة المرور الجديدة">
          <Input type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <Button className="w-full" disabled={loading}>
          {loading ? "جارٍ الحفظ…" : "تحديث كلمة المرور"}
        </Button>
      </form>
    </AuthFrame>
  );
}
