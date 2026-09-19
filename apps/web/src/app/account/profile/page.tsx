"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { Button, Field, Input } from "@/components/ui";
import { customerService, userFacingMessage } from "@/lib/api";

function ProfileForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { me, refresh } = useSession();
  const [fullName, setFullName] = useState(me?.fullName ?? "");
  const [phone, setPhone] = useState(me?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(me?.whatsapp ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me) return;
    setFullName(me.fullName);
    setPhone(me.phone ?? "");
    setWhatsapp(me.whatsapp ?? "");
  }, [me]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await customerService.updateProfile({
        fullName,
        phone: phone || null,
        whatsapp: whatsapp || null,
      });
      await refresh();
      toast.success("تم تحديث الملف.");
      const next = search.get("next");
      if (next?.startsWith("/")) router.replace(next);
    } catch (error) {
      toast.error(userFacingMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-8 md:px-6">
      <h1 className="text-h1">الملف الشخصي</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="الاسم">
            <Input required value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </Field>
          <Field label="الهاتف">
            <Input required value={phone} onChange={(event) => setPhone(event.target.value)} />
          </Field>
          <Field label="واتساب">
            <Input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
          </Field>
          <Field label="البريد">
            <Input value={me?.email ?? ""} disabled />
          </Field>
          <Button className="w-full" disabled={saving}>
            {saving ? "جارٍ الحفظ…" : "حفظ الملف"}
          </Button>
        </form>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileForm />
    </Suspense>
  );
}
