"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

function PendingIcon({
  icon,
  className,
  pending,
}: {
  icon: ReactNode;
  className?: string;
  pending: boolean;
}) {
  return pending ? (
    <Loader2 aria-label="Loading" className={`${className ?? "h-4 w-4"} animate-spin`} role="status" />
  ) : icon;
}

export function PendingLink({
  icon,
  children,
  iconClassName,
  onClick,
  ...props
}: ComponentProps<typeof Link> & {
  icon: ReactNode;
  iconClassName?: string;
}) {
  const [pending, setPending] = useState(false);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (!event.defaultPrevented) setPending(true);
  }

  return (
    <Link {...props} onClick={handleClick}>
      <PendingIcon icon={icon} className={iconClassName} pending={pending} />
      {children}
    </Link>
  );
}
