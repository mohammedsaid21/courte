import { Calendar, Check, MapPin, Search } from "lucide-react";

const FLOW = [
  { step: "1", label: "اكتشف", active: true },
  { step: "2", label: "التاريخ", active: true },
  { step: "3", label: "الوقت", active: true },
  { step: "4", label: "مراجعة", active: false },
] as const;

/** Static product preview — sample data only. */
export function BookingPreview() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2 md:gap-3" aria-hidden="true">
        {FLOW.map((item, index) => (
          <div key={item.step} className="flex items-center gap-2">
            <span
              className={
                item.active
                  ? "flex h-8 w-8 items-center justify-center bg-arena text-xs font-black text-arena-stadium"
                  : "flex h-8 w-8 items-center justify-center border border-line text-xs font-bold text-copy-secondary"
              }
            >
              {item.step}
            </span>
            <span className="text-xs font-bold text-copy-secondary">{item.label}</span>
            {index < FLOW.length - 1 && <span className="hidden h-px w-6 bg-line md:block" />}
          </div>
        ))}
      </div>

      <div className="overflow-hidden border border-line bg-white shadow-[0_20px_60px_rgba(7,19,13,0.08)]">
        <div className="flex items-center justify-between border-b border-line bg-arena-warm px-4 py-3">
          <span className="text-xs font-black uppercase tracking-wider text-copy-secondary">معاينة المنتج</span>
          <span className="bg-arena-pitch px-2 py-0.5 text-[10px] font-bold text-arena-lime">بيانات تجريبية</span>
        </div>
        <div className="grid md:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b border-line p-5 md:border-b-0 md:border-e">
            <div className="flex items-center gap-2 border border-line bg-white px-3 py-2.5">
              <Search size={16} className="text-copy-secondary" />
              <span className="text-sm font-semibold text-copy-secondary">ابحث عن ملعب…</span>
            </div>
            <ul className="mt-4 space-y-3">
              {[
                { name: "مرفق أ", area: "منطقة ١", price: "—" },
                { name: "مرفق ب", area: "منطقة ٢", price: "—" },
              ].map((row, i) => (
                <li
                  key={row.name}
                  className={`flex items-center justify-between gap-3 border p-3 ${i === 0 ? "border-arena bg-arena/5" : "border-line"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 bg-arena-pitch" />
                    <div>
                      <div className="font-bold text-copy-primary">{row.name}</div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-copy-secondary">
                        <MapPin size={12} />
                        {row.area}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-arena-warm p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-copy-secondary">
              <Calendar size={14} />
              اختيار الوقت
            </div>
            <p className="mt-2 font-display text-lg font-extrabold text-copy-primary">يوم تجريبي · 18:00–19:00</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map((slot, index) => (
                <span
                  key={slot}
                  className={
                    index === 1
                      ? "py-2 text-center text-xs font-black bg-arena-deep text-white"
                      : "border border-line bg-white py-2 text-center text-xs font-bold text-copy-primary"
                  }
                >
                  {slot}
                </span>
              ))}
            </div>
            <div className="mt-5 border border-line bg-white p-3">
              <div className="flex items-center justify-between text-sm font-black text-arena-deep">
                <span>جاهز للمراجعة</span>
                <Check size={18} className="text-arena" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-sm font-semibold text-copy-secondary">
        بعد إنشاء حسابك تصل إلى الملاعب والأوقات الفعلية من التطبيق.
      </p>
    </div>
  );
}
