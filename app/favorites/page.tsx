import Link from 'next/link';
import {Heart} from 'lucide-react';

export default function FavoritesPage() {
  return (
    <div className="container mx-auto safe-px max-w-7xl pt-10 sm:pt-12 pb-16 sm:pb-24 text-center px-6">
      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-6 stroke-[1.5]" />
      <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-4">Избранное</h1>
      <p className="text-[14px] text-gray-500 mb-8">Вы ещё не добавили товары в избранное</p>
      <Link
        href="/catalog"
        className="inline-block bg-black hover:bg-gray-900 text-white px-8 py-3 rounded-sm font-medium transition-colors text-[13px]"
      >
        Перейти в каталог
      </Link>
    </div>
  );
}
