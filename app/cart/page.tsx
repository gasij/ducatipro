import {getProducts} from '@/src/fsd/entities/product';
import CartClient from './CartClient';

export default async function CartPage() {
  const products = await getProducts();
  const cartItem = products.find((product) => product.id === '1') ?? products[0];

  if (!cartItem) {
    return null;
  }

  return <CartClient initialItem={cartItem} products={products} />;
}
