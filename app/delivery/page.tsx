import Link from 'next/link';

export default function DeliveryPage() {
  return (
    <div className="container mx-auto safe-px max-w-3xl pt-8 sm:pt-12 pb-16 sm:pb-24">
      <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-6">
        <Link href="/" className="hover:text-red-600">
          Главная
        </Link>
        <span>/</span>
        <span className="text-gray-900">Оплата и доставка</span>
      </div>
      <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-8">Оплата и доставка</h1>
      <div className="text-[14px] text-gray-700 leading-relaxed space-y-4">
        <p>
          <strong>Оплата:</strong> банковская карта (Visa, Mastercard, МИР), перевод по
          реквизитам, оплата при получении — для товаров со склада в Москве.
        </p>
        <p>
          <strong>Доставка по России:</strong> СДЭК, Почта России, курьер по Москве. Сроки
          зависят от наличия: товары со склада в Москве — 1–3 дня, предзаказ из Италии — 4–6
          недель.
        </p>
        <p>
          <strong>Цена «до двери»</strong> для товаров из Милана включает доставку, таможенные
          расходы и пошлины.
        </p>
      </div>
    </div>
  );
}
