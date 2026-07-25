// src/types/arabic-reshaper.d.ts
//
// The `arabic-reshaper` package (npm) ships no TypeScript types and has no
// @types package on DefinitelyTyped, which is why TS reports:
// "Cannot find module 'arabic-reshaper' or its corresponding type declarations."
//
// This file teaches TypeScript what the module's shape is. Make sure this
// file is included by your tsconfig (e.g. it lives under `src/` and your
// `include`/`typeRoots` picks up .d.ts files there — no import needed,
// TS auto-discovers ambient .d.ts files in the compiled project).

declare module 'arabic-reshaper' {
  interface ReshaperOptions {
    ligatures?: boolean;
    delete_harakat?: boolean;
  }

  function convertArabic(text: string): string;
  function reshape(text: string, options?: ReshaperOptions): string;

  const ArabicReshaper: {
    convertArabic: typeof convertArabic;
    reshape: typeof reshape;
  };

  export = ArabicReshaper;
}