# SRS — cách LexiLoop dùng FSRS (ts-fsrs v5)

- Adapter thuần ở `src/lib/srs/adapter.ts`: map `Card` của app ↔ `Card` của ts-fsrs
  (due/stability/difficulty/elapsed/scheduled/learning_steps/reps/lapses/state/last_review).
- `schedulerFromSettings`: `request_retention` (0.80–0.97, mặc định 0.9), `enable_fuzz: true`,
  `learning_steps`/`relearning_steps` từ phút trong settings (mặc định [1,10]/[10]).
- Chấm: `FSRS.next(card, now, grade)` với grade Again=1/Hard=2/Good=3/Easy=4.
- Nút chấm hiện khoảng ôn kế tiếp qua `FSRS.repeat(card, now)` + `formatInterval` ("1p/10p/1n/4n").
- Hàng đợi (`src/lib/srs/queue.ts`): learning/relearning đến hạn → review đến hạn → thẻ mới,
  tôn trọng suspended/buried/đã xóa + giới hạn new/day, review/day.
- Leech: `lapses >= leechThreshold` (mặc định 8) thì gắn cờ `leech`.
- Mỗi lần chấm ghi `ReviewLog` + `DailyStat`; undo xóa log và khôi phục snapshot thẻ.
