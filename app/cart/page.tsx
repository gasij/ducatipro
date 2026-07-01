import {getProduct} from '@/src/fsd/entities/product';
import CartClient from './CartClient';

export default async function CartPage() {
  const cartItem = await getProduct('1');

  if (!cartItem) {
    return null;
  }

  return <CartClient initialItem={cartItem} />;
}
