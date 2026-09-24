"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify?email=${encodeURIComponent(email)}`,
        data: { full_name: fullName, account_kind: "OWNER" },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      toast.error("هذا البريد مسجّل مسبقاً. جرّب تسجيل الدخول.");
      router.replace("/login");
      return;
    }
    toast.success("تم إرسال رمز التأكيد إلى بريدك.");
    router.replace(`/verify?email=${encodeURIComponent(email)}`);
  }

  return (
    <AuthFrame title="إنشاء حساب صاحب ملعب" subtitle="جهّز ملعبك خلال دقائق. يمكنك الاستمرار باستقبال الحجوزات عبر الهاتف.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="اسمك">
          <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="البريد الإلكتروني">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="كلمة المرور">
          <Input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button className="w-full" disabled={loading}>
          {loading ? "جاري الإنشاء…" : "إنشاء حساب"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-text-muted">
        لديك حساب؟{" "}
        <Link href="/login" className="font-bold">
          دخول
        </Link>
      </p>
    </AuthFrame>
  );
}
