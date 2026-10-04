import { DeckList } from "@/components/deck/DeckList";

export default function Page() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Bộ thẻ của bạn</h1>
      <p className="mt-1 text-sm text-stone-500">Tạo, sửa, nhân bản, lưu trữ. Bấm vào để xem thẻ bên trong.</p>
      <div className="mt-4">
        <DeckList />
      </div>
    </div>
  );
}
