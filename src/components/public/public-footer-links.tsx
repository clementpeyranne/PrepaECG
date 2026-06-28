import type { Route } from "next";
import Link from "next/link";

const links: Array<{ href: Route; label: string }> = [
  { href: "/mentions-legales", label: "Mentions legales" },
  { href: "/confidentialite", label: "Confidentialite" },
  { href: "/cgu", label: "CGU" },
  { href: "/support", label: "Support" }
];

export function PublicFooterLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-pine/70 ${className}`.trim()}>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="transition hover:text-ink">
          {link.label}
        </Link>
      ))}
    </div>
  );
}
