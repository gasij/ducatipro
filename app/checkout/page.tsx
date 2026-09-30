import {getProductsPage} from '@/src/fsd/entities/product';
import {getCurrentEurToRubRate, getSiteTexts} from '@/src/fsd/shared/lib';
import CheckoutForm from './CheckoutForm';
import styles from './checkout-page.module.css';

export default async function CheckoutPage() {
  // CheckoutForm only needs a fallback product for an empty cart — the real
  // cart items are resolved client-side by id.
  const [{items: products}, eurToRubRate, siteTexts] = await Promise.all([
    getProductsPage(1, 6, {skipCompatibility: true}),
    getCurrentEurToRubRate(),
    getSiteTexts(),
  ]);

  return (
    <div className={styles.page}>
      <CheckoutForm products={products} eurToRubRate={eurToRubRate} siteTexts={siteTexts} />
    </div>
  );
}
