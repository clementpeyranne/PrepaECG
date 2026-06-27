"use client";

import { useEffect, useState } from "react";

const THEMES = [
  {
    id: "original",
    label: "Originale",
    helper: "Chaleureuse et ambitieuse",
    swatches: ["#f7f1e7", "#21493d", "#c96b4a"]
  },
  {
    id: "capsule",
    label: "Capsule",
    helper: "Claire et tonique",
    swatches: ["#eef4f6", "#1f475c", "#dc7a4a"]
  },
  {
    id: "atelier",
    label: "Atelier",
    helper: "Plus editoriale",
    swatches: ["#f9efe5", "#683037", "#d35842"]
  },
  {
    id: "night",
    label: "Night",
    helper: "Plus intense",
    swatches: ["#e8eef2", "#3b6282", "#f09a5c"]
  },
  {
    id: "pulse",
    label: "Pulse",
    helper: "Noir doux, violet et rose net",
    swatches: ["#0b0812", "#8866e0", "#f463aa"]
  },
  {
    id: "velours",
    label: "Velours",
    helper: "Luxe discret",
    swatches: ["#11100f", "#a1845e", "#f3eee4"]
  },
  {
    id: "campus",
    label: "Campus",
    helper: "App etudiante premium",
    swatches: ["#0b1220", "#5b6cfa", "#eef4fa"]
  }
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("prepa-theme", theme);
}

function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((entry) => entry.id === value);
}

export function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState<ThemeId>("original");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("prepa-theme");
    const theme: ThemeId = isThemeId(storedTheme) ? storedTheme : "original";
    setActiveTheme(theme);
    applyTheme(theme);
  }, []);

  return (
    <section className="mt-8 rounded-[28px] border border-white/65 bg-white/50 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-pine/60">Ambiance</p>
          <p className="mt-2 text-sm leading-6 text-pine/78">
            Tu peux tester plusieurs palettes puis revenir a l&apos;originale.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {THEMES.map((theme) => {
          const isActive = activeTheme === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => {
                setActiveTheme(theme.id);
                applyTheme(theme.id);
              }}
              className={`flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left transition ${
                isActive
                  ? "border-ink bg-ink text-sand shadow-[0_14px_30px_rgba(20,34,29,0.16)]"
                  : "border-white/75 bg-white/75 text-ink hover:border-pine/18 hover:bg-white"
              }`}
            >
              <div>
                <p className="text-sm font-semibold">{theme.label}</p>
                <p className={`mt-1 text-xs ${isActive ? "text-sand/70" : "text-pine/68"}`}>{theme.helper}</p>
              </div>
              <div className="flex items-center gap-2">
                {theme.swatches.map((color) => (
                  <span
                    key={color}
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
