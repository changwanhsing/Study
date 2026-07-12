const SPEECH_LANG_MAP: Record<string, string> = {
  en: "en-US",
  ja: "ja-JP",
};

export function speak(text: string, lang: string = "en") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = SPEECH_LANG_MAP[lang] ?? "en-US";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}
