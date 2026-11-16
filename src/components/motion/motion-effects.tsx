"use client";

import { useEffect } from "react";

/**
 * Effets de pointeur partagés par tout le site, par délégation d'événements :
 * - [data-tilt] : inclinaison 3D (valeur max en degrés, 6 par défaut) ;
 * - .spotlight : lumière qui suit le pointeur (--mx / --my) ;
 * - [data-parallax] : variables --px / --py entre -1 et 1 pour les scènes 3D.
 * Rien n'est activé sur écran tactile ou si l'appareil demande moins de mouvement.
 */
export function MotionEffects() {
  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    let frame = 0;
    let lastEvent: PointerEvent | null = null;
    let tilted: HTMLElement | null = null;
    let lit: HTMLElement | null = null;
    let scene: HTMLElement | null = null;

    const resetTilt = (element: HTMLElement | null) => {
      if (!element) return;
      element.classList.remove("is-tilting");
      element.style.setProperty("--rx", "0deg");
      element.style.setProperty("--ry", "0deg");
    };

    const update = () => {
      frame = 0;
      const event = lastEvent;
      if (!event) return;
      const target = event.target instanceof Element ? event.target : null;

      const nextTilt = target?.closest<HTMLElement>("[data-tilt]") ?? null;
      if (nextTilt !== tilted) {
        resetTilt(tilted);
        tilted = nextTilt;
      }
      if (tilted) {
        const rect = tilted.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        const max = Number(tilted.dataset.tilt) || 6;
        tilted.classList.add("is-tilting");
        tilted.style.setProperty("--rx", `${(-y * max).toFixed(2)}deg`);
        tilted.style.setProperty("--ry", `${(x * max).toFixed(2)}deg`);
      }

      lit = target?.closest<HTMLElement>(".spotlight") ?? null;
      if (lit) {
        const rect = lit.getBoundingClientRect();
        lit.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        lit.style.setProperty("--my", `${event.clientY - rect.top}px`);
      }

      scene = document.querySelector<HTMLElement>("[data-parallax]");
      if (scene) {
        const px = (event.clientX / window.innerWidth) * 2 - 1;
        const py = (event.clientY / window.innerHeight) * 2 - 1;
        scene.style.setProperty("--px", px.toFixed(3));
        scene.style.setProperty("--py", py.toFixed(3));
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      lastEvent = event;
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const onPointerLeave = () => {
      resetTilt(tilted);
      tilted = null;
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      if (frame) window.cancelAnimationFrame(frame);
      resetTilt(tilted);
    };
  }, []);

  return null;
}
