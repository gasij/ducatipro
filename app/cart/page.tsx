import {getProduct} from '@/src/fsd/entities/product';
import CartClient from './CartClient';

export default function CartPage() {
  const cartItem = getProduct('1');

  if (!cartItem) {
    return null;
  }

  return <CartClient initialItem={cartItem} />;
}
