const MODES = [
  { icon: "🃏", name: "Flashcard", desc: "Lật thẻ 3D, vuốt để chấm, phím tắt đầy đủ." },
  { icon: "🌱", name: "Learn", desc: "Thẻ mới: xem → trắc nghiệm → gõ lại." },
  { icon: "⌨️", name: "Gõ từ", desc: "Gõ theo nghĩa, tô chỗ sai, bỏ qua lỗi nhỏ." },
  { icon: "🎧", name: "Nghe", desc: "Nghe TTS rồi gõ, chỉnh tốc độ." },
  { icon: "✅", name: "Trắc nghiệm", desc: "Đáp án nhiễu cùng loại từ, cùng trình độ." },
  { icon: "🧩", name: "Ghép cặp", desc: "Ghép từ–nghĩa bấm giờ, lưu kỷ lục." },
  { icon: "✏️", name: "Cloze", desc: "Điền từ vào câu ví dụ thật." },
  { icon: "⚡", name: "Sprint 60s", desc: "Ôn nhanh tính combo, kiếm XP." },
];

export function ModesGrid() {
  return (
    <section aria-labelledby="modes-h" className="mt-14">
      <h2 id="modes-h" className="text-2xl font-extrabold md:text-3xl">8 chế độ học, khỏi chán</h2>
      <ul className="mt-4 grid gap-3 md:grid-cols-4">
        {MODES.map((m) => (
          <li key={m.name} className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
            <p className="text-2xl" aria-hidden>{m.icon}</p>
            <p className="mt-1 font-bold">{m.name}</p>
            <p className="text-sm text-stone-500">{m.desc}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
