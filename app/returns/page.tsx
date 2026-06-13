import Link from 'next/link';

export default function ReturnsPage() {
  return (
    <div className="container mx-auto safe-px max-w-3xl pt-8 sm:pt-12 pb-16 sm:pb-24">
      <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-6">
        <Link href="/" className="hover:text-red-600">
          Главная
        </Link>
        <span>/</span>
        <span className="text-gray-900">Условия обмена и возврата</span>
      </div>
      <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-8">
        Условия обмена и возврата
      </h1>
      <div className="text-[14px] text-gray-700 leading-relaxed space-y-4">
        <p>
          Возврат товара надлежащего качества возможен в течение 14 дней с момента получения,
          если сохранён товарный вид и упаковка.
        </p>
        <p>
          Запчасти, изготовленные под заказ или поставленные из Италии, возврату не подлежат,
          если иное не согласовано с менеджером.
        </p>
        <p>
          Для оформления возврата свяжитесь с нами в Telegram:{' '}
          <a href="https://t.me/ducatiparts" className="text-red-600 hover:underline">
            @ducatiparts
          </a>
        </p>
      </div>
    </div>
  );
}
