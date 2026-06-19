import {notFound} from 'next/navigation';
import {getProduct, products} from '@/src/fsd/entities/product';
import {ProductView} from '@/src/fsd/pages/product';

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
