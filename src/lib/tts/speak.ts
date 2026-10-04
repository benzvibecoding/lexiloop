export type TtsOptions = {
  voiceURI?: string;
  rate?: number;
  lang?: string;
};

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function pickEnglishVoice(preferGB = false): SpeechSynthesisVoice | null {
  if (!ttsSupported()) return null;
  const vs = window.speechSynthesis.getVoices();
  if (vs.length === 0) return null;
  const en = vs.filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (en.length === 0) return null;
  const gb = en.find((v) => v.lang.toLowerCase().includes("gb"));
  const us = en.find((v) => v.lang.toLowerCase().includes("us"));
  if (preferGB && gb) return gb;
  return us ?? gb ?? en[0] ?? null;
}

export function speak(text: string, opts?: TtsOptions): void {
  if (!ttsSupported()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts?.lang ?? "en-US";
    u.rate = opts?.rate ?? 1;
    if (opts?.voiceURI) {
      const v = window.speechSynthesis.getVoices().find((x) => x.voiceURI === opts.voiceURI);
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      }
    } else {
      const auto = pickEnglishVoice(false);
      if (auto) u.voice = auto;
    }
    window.speechSynthesis.speak(u);
  } catch {
    // Bỏ qua lỗi TTS, không chặn học.
  }
}

export function stopSpeak(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // noop
  }
}
