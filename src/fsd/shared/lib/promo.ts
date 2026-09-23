const PROMO_STORAGE_KEY = 'ducati-applied-promo';

export type PromoValidationResult =
  | {valid: true; code: string; discountType: 'percent' | 'fixed_eur'; discountValue: number; discountAmountEur: number}
  | {valid: false; message: string};

export function readAppliedPromoCode(): string | null {
  try {
    return window.localStorage.getItem(PROMO_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeAppliedPromoCode(code: string | null) {
  try {
    if (code) {
      window.localStorage.setItem(PROMO_STORAGE_KEY, code);
    } else {
      window.localStorage.removeItem(PROMO_STORAGE_KEY);
    }
  } catch {
  }
}

export async function checkPromoCode(code: string, subtotalEur: number): Promise<PromoValidationResult> {
  const res = await fetch('/api/promo', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({code, subtotal_eur: subtotalEur}),
  }).catch(() => null);

  if (!res || !res.ok) {
    return {valid: false, message: 'Не удалось проверить промокод, попробуйте позже'};
  }

  return (await res.json()) as PromoValidationResult;
}
