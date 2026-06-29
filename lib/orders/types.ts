export type OrderStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export type OrderItem = {
  product_id: string;
  title: string;
  quantity: number;
  price: number;
  price_formatted: string;
};

export type CreateOrderPayload = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  comment?: string;
  items: OrderItem[];
};

export type DirectusOrder = {
  id: string;
  status: OrderStatus;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  comment: string | null;
  total: number;
  total_formatted: string;
  items: OrderItem[];
  date_created: string;
  date_confirmed: string | null;
  email_sent_at: string | null;
};
