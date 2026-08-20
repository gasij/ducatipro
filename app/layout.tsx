import type {Metadata} from 'next';
import {Montserrat} from 'next/font/google';
import './globals.css';
import {getSiteTexts} from '@/src/fsd/shared/lib';
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

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const siteTexts = await getSiteTexts();

  return (
    <html lang="ru">
      <body className={`${montserrat.variable} app-shell`} suppressHydrationWarning>
        <Header siteTexts={siteTexts} />
        <main className="app-main">
          {children}
        </main>
        <Footer siteTexts={siteTexts} />
      </body>
    </html>
  );
}
