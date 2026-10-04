# LexiLoop — Học từ vựng tiếng Anh, nhớ lâu mỗi ngày

Flashcard + lặp lại ngắt quãng (FSRS). Local-first, offline, không cần đăng ký.

## Chạy local

```bash
pnpm install
pnpm dev
```

Mở http://localhost:3000

## Lệnh

```bash
pnpm typecheck   # TypeScript strict, 0 lỗi
pnpm lint        # ESLint, 0 lỗi
pnpm test        # Vitest unit (13 file, 60 test)
pnpm test:e2e    # Playwright smoke trên production build (5 test, cần build)
pnpm build       # Build production, 21 route
pnpm analyze     # Xem bundle bằng @next/bundle-analyzer
pnpm icons       # Sinh lại icon PWA từ public/icons/icon.svg
```

## Tính năng

- Deck & thẻ: CRUD, auto-fill từ điển, thêm hàng loạt, import/export CSV/JSON/Quizlet, tìm kiếm + lọc + ảo hóa, tra từ, chia sẻ deck bằng link.
- 9 chế độ học (flashcard, learn, gõ từ, nghe, trắc nghiệm, ghép cặp, cloze, phát âm, sprint 60s) + ôn tùy chỉnh/cram — mọi chế độ đều ghi ReviewLog FSRS.
- Dashboard (mục tiêu ngày, streak + freeze, Từ của ngày), thống kê (heatmap 365, true retention, dự báo 30 ngày), gamification (20 huy hiệu, quest ngày, tắt được).
- Thư viện 12 deck mẫu / 408 thẻ, onboarding 3 bước, placement test 20 câu.
- PWA offline-first: cài được, mất mạng vẫn học, tự nhắc bản mới.
- Tùy chọn: sync Supabase (Google/email), AI Assist BYOK (Gemini/OpenAI).

## Deploy Vercel (5 bước)

1. Push code lên GitHub.
2. Vào vercel.com → Add New → Project → Import repo.
3. Framework: Next.js (tự nhận). Không cần thêm env (muốn sync thì thêm 2 biến Supabase).
4. Bấm Deploy.
5. (Tùy chọn) gắn domain riêng trong Settings → Domains.

## Bật đồng bộ Supabase (tùy chọn)

1. Tạo project free ở supabase.com → chạy `supabase/schema.sql` trong SQL Editor.
2. Bật Auth → Google provider (lấy Client ID/Secret từ Google Cloud) và/hoặc Email OTP.
3. Thêm env lên Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Redeploy.
4. Mở app → Cài đặt → đăng nhập → “Sync ngay”. Thiếu env thì mục này tự ẩn, app chạy guest.

## Cài PWA

Mở app trên điện thoại → menu trình duyệt → “Add to Home Screen / Cài đặt ứng dụng”.
Mở một lần khi có mạng để service worker precache app shell, sau đó học offline hoàn toàn.

## Hiệu năng & chất lượng

Mục tiêu Lighthouse mobile ≥90: chạy `pnpm build && pnpm start`, mở Chrome DevTools →
Lighthouse → Mobile → chạy cho `/` và kiểm tra 360/768/1280 + light/dark + vi/en.
Axe: chạy tay bằng extension axe DevTools trên `/`, `/study`, `/settings` (mục tiêu 0 lỗi nghiêm trọng).

## Cấu trúc

- `src/app`: landing `/` + nhóm `(app)` (dashboard, decks, review, study, library, lookup, add, stats, settings) + `onboarding`, `placement`, `offline`
- `src/components`: layout, marketing, study (+modes), deck, cards, settings, common
- `src/lib`: srs (adapter FSRS + queue), db (Dexie + repositories), clock, dictionary, import-export, backup, tts, study, stats, gamification, library, i18n
- `src/stores`: prefs (ngôn ngữ), settings ( Dexie), game (gamification)
- `src/data/starter-decks`: 12 deck mẫu JSON
- `docs`: ARCHITECTURE, SRS, DECISIONS

## Thêm deck mẫu mới

Bỏ file JSON vào `src/data/starter-decks/` theo `src/lib/library/schema.ts`,
khai báo import trong `src/lib/library/starter.ts`, validate tự chạy trong test.

## FAQ

- **Mất mạng có học được không?** Có, sau lần mở đầu tiên có mạng.
- **Dữ liệu ở đâu?** Trên trình duyệt của bạn; xuất backup JSON trong Cài đặt.
- **Quên/Khó/Nhớ/Dễ là gì?** Mức độ bạn nhớ thẻ; app dùng nó tính ngày ôn tiếp theo.
