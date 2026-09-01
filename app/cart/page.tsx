import {getProducts} from '@/src/fsd/entities/product';
import {getCurrentEurToRubRate, getSiteTexts} from '@/src/fsd/shared/lib';
import CartClient from './CartClient';

type CartItemParam = {
  product_id: string;
  quantity: number;
};

function parseCartItems(value?: string | string[]): CartItemParam[] {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (
          !item ||
          typeof item !== 'object' ||
          typeof (item as CartItemParam).product_id !== 'string' ||
          typeof (item as CartItemParam).quantity !== 'number'
        ) {
          return null;
        }

        return {
          product_id: (item as CartItemParam).product_id,
          quantity: Math.min(Math.max(Math.floor((item as CartItemParam).quantity), 1), 99),
        };
      })
      .filter((item): item is CartItemParam => Boolean(item));
  } catch {
    return [];
  }
}

export default async function CartPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [products, eurToRubRate, siteTexts] = await Promise.all([
    getProducts(),
    getCurrentEurToRubRate(),
    getSiteTexts(),
  ]);
  const cartItem = products.find((product) => product.id === '1') ?? products[0];
  const sharedItems = parseCartItems(params?.items);

  if (!cartItem) {
    return null;
  }

  return (
    <CartClient
      initialItem={cartItem}
      products={products}
      sharedItems={sharedItems}
      eurToRubRate={eurToRubRate}
      siteTexts={siteTexts}
    />
  );
}
