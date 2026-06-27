"use client";

import Script from "next/script";

declare global {
  interface Window {
    MathJax?: {
      startup?: {
        promise?: Promise<void>;
      };
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
    };
    __flashcardMathReady?: boolean;
  }
}

export function FlashcardMathProvider() {
  return (
    <>
      <Script id="mathjax-config" strategy="afterInteractive">
        {`
          window.MathJax = {
            tex: {
              inlineMath: [['\\\\(','\\\\)'], ['$', '$']],
              displayMath: [['\\\\[','\\\\]'], ['$$','$$']],
              processEscapes: true
            },
            svg: {
              fontCache: 'global'
            }
          };
        `}
      </Script>
      <Script
        id="mathjax-runtime"
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
        strategy="afterInteractive"
        onReady={() => {
          window.__flashcardMathReady = true;
          window.dispatchEvent(new Event("flashcard-math-ready"));
        }}
      />
    </>
  );
}
