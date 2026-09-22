import {getProducts} from '@/src/fsd/entities/product';
import {getCurrentEurToRubRate, getSiteTexts} from '@/src/fsd/shared/lib';
import CheckoutForm from './CheckoutForm';
import styles from './checkout-page.module.css';

export default async function CheckoutPage() {
  const [products, eurToRubRate, siteTexts] = await Promise.all([
    getProducts(),
    getCurrentEurToRubRate(),
    getSiteTexts(),
  ]);

  return (
    <div className={styles.page}>
      <CheckoutForm products={products} eurToRubRate={eurToRubRate} siteTexts={siteTexts} />
    </div>
  );
}
