"use client";
import { useEffect } from "react";

export default function GoogleTranslate() {
  useEffect(() => {
    (window as unknown as Record<string, unknown>).googleTranslateElementInit = () => {
      new (window as unknown as {
        google: { translate: { TranslateElement: new (opts: unknown, id: string) => void } };
      }).google.translate.TranslateElement(
        { pageLanguage: "fr", includedLanguages: "fr,en,es,de,it,pt,nl,ar,zh-CN,ja", autoDisplay: false },
        "google_translate_global"
      );
      // Détection automatique de la langue du navigateur
      const browserLang = navigator.language || "";
      if (!browserLang.toLowerCase().startsWith("fr")) {
        const langMap: Record<string, string> = {
          en: "en", es: "es", de: "de", it: "it", pt: "pt",
          nl: "nl", ar: "ar", zh: "zh-CN", ja: "ja",
        };
        const code = browserLang.split("-")[0].toLowerCase();
        const target = langMap[code] || "en";
        setTimeout(() => {
          const select = document.querySelector("#google_translate_global select") as HTMLSelectElement | null;
          if (select) {
            select.value = target;
            select.dispatchEvent(new Event("change"));
          }
        }, 800);
      }
    };

    if (!document.querySelector('script[src*="translate.google.com"]')) {
      const script = document.createElement("script");
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <>
      <style>{`
        .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame { display:none !important; }
        body { top:0 !important; }
        .skiptranslate:not(#google_translate_global) { display:none !important; }
        #google_translate_global select {
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:.78rem;
          font-weight:600;
          color:#6B7280;
          background:#F9FAFB;
          border:1px solid #E5E7EB;
          border-radius:7px;
          padding:.3rem .5rem;
          cursor:pointer;
          outline:none;
        }
      `}</style>
      <div id="google_translate_global" style={{ position:"fixed", bottom:"1rem", right:"1rem", zIndex:9999 }} />
    </>
  );
}
