export const site = {
  name: "LexiLoop",
  tagline: "Học từ vựng tiếng Anh, nhớ lâu mỗi ngày",
  description:
    "LexiLoop giúp người Việt học từ vựng tiếng Anh bằng flashcard và lặp lại ngắt quãng. Không cần đăng ký, chạy offline, miễn phí.",
  url: "https://lexiloop.vercel.app",
  localeDefault: "vi" as const,
} as const;

export type SiteName = typeof site.name;
