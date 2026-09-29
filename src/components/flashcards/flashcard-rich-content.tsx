"use client";

import { useEffect, useRef } from "react";

function sanitizeCardHtml(value: string) {
  const withBreaks = /<[^>]+>/.test(value) ? value : value.replace(/\n/g, "<br />");

  return withBreaks
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<(?:iframe|object|embed|link|meta)[\s\S]*?>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/\s(?:src|href)=(['"])\s*javascript:[\s\S]*?\1/gi, "")
    .replace(/<img(?![^>]*\bloading=)/gi, '<img loading="lazy"')
    .replace(/<audio(?![^>]*\bcontrols)/gi, "<audio controls");
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
  return /\\\(|\\\[|\\begin\{|\\displaystyle|\\frac|\\sqrt|\\sum|\\int|\\binom|\\mathbb|\\text\{|\$\$|\$[^$]+\$/i.test(value);
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
      className={`space-y-3 leading-8 [&_audio]:mt-3 [&_audio]:w-full [&_hr]:my-4 [&_hr]:border-white/15 [&_img]:mx-auto [&_img]:max-h-[28rem] [&_img]:max-w-full [&_img]:rounded-xl [&_img]:bg-white/90 [&_img]:object-contain [&_mjx-container]:my-2 [&_mjx-container]:max-w-full [&_mjx-container]:overflow-x-auto [&_mjx-container]:overflow-y-hidden ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: sanitizeCardHtml(value) }}
    />
  );
}
