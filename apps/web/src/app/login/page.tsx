"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/account/bookings";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("البريد أو كلمة المرور غير صحيحة.");
      return;
    }
    router.replace(next.startsWith("/") ? next : "/account/bookings");
  }

  return (
    <AuthFrame title="دخول" subtitle="سجّل بحسابك لحجز الملاعب ومتابعة حجوزاتك.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="البريد">
          <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="كلمة المرور">
          <Input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <Button className="w-full" disabled={loading}>
          {loading ? "جارٍ الدخول…" : "دخول"}
        </Button>
      </form>
      <p className="mt-4 text-sm">
        <Link href="/forgot-password" className="font-bold">
          نسيت كلمة المرور؟
        </Link>
      </p>
      <p className="mt-6 text-sm text-text-muted">
        جديد هنا؟{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-bold">
          أنشئ حسابًا
        </Link>
      </p>
    </AuthFrame>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFrame title="دخول" subtitle="جارٍ التحميل…">{null}</AuthFrame>}>
      <LoginForm />
    </Suspense>
  );
}
