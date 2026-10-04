const FAQS = [
  { q: "Không đăng ký có dùng được không?", a: "Được. Mọi dữ liệu nằm trên máy bạn (IndexedDB), mở web là học ngay. Đồng bộ cloud chỉ là tùy chọn sau này." },
  { q: "Mất mạng có học được không?", a: "Được. LexiLoop là PWA offline-first: cài về màn hình chính, mở một lần khi có mạng rồi học mọi lúc." },
  { q: "Lặp lại ngắt quãng là gì?", a: "App nhắc ôn mỗi thẻ đúng lúc bạn sắp quên (thuật toán FSRS), thay vì học vẹt. Bạn chấm Quên/Khó/Nhớ/Dễ, app tính ngày ôn tiếp theo." },
  { q: "Dữ liệu của tôi ở đâu?", a: "Trên trình duyệt của bạn. Chỉ khi bạn bấm tra từ/auto-fill, app mới gọi API từ điển công khai. Xem trang Quyền riêng tư." },
  { q: "Dùng miễn phí thật không?", a: "Thật. Không backend, không API key, không tính năng trả phí. Deploy Vercel gói miễn phí là chạy." },
];

export function Faq() {
  return (
    <section aria-labelledby="faq-h" className="mt-14">
      <h2 id="faq-h" className="text-2xl font-extrabold md:text-3xl">Hỏi đáp</h2>
      <div className="mt-4 grid gap-2">
        {FAQS.map((f) => (
          <details key={f.q} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
            <summary className="min-h-[44px] cursor-pointer font-bold">{f.q}</summary>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function faqJsonLd(url: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    url,
  };
}
