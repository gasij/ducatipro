import Link from 'next/link';
import {Heart} from 'lucide-react';
import styles from '../empty-state.module.css';

export default function FavoritesPage() {
  return (
    <div className={styles.page}>
      <Heart className={styles.icon} />
      <h1 className={styles.title}>Избранное</h1>
      <p className={styles.description}>Вы ещё не добавили товары в избранное</p>
      <Link
        href="/catalog"
        className={styles.action}
      >
        Перейти в каталог
      </Link>
    </div>
  );
}
