export const CART_STORAGE_KEY = 'ducati-cart';
export const CART_UPDATED_EVENT = 'ducati-cart-updated';

export type StoredCartItem = {
  product_id: string;
  quantity: number;
};

export function readStoredCart(): StoredCartItem[] {
  try {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = rawCart ? (JSON.parse(rawCart) as unknown) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const productId = (item as StoredCartItem).product_id;
        const quantity = (item as StoredCartItem).quantity;

        if (typeof productId !== 'string' || typeof quantity !== 'number') {
          return null;
        }

        return {
          product_id: productId,
          quantity: Math.min(Math.max(Math.floor(quantity), 1), 99),
        };
      })
      .filter((item): item is StoredCartItem => Boolean(item));
  } catch {
    return [];
  }
}

export function getStoredCartQuantity() {
  return readStoredCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function addToStoredCart(productId: string, quantity = 1) {
  const cart = readStoredCart();
  const existing = cart.find((item) => item.product_id === productId);

  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, 99);
  } else {
    cart.push({product_id: productId, quantity});
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  notifyCartUpdated();
}

export function notifyCartUpdated() {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}
