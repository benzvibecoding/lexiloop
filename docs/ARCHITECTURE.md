# Kiến trúc LexiLoop

## Tổng quan

- `src/app`: App Router. `/` landing SSG; `(app)` là shell học (noindex); `/onboarding`, `/placement`, `/offline` public.
- Routes: dashboard, decks (+`[id]`), review, study (`?deck=&mode=`), library, lookup, add, stats, settings.

## Tầng

- `components` → `hooks/stores` → `repositories` (`lib/db`, bọc Dexie) → domain (`lib/srs`, `lib/queue` trong `lib/srs/queue`, `lib/clock`).
- `lib/*` là TypeScript thuần, có unit test. Dexie chỉ chạy client (`useLiveQuery` + `useDbMounted`), skeleton khi chưa sẵn sàng.
- **Quy tắc liveQuery**: trong querier của `useLiveQuery` chỉ đọc. Ghi settings dùng `loadSettings` trong effect/handler; đọc dùng `peekSettings` (Phase 8: từng crash production vì `loadSettings` ghi trong liveQuery → Dexie báo "Readwrite transaction in liveQuery context").

## Dữ liệu

- Dexie `lexiloop` v1: `decks/cards/reviewLogs/dailyStats/media/dictCache/settings` + index theo spec; id nanoid; timestamp ms; soft-delete `deletedAt`; transaction cho ghi nhiều bảng.
- Validate mọi dữ liệu ngoài (import, backup, starter JSON) bằng Zod; lỗi hiện tiếng Việt, không crash.
- Backup JSON có `schemaVersion`; xuất CSV chống injection.

## Học (SRS)

- Xem `docs/SRS.md`. `gradeCardInDb` là điểm ghi duy nhất cho 9 chế độ học (mọi chế độ ghi `ReviewLog`); cram chỉ ghi log, không đổi lịch.
- Streak/XP/dailyStat cập nhật trong mọi lần chấm; leech khi `lapses >= ngưỡng`.

## UI

- Mobile bottom-tab, desktop sidebar; focus-mode cho phiên học; toast Undo toàn app.
- i18n tự viết vi/en + zustand persist; theme `next-themes`; tokens Tailwind v4 trong `globals.css`.
- Study modes dynamic import; recharts/confetti dynamic import.
