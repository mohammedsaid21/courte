import { ButtonLink } from "@/components/ui";

export default function VenueNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-h1">الملعب غير موجود</h1>
      <p className="mt-3 text-body">هذا الملعب غير منشور، أو الرابط غير صحيح.</p>
      <ButtonLink href="/venues" className="mt-6">
        ابحث عن ملعب
      </ButtonLink>
    </div>
  );
}
