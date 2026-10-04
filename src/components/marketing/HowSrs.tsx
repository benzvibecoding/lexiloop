export function HowSrs() {
  return (
    <figure className="rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900">
      <figcaption className="font-bold">Vì sao phải ôn đúng lúc?</figcaption>
      <svg viewBox="0 0 320 180" role="img" aria-label="Đồ thị đường quên: không ôn thì quên nhanh, ôn đúng lúc thì nhớ lâu" className="mt-2 w-full">
        <line x1="30" y1="10" x2="30" y2="160" stroke="currentColor" strokeOpacity="0.3" />
        <line x1="30" y1="160" x2="310" y2="160" stroke="currentColor" strokeOpacity="0.3" />
        <text x="8" y="30" fontSize="10" fill="currentColor">Nhớ</text>
        <text x="270" y="175" fontSize="10" fill="currentColor">Thời gian</text>
        <path d="M30,20 C80,60 110,140 160,150" fill="none" stroke="#e0441f" strokeWidth="3" strokeDasharray="6 4" />
        <text x="165" y="150" fontSize="10" fill="#e0441f">không ôn: quên nhanh</text>
        <path d="M30,20 C60,45 70,70 90,72 C110,74 120,50 150,52 C180,54 190,35 220,37 C250,39 260,25 300,27" fill="none" stroke="#14b983" strokeWidth="3" />
        <text x="200" y="70" fontSize="10" fill="#14b983">ôn đúng lúc: nhớ lâu</text>
        {[90, 150, 220].map((x) => (
          <g key={x}>
            <line x1={x} y1="150" x2={x} y2="160" stroke="#14b983" strokeWidth="2" />
            <text x={x - 12} y="172" fontSize="9" fill="currentColor">ôn</text>
          </g>
        ))}
      </svg>
      <p className="mt-2 text-sm text-stone-500">LexiLoop dùng thuật toán FSRS để tính ngày ôn cho từng thẻ — đúng lúc bạn sắp quên.</p>
    </figure>
  );
}
