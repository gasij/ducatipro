export {default as ProductCard} from './ui/ProductCard';
export type {ArticleSearchResult, Product, ProductsPageResult, ProductSitemapEntry} from './model/products';
export {
  searchProductsByArticle,
  getAllProductArticles,
  getProduct,
  getProductArticle,
  getProductHref,
  getProducts,
  getProductsPage,
  getProductsByCategory,
  hasProductCategory,
  products,
} from './model/products';
