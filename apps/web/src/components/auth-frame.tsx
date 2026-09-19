import { Wordmark } from "@/components/wordmark";

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
    <div className="mx-auto max-w-md px-4 py-12">
      <Wordmark />
      <div className="glass mt-8 rounded-[12px] p-6">
        <h1 className="text-h1">{title}</h1>
        <p className="mt-2 text-body">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
