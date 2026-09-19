"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input } from "@/components/ui";
import { customerService } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

function SignupForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/account/bookings";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone, account_kind: "CUSTOMER" } },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message.includes("already") ? "يوجد حساب بهذا البريد. جرّب الدخول." : "تعذر إنشاء الحساب.");
      return;
    }
    if (data.session) {
      try {
        await customerService.updateProfile({ fullName, phone });
      } catch {
        // Profile can be completed after sign-in if confirmation is required.
      }
      router.replace(next.startsWith("/") ? next : "/account/bookings");
      return;
    }
    setLoading(false);
    toast.success("تم إنشاء الحساب. إذا كان التأكيد مطلوبًا، راجع بريدك ثم ادخل.");
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }

  return (
    <AuthFrame title="أنشئ حسابك" subtitle="احجز ملاعب الضفة بحساب واحد.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="الاسم">
          <Input required value={fullName} onChange={(event) => setFullName(event.target.value)} />
        </Field>
        <Field label="الهاتف">
          <Input required value={phone} onChange={(event) => setPhone(event.target.value)} />
        </Field>
        <Field label="البريد">
          <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="كلمة المرور">
          <Input type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <Button className="w-full" disabled={loading}>
          {loading ? "جارٍ الإنشاء…" : "إنشاء حساب"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-text-muted">
        لديك حساب؟{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold">
          دخول
        </Link>
      </p>
    </AuthFrame>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFrame title="أنشئ حسابك" subtitle="جارٍ التحميل…">{null}</AuthFrame>}>
      <SignupForm />
    </Suspense>
  );
}
