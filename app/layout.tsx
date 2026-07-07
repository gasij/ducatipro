import type {Metadata} from 'next';
import {Montserrat} from 'next/font/google';
import './globals.css';
import {Footer} from '@/src/fsd/widgets/footer';
import {Header} from '@/src/fsd/widgets/header';

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-main',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Запчасти в наличии для мотоциклов дукати',
  description: 'Аутлет, запчасти, тюнинг для Ducati',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ru">
      <body className={`${montserrat.variable} app-shell`} suppressHydrationWarning>
        <Header />
        <main className="app-main">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
