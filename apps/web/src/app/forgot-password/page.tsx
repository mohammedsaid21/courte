"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("تعذر إرسال رسالة إعادة التعيين. تحقق من البريد وحاول مرة أخرى.");
      return;
    }
    toast.success("إذا كان هناك حساب بهذا البريد، ستصلك رسالة لإعادة التعيين.");
  }

  return (
    <AuthFrame title="نسيت كلمة المرور" subtitle="سنرسل لك رابطًا لاختيار كلمة مرور جديدة.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="البريد">
          <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Button className="w-full" disabled={loading}>
          {loading ? "جارٍ الإرسال…" : "أرسل رابط التعيين"}
        </Button>
      </form>
    </AuthFrame>
  );
}
