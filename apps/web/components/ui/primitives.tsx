import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { YomeTone } from "@/types/yome-ui";

export function Brand({ href = "/dashboard", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link
      className="yome-brand brand inline-flex items-center gap-3 font-extrabold tracking-normal text-yome-navy"
      href={href}
      style={light ? { color: "#fff" } : undefined}
    >
      <span className="yome-brand-mark brand-mark grid shrink-0 place-items-center rounded-yome-lg bg-yome-navy font-extrabold text-white shadow-yome">
        Y
      </span>
      <span>yome</span>
    </Link>
  );
}

export function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: YomeTone }) {
  return (
    <span className={`yome-badge badge yome-tone-${tone} badge-${tone} inline-flex items-center rounded-full font-bold`}>
      {children}
    </span>
  );
}

export function Avatar({
  initials,
  tone = "blue",
  size = "md",
  image,
}: {
  initials?: string;
  tone?: YomeTone;
  size?: "xs" | "sm" | "md" | "lg";
  image?: string;
}) {
  const safeTone = tone === "neutral" ? "blue" : tone;
  const sizeClass = size === "md" ? "" : ` yome-avatar-${size}`;
  return (
    <span
      className={`yome-avatar avatar avatar-${safeTone} yome-avatar-${safeTone}${sizeClass} avatar-${size} relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-extrabold text-white`}
    >
      {image ? <Image src={image} alt={initials || "Avatar"} fill sizes="86px" className="object-cover" /> : initials}
    </span>
  );
}

export function ToneSymbol({ children, tone = "blue" }: { children: ReactNode; tone?: YomeTone }) {
  return <span className={`yome-symbol yome-tone-${tone} inline-grid shrink-0 place-items-center rounded-yome font-extrabold`}>{children}</span>;
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="yome-page-heading flex items-end justify-between gap-5">
      <div>
        {eyebrow && <p>{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <span>{subtitle}</span>}
      </div>
      {action}
    </header>
  );
}
