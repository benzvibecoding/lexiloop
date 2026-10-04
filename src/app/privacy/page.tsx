import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quyền riêng tư" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-extrabold">Quyền riêng tư</h1>
      <ul className="mt-4 list-disc space-y-2 pl-6">
        <li>Dữ liệu học (deck, thẻ, tiến độ) lưu trên trình duyệt của bạn, không gửi về server.</li>
        <li>Chỉ khi bạn bấm “thêm nhanh”, app mới gọi API từ điển công khai để lấy nghĩa/IPA.</li>
        <li>Khi chủ app bật đồng bộ đám mây, app đếm lượt xem trang ẩn danh (không kèm nội dung học của bạn) để làm thống kê chung.</li>
        <li>Không tracking mặc định. Phân tích (nếu có) luôn tắt cho tới khi bạn đồng ý.</li>
        <li>Bạn có thể xuất backup và xóa toàn bộ dữ liệu bất cứ lúc nào trong Cài đặt.</li>
      </ul>
    </main>
  );
}
