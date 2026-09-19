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
    <div className="py-16 text-center">
      <h2 className="text-h2">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-body">{body}</p>
      {href && action && (
        <ButtonLink href={href} className="mt-6" size="md">
          {action}
        </ButtonLink>
      )}
    </div>
  );
}
