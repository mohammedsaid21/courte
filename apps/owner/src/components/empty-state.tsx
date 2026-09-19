import { ButtonLink } from "./ui";

export function EmptyState({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
      <h2 className="text-2xl font-black text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">{body}</p>
      {href && action && (
        <ButtonLink href={href} className="mt-6" size="md">
          {action}
        </ButtonLink>
      )}
    </div>
  );
}
