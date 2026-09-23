export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped_to_warehouse'
  | 'shipped_to_client'
  | 'cancelled'
  | 'delivery_agreement';

export type OrderItem = {
  product_id: string;
  product_title: string;
  product_sku: string;
  product_old_sku?: string | null;
  quantity: number;
  price: number | string;
  price_eur?: number | string;
  date_created?: string;
};

export type CreateOrderInputItem = {
  product_id: string;
  quantity: number;
};

export type CreateOrderPayload = {
  customer_name: string;
  phone: string;
  email: string;
  city: string;
  postal_address: string;
  comment?: string;
  payment_method: string;
  delivery_method: string;
  agreed_to_terms: boolean;
  items: CreateOrderInputItem[];
};

export type DirectusOrder = {
  id: string;
  order_number: string | null;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  email: string;
  city: string;
  postal_address: string;
  comment: string | null;
  total: number | string;
  processing_fee_eur?: number | string;
  delivery_price_eur?: number | string;
  total_eur?: number | string;
  payment_method: string;
  delivery_method: string;
  agreed_to_terms: boolean;
  items: OrderItem[] | null;
  date_created: string;
  email_sent_at?: string | null;
};
