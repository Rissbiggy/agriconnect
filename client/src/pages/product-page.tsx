import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Product } from "@shared/schema";
import { Loader2, Star, Heart, Share2, ShoppingCart, Check } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import CartDrawer from "@/components/CartDrawer";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: Number(id),
        quantity: quantity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product?.name} has been added to your cart`,
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

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header onCartClick={() => setIsCartOpen(true)} />
        <main className="flex-1 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header onCartClick={() => setIsCartOpen(true)} />
        <main className="flex-1 flex justify-center items-center">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-lg">Product not found</p>
              <Button className="mt-4 w-full" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header onCartClick={() => setIsCartOpen(true)} />
      
      <main className="flex-1 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="rounded-lg overflow-hidden bg-white shadow-lg">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-96 object-cover"
              />
            </div>
            
            {/* Product Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                    <p className="text-gray-500">Fresh from the farm</p>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-700 font-medium">{product.rating}</span>
                    <span className="text-gray-500">({product.reviewCount} reviews)</span>
                  </div>
                </div>
                
                {product.isOrganic && (
                  <Badge className="w-fit bg-green-100 text-green-800 hover:bg-green-200">Organic</Badge>
                )}
                
                <div className="mt-2">
                  <p className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
                  <p className="text-gray-500">per {product.unit}</p>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-900">Description</h3>
                  <p className="mt-2 text-gray-600">{product.description}</p>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-900">Quantity</h3>
                  <div className="flex items-center mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </Button>
                    <span className="mx-4 font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 flex space-x-4">
                  <Button
                    className="flex-1 bg-primary hover:bg-primary-dark"
                    size="lg"
                    onClick={() => addToCartMutation.mutate()}
                    disabled={addToCartMutation.isPending}
                  >
                    {addToCartMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="mr-2 h-4 w-4" />
                    )}
                    Add to Cart
                  </Button>
                  
                  <Button variant="outline" size="icon" className="h-12 w-12">
                    <Heart className="h-5 w-5" />
                  </Button>
                  
                  <Button variant="outline" size="icon" className="h-12 w-12">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
                
                {product.isBlockchainVerified && (
                  <div className="flex items-center text-primary">
                    <Check className="h-5 w-5 mr-1" />
                    <span className="text-sm">Blockchain Verified</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-900">Shipping Information</h3>
                  <p className="mt-2 text-gray-600">
                    Free shipping on orders over $50. Usually ships within 1-2 business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Related Products */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* This would be populated with related products */}
            </div>
          </div>
        </div>
      </main>
      
      <BottomNavigation />
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
