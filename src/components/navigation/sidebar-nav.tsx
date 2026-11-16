"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  House,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  ListChecks,
  Newspaper,
  PenLine,
  Settings,
  Sigma,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  type LucideIcon
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/navigation";

type SidebarNavProps = {
  items: NavItem[];
};

const icons: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/planning": CalendarDays,
  "/flashcards": Layers,
  "/resources": BookOpen,
  "/annales": Sigma,
  "/essays": PenLine,
  "/assistant": Sparkles,
  "/actualites": Newspaper,
  "/progress": TrendingUp,
  "/teacher": House,
  "/teacher/resources": FolderOpen,
  "/teacher/resources/new": Upload,
  "/teacher/essays": PenLine,
  "/teacher/grades": ClipboardList,
  "/teacher/rubrics": ListChecks,
  "/admin": LayoutGrid,
  "/admin/users": Users,
  "/admin/establishments": Building2,
  "/admin/activity": Activity,
  "/admin/system": Settings
};

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden lg:flex lg:flex-col lg:gap-1.5" aria-label="Navigation principale">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = icons[item.href] ?? LayoutGrid;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "nav-link group flex items-center gap-3 rounded-[18px] px-2.5 py-2 text-sm font-medium transition duration-300",
                isActive
                  ? "nav-link--active text-sand"
                  : "text-ink/80 hover:translate-x-1 hover:bg-white/80 hover:text-ink hover:shadow-[0_12px_26px_rgba(20,34,29,0.08)]"
              )}
            >
              <span
                className={cn(
                  "nav-link__icon",
                  isActive ? "bg-white/12 text-white" : "bg-white/70 text-pine group-hover:bg-clay/12 group-hover:text-clay"
                )}
              >
                <Icon size={17} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span
                  className={cn(
                    "pulse-dot rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                    isActive ? "bg-clay text-white" : "bg-clay/12 text-clay"
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <nav className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:hidden" aria-label="Navigation principale">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = icons[item.href] ?? LayoutGrid;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-2 text-[13px] font-medium transition",
                isActive
                  ? "nav-link--active border-transparent text-sand"
                  : "border-white/70 bg-white/78 text-ink"
              )}
            >
              <Icon size={15} strokeWidth={2} aria-hidden="true" />
              {item.label}
              {item.badge ? (
                <span className={cn("rounded-full px-1.5 text-[11px] font-semibold", isActive ? "bg-clay text-white" : "bg-clay/12 text-clay")}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
