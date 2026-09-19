"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      router.replace("/home");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame title="دخول كورت" subtitle="أدِر ملاعبك، ساعاتك، وحجوزاتك من مكان واحد.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="البريد الإلكتروني">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="كلمة المرور">
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button className="w-full" disabled={loading}>
          {loading ? "جاري الدخول…" : "دخول"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-text-muted">
        صاحب ملعب جديد؟{" "}
        <Link href="/signup" className="font-bold">
          أنشئ حساباً
        </Link>
      </p>
    </AuthFrame>
  );
}
