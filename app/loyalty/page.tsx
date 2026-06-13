import Link from 'next/link';

export default function LoyaltyPage() {
  return (
    <div className="container mx-auto safe-px max-w-3xl pt-8 sm:pt-12 pb-16 sm:pb-24">
      <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-6">
        <Link href="/" className="hover:text-red-600">
          Главная
        </Link>
        <span>/</span>
        <span className="text-gray-900">Программа лояльности</span>
      </div>
      <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-8">
        Программа лояльности
      </h1>
      <div className="text-[14px] text-gray-700 leading-relaxed space-y-4">
        <p>
          За каждый оплаченный заказ начисляются бонусные баллы — 3% от суммы покупки. Баллы
          можно использовать при следующем заказе.
        </p>
        <p>
          Постоянным клиентам — персональные скидки и приоритетная обработка предзаказов из
          Италии.
        </p>
        <p>
          Участие в программе автоматическое — напишите нам в{' '}
          <a href="https://t.me/ducatiparts" className="text-red-600 hover:underline">
            Telegram
          </a>
          .
        </p>
      </div>
    </div>
  );
}
