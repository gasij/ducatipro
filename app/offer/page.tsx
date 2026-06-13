import Link from 'next/link';

type Props = {
  title: string;
  children: React.ReactNode;
};

function InfoPage({title, children}: Props) {
  return (
    <div className="container mx-auto safe-px max-w-3xl pt-8 sm:pt-12 pb-16 sm:pb-24">
      <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-6">
        <Link href="/" className="hover:text-red-600">
          Главная
        </Link>
        <span>/</span>
        <span className="text-gray-900">{title}</span>
      </div>
      <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-8">{title}</h1>
      <div className="prose prose-sm max-w-none text-[14px] text-gray-700 leading-relaxed space-y-4">
        {children}
      </div>
    </div>
  );
}

export default function OfferPage() {
  return (
    <InfoPage title="Оферта и политика конфиденциальности">
      <p>
        Настоящая публичная оферта регулирует порядок продажи запчастей и аксессуаров для
        мотоциклов Ducati через интернет-магазин.
      </p>
      <p>
        Оформляя заказ, покупатель подтверждает согласие с условиями оферты и политикой
        обработки персональных данных. Мы обрабатываем только данные, необходимые для
        исполнения заказа и доставки.
      </p>
      <p>
        По вопросам:{' '}
        <a href="https://t.me/ducatiparts" className="text-red-600 hover:underline">
          @ducatiparts
        </a>
      </p>
    </InfoPage>
  );
}
