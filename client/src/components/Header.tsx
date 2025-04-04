import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, Search, User, Settings, LogOut, Menu, X, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CartItem } from "@shared/schema";

interface HeaderProps {
  onCartClick: () => void;
}

export default function Header({ onCartClick }: HeaderProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cartItems } = useQuery<(CartItem & { product: any })[]>({
    queryKey: ["/api/cart"],
  });

  const cartItemCount = cartItems?.length || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search functionality
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : "U";

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="text-primary font-heading font-bold text-2xl cursor-pointer">AgriConnect</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/">
                <a className={`${location === '/' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Home
                </a>
              </Link>
              <Link href="/?view=categories">
                <a className={`${location === '/?view=categories' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Categories
                </a>
              </Link>
              <Link href="/?view=experts">
                <a className={`${location === '/?view=experts' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Experts
                </a>
              </Link>
              <Link href="/orders">
                <a className={`${location === '/orders' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  My Orders
                </a>
              </Link>
              <Link href="/blockchain">
                <a className={`${location === '/blockchain' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  <Database className="h-4 w-4 mr-1" />
                  Blockchain
                </a>
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <form onSubmit={handleSearch} className="relative mx-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search products"
                className="block w-full pl-10 pr-3 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={onCartClick}
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-3">
                  <Avatar>
                    <AvatarImage src={user?.profileImage} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Your Profile</span>
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link to="/admin">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open main menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link href="/">
            <a className={`${location === '/' ? 'bg-primary-light border-primary text-white' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              Home
            </a>
          </Link>
          <Link href="/?view=categories">
            <a className={`${location === '/?view=categories' ? 'bg-primary-light border-primary text-white' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              Categories
            </a>
          </Link>
          <Link href="/?view=experts">
            <a className={`${location === '/?view=experts' ? 'bg-primary-light border-primary text-white' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              Experts
            </a>
          </Link>
          <Link href="/orders">
            <a className={`${location === '/orders' ? 'bg-primary-light border-primary text-white' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              My Orders
            </a>
          </Link>
          <Link href="/blockchain">
            <a className={`${location === '/blockchain' ? 'bg-primary-light border-primary text-white' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center`}>
              <Database className="h-4 w-4 mr-1" />
              Blockchain
            </a>
          </Link>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="flex items-center px-4">
            <div className="flex-shrink-0">
              <Avatar>
                <AvatarImage src={user?.profileImage} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800">{user?.fullName}</div>
              <div className="text-sm font-medium text-gray-500">{user?.email}</div>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto relative" onClick={onCartClick}>
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </div>
          <div className="mt-3 space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <User className="mr-2 h-4 w-4" />
              <span>Your Profile</span>
            </Button>
            {user?.role === 'admin' && (
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </Button>
            )}
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
