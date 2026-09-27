"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    q: "هل التسجيل مجاني؟",
    a: "نعم. إنشاء حساب لاعب مجاني. بعد التسجيل يمكنك تصفح الملاعب المتاحة وحجز الأوقات وفق ما يعرضه كل ملعب.",
  },
  {
    q: "كيف أكتشف الملاعب؟",
    a: "سجّل الدخول أو أنشئ حسابًا، ثم افتح صفحة الملاعب. استخدم الفلاتر المتاحة (المدينة، النوع، وغيرها) حسب ما يوفّره التطبيق.",
  },
  {
    q: "كيف أتمم الحجز؟",
    a: "اختر ملعبًا ومساحة، حدّد التاريخ والساعة من الجدول، ثم راجع التفاصيل وأكد من صفحة المراجعة في حسابك.",
  },
  {
    q: "هل يمكنني إدارة أو إلغاء الحجوزات؟",
    a: "نعم. من «حجوزاتك» يمكنك عرض الحجوزات وإلغاء ما يسمح به الملعب وفق سياسة الإلغاء المعروضة لكل حجز.",
  },
  {
    q: "ما الرياضات المدعومة؟",
    a: "المنصة تدعم أنواعًا متعددة من المرافق (كرة القدم، بادل، كرة السلة، مسابح، وغيرها حسب التصنيفات في التطبيق). التوفر الفعلي يعتمد على الملاعب في منطقتك.",
  },
] as const;

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line border border-line bg-white">
      {FAQ_ITEMS.map((item, index) => {
        const expanded = open === index;
        return (
          <div key={item.q}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start transition hover:bg-arena-warm/80"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : index)}
            >
              <span className="font-display text-base font-extrabold text-copy-primary md:text-lg">{item.q}</span>
              <ChevronDown
                size={20}
                className={cn("shrink-0 text-copy-secondary transition", expanded && "rotate-180")}
              />
            </button>
            {expanded && <p className="px-5 pb-5 text-sm leading-7 text-copy-secondary">{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
