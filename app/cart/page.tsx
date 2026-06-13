import Image from 'next/image';
import Link from 'next/link';
import {Trash2} from 'lucide-react';
import {getProduct} from '../../lib/products';

export default function CartPage() {
  const cartItem = getProduct('1');

  if (!cartItem) {
    return null;
  }

  return (
    <div className="container mx-auto safe-px max-w-7xl pt-6 sm:pt-8 pb-16 sm:pb-24 border-t border-gray-100">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-2 sm:mt-4">
        <div className="flex-1 min-w-0 order-2 lg:order-1">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-6 sm:mb-8">
            Корзина
          </h1>

          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex gap-4 sm:gap-6 py-5 sm:py-6 border-b border-gray-100">
              <Link
                href={`/product/${cartItem.id}`}
                className="w-20 h-20 sm:w-24 sm:h-24 relative bg-gray-50 border border-gray-100 rounded-sm shrink-0 mix-blend-multiply"
              >
                <Image
                  src={cartItem.image}
                  fill
                  alt={cartItem.title}
                  className="object-contain p-2"
                  referrerPolicy="no-referrer"
                />
              </Link>

              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <div className="flex justify-between gap-3">
                  <Link
                    href={`/product/${cartItem.id}`}
                    className="text-[12px] sm:text-[13px] font-medium text-gray-900 hover:text-red-600 transition-colors uppercase leading-snug line-clamp-3 pr-2"
                  >
                    {cartItem.title}
                  </Link>
                  <button
                    type="button"
                    className="text-gray-300 hover:text-red-600 transition-colors shrink-0 p-1 -mt-1"
                    aria-label="Удалить"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-[12px] text-gray-500">{cartItem.priceFormatted}/шт</div>

                <div className="flex items-center justify-between gap-4 mt-auto">
                  <div className="flex items-center border border-gray-100 rounded-sm bg-[#f9f9f9]">
                    <button type="button" className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-gray-500 hover:text-black">
                      -
                    </button>
                    <input
                      type="text"
                      value="1"
                      readOnly
                      className="w-8 text-center text-[13px] font-bold outline-none bg-transparent"
                    />
                    <button type="button" className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-gray-500 hover:text-black">
                      +
                    </button>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-gray-900 tracking-tight whitespace-nowrap">
                    {cartItem.priceFormatted}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 sm:mt-20">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-6 sm:mb-8">
              Ранее просмотренные
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl">
              <Link href={`/product/${cartItem.id}`} className="flex items-center gap-4 group min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 relative bg-gray-50 border border-gray-100 rounded-sm shrink-0 mix-blend-multiply">
                  <Image
                    src={cartItem.image}
                    fill
                    alt={cartItem.title}
                    className="object-contain p-2 group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-gray-900 group-hover:text-red-600 transition-colors uppercase leading-tight line-clamp-2 mb-2">
                    {cartItem.title}
                  </div>
                  <div className="text-[13px] font-black text-gray-900 tracking-tight">
                    {cartItem.priceFormatted}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4 sm:gap-6 order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <div className="bg-[#f9f9f9] border border-gray-100 rounded-sm p-5 sm:p-6 flex flex-col gap-4">
            <h3 className="text-[13px] text-gray-800 font-medium tracking-wide">
              Введите промокод
            </h3>
            <div className="flex min-w-0">
              <input
                type="text"
                placeholder="Промокод"
                className="flex-1 min-w-0 px-4 py-3 text-[13px] outline-none border border-gray-200 border-r-0 rounded-l-sm"
              />
              <button
                type="button"
                className="bg-gray-500 hover:bg-gray-600 transition-colors text-white px-4 rounded-r-sm shrink-0"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <div className="bg-[#f9f9f9] border border-gray-100 rounded-sm p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex justify-between text-[13px] text-gray-600">
              <span>Товары (1)</span>
              <span>{cartItem.priceFormatted}</span>
            </div>
            <div className="flex justify-between items-baseline pt-4 border-t border-gray-200 mt-2">
              <span className="text-[14px] text-gray-900">Итого:</span>
              <span className="text-2xl sm:text-[28px] font-black tracking-tight text-gray-900">
                {cartItem.priceFormatted}
              </span>
            </div>
            <a
              href="https://t.me/ducatiparts"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black hover:bg-gray-900 transition-colors text-white py-4 text-[13px] font-bold rounded-sm mt-2 sm:mt-4 tracking-wide w-full border border-black text-center block"
            >
              Оформить заказ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
