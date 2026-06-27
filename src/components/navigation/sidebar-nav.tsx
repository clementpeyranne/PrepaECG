"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/mock-data";

type SidebarNavProps = {
  items: NavItem[];
};

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden lg:flex lg:flex-col lg:gap-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-[20px] px-4 py-3 text-sm font-medium transition duration-200",
                isActive
                  ? "translate-x-1 bg-ink text-sand shadow-[0_18px_40px_rgba(20,34,29,0.18)]"
                  : "bg-white/58 text-ink hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_14px_28px_rgba(20,34,29,0.08)]"
              )}
            >
              <span>{item.label}</span>
              {item.badge ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    isActive ? "bg-sand/18 text-sand" : "bg-clay/10 text-clay"
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <nav className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:hidden">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-[13px] font-medium transition",
                isActive
                  ? "border-ink bg-ink text-sand shadow-[0_12px_24px_rgba(20,34,29,0.15)]"
                  : "border-white/70 bg-white/78 text-ink"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
