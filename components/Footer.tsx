'use client';

import {ArrowUp} from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#fcfcfc] pt-10 sm:pt-16 pb-6 sm:pb-8 mt-12 sm:mt-24 border-t border-gray-100">
      <div className="container mx-auto safe-px max-w-7xl relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-16">
          <div>
            <h4 className="font-bold mb-4 sm:mb-6 text-sm">Содержание</h4>
            <ul className="space-y-3 sm:space-y-4 text-[13px] text-gray-600">
              <li>
                <Link href="/catalog" className="hover:text-red-600 transition-colors">
                  Каталог
                </Link>
              </li>
              <li>
                <Link href="/outlet" className="hover:text-red-600 transition-colors">
                  Аутлет в Милане
                </Link>
              </li>
              <li>
                <Link href="/unsorted" className="hover:text-red-600 transition-colors">
                  Товары без сортировки
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 sm:mb-6 text-sm">Для покупателя</h4>
            <ul className="space-y-3 sm:space-y-4 text-[13px] text-gray-600">
              <li>
                <Link href="/offer" className="hover:text-red-600 transition-colors">
                  Оферта и политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-red-600 transition-colors">
                  Условия обмена и возврата
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="hover:text-red-600 transition-colors">
                  Оплата и доставка
                </Link>
              </li>
              <li>
                <Link href="/loyalty" className="hover:text-red-600 transition-colors">
                  Программа лояльности
                </Link>
              </li>
            </ul>
          </div>
          <div className="sm:col-span-2 lg:col-span-2 flex flex-col sm:items-end sm:text-right justify-start pt-2 sm:pt-0">
            <div className="mb-6 sm:mb-8">
              <a
                href="tel:+79025565242"
                className="font-black text-xl sm:text-2xl text-gray-900 tracking-tight hover:text-red-600 transition-colors"
              >
                +79025565242
              </a>
              <div className="text-[11px] text-gray-500 mt-1">только Max (не для звонков)</div>
            </div>
            <div>
              <a
                href="https://t.me/ducatiparts"
                className="font-black text-lg sm:text-xl text-gray-900 tracking-tight hover:text-red-600 transition-colors"
              >
                @ducatiparts
              </a>
              <div className="text-[11px] text-gray-500 mt-1">наш Telegram для связи</div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <Link
            href="/"
            className="flex items-center group cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
          >
            <div className="flex -skew-x-12 mr-3 overflow-hidden shadow-[0_0_1px_rgba(0,0,0,0.1)]">
              <div className="w-3 h-7 bg-[#009246]"></div>
              <div className="w-3 h-7 bg-white"></div>
              <div className="w-3 h-7 bg-[#ce2b37]"></div>
            </div>
            <div className="flex flex-col uppercase">
              <div className="font-black whitespace-nowrap tracking-tight text-[12px] sm:text-[13px] leading-tight text-gray-900">
                Запчасти в{' '}
                <span className="bg-black text-white px-1 leading-snug inline-block">наличии</span>
              </div>
              <div className="text-[9px] leading-none mt-0.5 text-gray-500 font-bold tracking-widest">
                Для мотоциклов дукати
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex pt-1 gap-1">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 opacity-90 mix-blend-multiply"></div>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-yellow-500 opacity-90 mix-blend-multiply -ml-3"></div>
            </div>
            <div className="font-black text-blue-900 text-lg sm:text-xl italic tracking-tighter">VISA</div>
            <div className="font-black text-green-600 text-base sm:text-lg tracking-tighter">МИР</div>
          </div>
        </div>

        <button
          onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 lg:absolute lg:-right-2 lg:top-1/2 lg:-translate-y-1/2 lg:bottom-auto bg-black hover:bg-gray-900 text-white p-3 rounded-sm transition-colors shadow-lg z-40"
          aria-label="Наверх"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
    </footer>
  );
}
