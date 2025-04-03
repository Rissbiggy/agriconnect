import { Category } from "@shared/schema";
import { Link } from "wouter";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/?categoryId=${category.id}`}>
      <div className="bg-white rounded-lg shadow-card overflow-hidden group cursor-pointer transition-transform duration-200 hover:-translate-y-1">
        <div className="h-40 bg-gray-200 flex items-center justify-center overflow-hidden">
          <img 
            src={category.imageUrl} 
            alt={category.name} 
            className="h-full w-full object-cover group-hover:opacity-90 transition-opacity"
          />
        </div>
        <div className="p-3 text-center">
          <h3 className="text-sm font-medium text-gray-900 font-heading">{category.name}</h3>
          <p className="mt-1 text-xs text-gray-500">{category.productCount} products</p>
        </div>
      </div>
    </Link>
  );
}
