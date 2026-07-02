export type OrderStatus = 'pending' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export type OrderItem = {
  product_id: string;
  product_title: string;
  product_sku: string;
  quantity: number;
  price: number;
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
  cdek_address?: string;
  comment?: string;
  payment_method: string;
  delivery_method: string;
  agreed_to_terms: boolean;
  items: CreateOrderInputItem[];
};

export type DirectusOrder = {
  id: string;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  email: string;
  city: string;
  postal_address: string;
  cdek_address: string | null;
  comment: string | null;
  total: number;
  payment_method: string;
  delivery_method: string;
  agreed_to_terms: boolean;
  items: OrderItem[] | null;
  date_created: string;
  email_sent_at?: string | null;
};
