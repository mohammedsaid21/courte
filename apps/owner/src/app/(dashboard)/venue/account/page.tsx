"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useVenue } from "@/components/venue-provider";
import { Button, Card, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { ownerApi } from "@/lib/api";

export default function AccountPage() {
  const { me, refresh } = useVenue();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (!me) return;
    setFullName(me.fullName);
    setPhone(me.phone ?? "");
  }, [me]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    await ownerApi.updateMe({ fullName, phone: phone || null });
    await refresh();
    toast.success("تم تحديث الملف");
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("تم تحديث كلمة المرور");
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-lg font-black text-slate-900">ملف صاحب الملعب</h2>
        <p className="mb-5 mt-1 text-sm font-medium text-slate-500">يظهر على الحجوزات التي تنشئها وفي بيانات التواصل.</p>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveProfile}>
          <Field label="الاسم"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
          <Field label="الهاتف"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="البريد"><Input value={me?.email ?? ""} disabled /></Field>
          <div className="flex items-end"><Button>حفظ الملف</Button></div>
        </form>
      </Card>
      <Card>
        <h2 className="text-lg font-black text-slate-900">كلمة المرور</h2>
        <p className="mb-5 mt-1 text-sm font-medium text-slate-500">استخدم 8 أحرف على الأقل. هذا يغيّر دخول صاحب الملعب فقط.</p>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={savePassword}>
          <Field label="كلمة مرور جديدة">
            <Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="تأكيد كلمة المرور">
            <Input type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <Button disabled={!password}>تحديث كلمة المرور</Button>
        </form>
      </Card>
    </div>
  );
}
