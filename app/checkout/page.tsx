import {getProducts} from '@/src/fsd/entities/product';
import {getCurrentEurToRubRate, getRateMarkupPercent, getSiteTexts} from '@/src/fsd/shared/lib';
import CheckoutForm from './CheckoutForm';
import styles from './checkout-page.module.css';

export default async function CheckoutPage() {
  const [products, eurToRubRate, rateMarkupPercent, siteTexts] = await Promise.all([
    getProducts(),
    getCurrentEurToRubRate(),
    getRateMarkupPercent(),
    getSiteTexts(),
  ]);

  return (
    <div className={styles.page}>
      <CheckoutForm
        products={products}
        eurToRubRate={eurToRubRate}
        rateMarkupPercent={rateMarkupPercent}
        siteTexts={siteTexts}
      />
    </div>
  );
}
