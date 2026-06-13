import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto safe-px max-w-7xl pt-16 sm:pt-24 pb-16 sm:pb-24 text-center">
      <h1 className="text-4xl font-black text-gray-900 mb-4">404</h1>
      <p className="text-gray-500 mb-8">Страница не найдена</p>
      <Link
        href="/"
        className="inline-block bg-black hover:bg-gray-900 text-white px-8 py-3 rounded-sm font-medium transition-colors"
      >
        На главную
      </Link>
    </div>
  );
}
