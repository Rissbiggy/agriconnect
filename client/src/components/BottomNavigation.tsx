import { Home, Grid, ShoppingCart, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CartItem } from "@shared/schema";

export default function BottomNavigation() {
  const [location] = useLocation();

  const { data: cartItems } = useQuery<(CartItem & { product: any })[]>({
    queryKey: ["/api/cart"],
  });

  const cartItemCount = cartItems?.length || 0;

  return (
    <div className="bg-white border-t border-gray-200 fixed inset-x-0 bottom-0 z-10 sm:hidden">
      <div className="flex justify-around">
        <Link href="/">
          <a className={`flex-1 pt-2 pb-2 text-center ${location === '/' ? 'text-primary border-t-2 border-primary' : 'text-gray-500'}`}>
            <Home className="h-6 w-6 mx-auto" />
            <span className="text-xs block">Home</span>
          </a>
        </Link>
        <Link href="/?view=categories">
          <a className={`flex-1 pt-2 pb-2 text-center ${location === '/?view=categories' ? 'text-primary border-t-2 border-primary' : 'text-gray-500'}`}>
            <Grid className="h-6 w-6 mx-auto" />
            <span className="text-xs block">Categories</span>
          </a>
        </Link>
        <Link href="/cart">
          <a className={`flex-1 pt-2 pb-2 text-center ${location === '/cart' ? 'text-primary border-t-2 border-primary' : 'text-gray-500'}`}>
            <div className="relative inline-block">
              <ShoppingCart className="h-6 w-6 mx-auto" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary rounded-full">
                  {cartItemCount}
                </span>
              )}
            </div>
            <span className="text-xs block">Cart</span>
          </a>
        </Link>
        <Link href="/profile">
          <a className={`flex-1 pt-2 pb-2 text-center ${location === '/profile' ? 'text-primary border-t-2 border-primary' : 'text-gray-500'}`}>
            <User className="h-6 w-6 mx-auto" />
            <span className="text-xs block">Profile</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
