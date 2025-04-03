import { useQuery } from "@tanstack/react-query";
import { Category, Product, Article } from "@shared/schema";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import ExpertAdviceCard from "@/components/ExpertAdviceCard";
import BlockchainBanner from "@/components/BlockchainBanner";
import PartnershipSection from "@/components/PartnershipSection";
import BottomNavigation from "@/components/BottomNavigation";
import { Loader2 } from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import { useState } from "react";

export default function HomePage() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: articles, isLoading: articlesLoading } = useQuery<(Article & { expert: any })[]>({
    queryKey: ["/api/articles"],
  });

  const isLoading = categoriesLoading || productsLoading || articlesLoading;

  return (
    <div className="flex flex-col min-h-screen">
      <Header onCartClick={() => setIsCartOpen(true)} />
      
      <main className="flex-1 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <HeroBanner />

          {/* Categories Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 font-heading">Browse Categories</h2>
              <a href="#" className="text-primary hover:text-primary-dark flex items-center text-sm font-medium">
                View All
                <svg className="ml-1 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories?.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            )}
          </section>

          {/* Featured Products */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 font-heading">Featured Products</h2>
              <a href="#" className="text-primary hover:text-primary-dark flex items-center text-sm font-medium">
                View All
                <svg className="ml-1 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products?.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>

          {/* Expert Advice Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 font-heading">Expert Advice</h2>
              <a href="#" className="text-primary hover:text-primary-dark flex items-center text-sm font-medium">
                View All
                <svg className="ml-1 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {articles?.slice(0, 3).map((article) => (
                  <ExpertAdviceCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </section>

          {/* Blockchain Security */}
          <BlockchainBanner />

          {/* Government Partnerships */}
          <PartnershipSection />
        </div>
      </main>
      
      <BottomNavigation />
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
