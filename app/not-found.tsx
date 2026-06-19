import Link from 'next/link';
import styles from './empty-state.module.css';

export default function NotFound() {
  return (
    <div className={`${styles.page} ${styles.largePage}`}>
      <h1 className={`${styles.title} ${styles.notFoundTitle}`}>404</h1>
      <p className={styles.description}>Страница не найдена</p>
      <Link
        href="/"
        className={styles.action}
      >
        На главную
      </Link>
    </div>
  );
}
