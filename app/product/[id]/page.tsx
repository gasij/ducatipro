import {notFound} from 'next/navigation';
import ProductView from '../../../components/ProductView';
import {getProduct, products} from '../../../lib/products';

type Props = {
  params: Promise<{id: string}>;
};

export function generateStaticParams() {
  return products.map((p) => ({id: p.id}));
}

export default async function ProductPage({params}: Props) {
  const {id} = await params;
  const product = getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductView product={product} />;
}
