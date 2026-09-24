"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input } from "@/components/ui";
import { customerService } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const PENDING_KEY = "courte.pending-signup";

async function finishSignup(next: string) {
  const raw = sessionStorage.getItem(PENDING_KEY);
  if (raw) {
    try {
      const pending = JSON.parse(raw) as { fullName?: string; phone?: string };
      if (pending.fullName || pending.phone) {
        await customerService.updateProfile({
          fullName: pending.fullName || "لاعب",
          phone: pending.phone || null,
        });
      }
    } catch {
      // Profile can be completed later.
    }
    sessionStorage.removeItem(PENDING_KEY);
  }
  return next.startsWith("/") ? next : "/account/bookings";
}

function VerifyForm() {
  const router = useRouter();
  const search = useSearchParams();
  const email = search.get("email") ?? "";
  const next = search.get("next") || "/account/bookings";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const tokenHash = search.get("token_hash");
    const type = search.get("type");
    if (!tokenHash) return;
    void (async () => {
      setLoading(true);
      const { error } = await createClient().auth.verifyOtp({
        token_hash: tokenHash,
        type: type === "signup" || type === "email" ? type : "signup",
      });
      setLoading(false);
      if (error) {
        toast.error("رابط التأكيد غير صالح. أدخل الرمز يدوياً.");
        return;
      }
      toast.success("تم تأكيد الحساب.");
      router.replace(await finishSignup(next));
    })();
  }, [next, router, search]);

  async function verify(token: string, otpType: "signup" | "email") {
    return createClient().auth.verifyOtp({
      email,
      token,
      type: otpType,
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email) {
      toast.error("أدخل بريدك من صفحة إنشاء الحساب.");
      return;
    }
    setLoading(true);
    const token = code.trim();
    let { error } = await verify(token, "signup");
    if (error) {
      ({ error } = await verify(token, "email"));
    }
    setLoading(false);
    if (error) {
      toast.error("الرمز غير صحيح أو منتهٍ. جرّب مرة أخرى.");
      return;
    }
    toast.success("تم تأكيد الحساب.");
    router.replace(await finishSignup(next));
  }

  async function resend() {
    if (!email) return;
    setResending(true);
    const { error } = await createClient().auth.resend({ type: "signup", email });
    setResending(false);
    if (error) {
      toast.error("تعذر إعادة إرسال الرمز.");
      return;
    }
    toast.success("أرسلنا رمزاً جديداً إلى بريدك.");
  }

  return (
    <AuthFrame title="تحقق من بريدك" subtitle={email ? `أدخل الرمز المرسل إلى ${email}` : "أدخل رمز التأكيد الذي وصلك على البريد."}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="رمز التأكيد">
          <Input
            required
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl font-black tracking-[0.4em]"
            placeholder="000000"
          />
        </Field>
        <Button className="w-full" disabled={loading || code.length < 6}>
          {loading ? "جارٍ التحقق…" : "تأكيد الحساب"}
        </Button>
      </form>
      <button
        type="button"
        className="mt-4 text-sm font-bold"
        disabled={resending || !email}
        onClick={() => void resend()}
      >
        {resending ? "جارٍ الإرسال…" : "إعادة إرسال الرمز"}
      </button>
      <p className="mt-6 text-sm text-text-muted">
        رجوع إلى{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-bold">
          إنشاء الحساب
        </Link>
      </p>
    </AuthFrame>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<AuthFrame title="تحقق من بريدك" subtitle="جارٍ التحميل…">{null}</AuthFrame>}>
      <VerifyForm />
    </Suspense>
  );
}
