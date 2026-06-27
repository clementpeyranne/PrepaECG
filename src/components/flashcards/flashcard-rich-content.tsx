"use client";

import { useEffect, useRef } from "react";

function sanitizeCardHtml(value: string) {
  const withBreaks = /<[^>]+>/.test(value) ? value : value.replace(/\n/g, "<br />");

  return withBreaks
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/<img /gi, '<img loading="lazy" class="max-h-80 w-auto rounded-xl object-contain" ')
    .replace(/<audio /gi, '<audio class="mt-3 w-full" ');
}

export function stripCardHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?(div|p|span|b|i|strong|em|font|ul|ol|li|hr|audio|img)[^>]*>/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function containsMathSyntax(value: string) {
  return /\\\(|\\\[|\\displaystyle|\\frac|\\sqrt|\\sum|\\int|\\binom|\$\$|\$[^$]+\$/i.test(value);
}

export function FlashcardRichContent({
  value,
  className = ""
}: {
  value: string;
  className?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = contentRef.current;
    const typesetMath = () => {
      const mathJax = window.MathJax;

      if (!element || !mathJax?.typesetPromise || !containsMathSyntax(value)) {
        return;
      }

      const startupPromise = mathJax.startup?.promise ?? Promise.resolve();
      startupPromise
        .then(() => mathJax.typesetPromise?.([element]))
        .catch(() => undefined);
    };

    typesetMath();
    window.addEventListener("flashcard-math-ready", typesetMath);

    return () => {
      window.removeEventListener("flashcard-math-ready", typesetMath);
    };
  }, [value]);

  return (
    <div
      ref={contentRef}
      className={`space-y-3 leading-8 [&_audio]:mt-3 [&_hr]:my-4 [&_hr]:border-white/15 [&_img]:bg-white/80 [&_mjx-container]:my-2 [&_mjx-container]:overflow-x-auto [&_mjx-container]:overflow-y-hidden ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: sanitizeCardHtml(value) }}
    />
  );
}
