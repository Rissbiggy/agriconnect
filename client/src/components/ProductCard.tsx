import { Product } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, ShoppingCart, Check, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const [isAddedToWishlist, setIsAddedToWishlist] = useState(false);
  
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleWishlist = () => {
    setIsAddedToWishlist(!isAddedToWishlist);
    toast({
      title: isAddedToWishlist ? "Removed from wishlist" : "Added to wishlist",
      description: `${product.name} has been ${isAddedToWishlist ? "removed from" : "added to"} your wishlist`,
    });
  };

  return (
    <Card className="bg-white rounded-lg shadow-card overflow-hidden product-card hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        <Link href={`/products/${product.id}`}>
          <img 
            className="h-48 w-full object-cover cursor-pointer" 
            src={product.imageUrl} 
            alt={product.name} 
          />
        </Link>
        
        {product.isOrganic && (
          <div className="absolute top-0 right-0 m-2">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
              Organic
            </Badge>
          </div>
        )}
        
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-0 right-0 m-2 p-2 rounded-full bg-white text-primary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={toggleWishlist}
        >
          <Heart className={`h-5 w-5 ${isAddedToWishlist ? "fill-primary text-primary" : ""}`} />
        </Button>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <Link href={`/products/${product.id}`}>
            <div className="cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">Seller Name</p>
            </div>
          </Link>
          
          <div className="flex items-center">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
            <p className="text-sm text-gray-500">per {product.unit}</p>
          </div>
          
          <Button
            className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md flex items-center text-sm font-medium"
            onClick={() => addToCartMutation.mutate()}
            disabled={addToCartMutation.isPending}
          >
            {addToCartMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4 mr-1" />
            )}
            Add to Cart
          </Button>
        </div>
        
        {product.isBlockchainVerified && (
          <div className="mt-3 flex items-center">
            <Check className="h-5 w-5 text-primary" />
            <span className="ml-1 text-sm text-gray-600">Blockchain Verified</span>
          </div>
        )}
      </div>
    </Card>
  );
}
