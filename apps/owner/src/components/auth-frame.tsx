export function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="text-4xl font-black italic tracking-tight">COURTE<span className="text-brand">.</span></div>
          <p className="mt-2 text-[11px] font-black text-slate-400">تشغيل الملعب</p>
        </div>
        <div>
          <p className="max-w-lg font-display text-5xl font-black leading-[1.15] tracking-tight">
            شغّل يومك. خلّي الملعب مليان.
          </p>
          <p className="mt-5 max-w-md text-base font-medium text-slate-300">
            الحجوزات، الساعات، والعملاء في مكان واحد — مصمم للملاعب الرياضية.
          </p>
        </div>
        <div className="text-sm font-bold text-slate-500">رام الله · نابلس · الخليل · بيت لحم · جنين</div>
      </div>
      <div className="flex items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 lg:hidden">
            <div className="text-3xl font-black italic tracking-tight">COURTE<span className="text-brand">.</span></div>
            <p className="mt-1 text-[11px] font-black text-slate-400">تشغيل الملعب</p>
          </div>
          <div className="h-1.5 w-12 rounded-full bg-brand" />
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
