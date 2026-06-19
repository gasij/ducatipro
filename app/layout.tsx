import type {Metadata} from 'next';
import './globals.css';
import {Footer} from '@/src/fsd/widgets/footer';
import {Header} from '@/src/fsd/widgets/header';

export const metadata: Metadata = {
  title: 'Запчасти в наличии для мотоциклов дукати',
  description: 'Аутлет, запчасти, тюнинг для Ducati',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ru">
      <body className="antialiased text-gray-900 bg-white min-h-screen flex flex-col overflow-x-hidden" suppressHydrationWarning>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
