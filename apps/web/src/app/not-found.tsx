import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-h1">الصفحة غير موجودة</h1>
      <p className="mt-3 text-body">هذه الصفحة غير متاحة.</p>
      <ButtonLink href="/#venues" className="mt-6">
        ابحث عن ملعب
      </ButtonLink>
    </div>
  );
}
