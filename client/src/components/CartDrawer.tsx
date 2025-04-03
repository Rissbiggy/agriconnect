import { useQuery, useMutation } from "@tanstack/react-query";
import { CartItem, Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, ShoppingBag, Minus, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useLocation } from "wouter";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [checkingOut, setCheckingOut] = useState(false);

  const { data: cartItems, isLoading } = useQuery<(CartItem & { product: Product })[]>({
    queryKey: ["/api/cart"],
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest("DELETE", `/api/cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      await apiRequest("PATCH", `/api/cart/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update quantity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/orders", {
        shippingAddress: "Default Address", // In a real app, this would come from a form or user profile
        paymentMethod: "Credit Card", // In a real app, this would come from a form
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order placed successfully",
        description: "Your order has been placed and is being processed",
      });
      setCheckingOut(false);
      onClose();
      navigate("/orders");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive",
      });
      setCheckingOut(false);
    },
  });

  const handleCheckout = () => {
    setCheckingOut(true);
    checkoutMutation.mutate();
  };

  // Calculate total price
  const totalPrice = cartItems?.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity);
  }, 0) || 0;

  const hasItems = cartItems && cartItems.length > 0;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
          <SheetDescription>
            {hasItems ? `${cartItems.length} item(s) in your cart` : "Your cart is empty"}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !hasItems ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <Button onClick={onClose}>Start Shopping</Button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col h-[calc(100vh-12rem)]">
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              <ul className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <li key={item.id} className="py-4 flex">
                    <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                        <p className="text-sm font-medium text-gray-900">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">${item.product.price.toFixed(2)} per {item.product.unit}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantityMutation.mutate({ 
                              itemId: item.id, 
                              quantity: Math.max(1, item.quantity - 1) 
                            })}
                            disabled={updateQuantityMutation.isPending}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="mx-2 text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantityMutation.mutate({ 
                              itemId: item.id, 
                              quantity: item.quantity + 1 
                            })}
                            disabled={updateQuantityMutation.isPending}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-500 hover:text-red-500"
                          onClick={() => removeItemMutation.mutate(item.id)}
                          disabled={removeItemMutation.isPending}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 mt-auto">
              <Separator className="mb-4" />
              <div className="flex justify-between">
                <span className="text-base font-medium text-gray-900">Subtotal</span>
                <span className="text-base font-medium text-gray-900">${totalPrice.toFixed(2)}</span>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout</p>
              <div className="mt-4">
                <Button 
                  className="w-full" 
                  onClick={handleCheckout}
                  disabled={checkoutMutation.isPending || checkingOut}
                >
                  {checkoutMutation.isPending || checkingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Checkout'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full mt-2" 
                  onClick={onClose}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
