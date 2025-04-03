import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Product, Category, Order, Article } from "@shared/schema";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Edit, Trash2, Plus, RefreshCw, Eye, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Redirect } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Fetch data for the admin dashboard
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  // Check if user is admin, if not redirect to home
  if (!user || user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  // Define dashboard stats
  const stats = [
    { title: "Total Users", value: users?.length || 0, color: "bg-blue-100 text-blue-800" },
    { title: "Total Products", value: products?.length || 0, color: "bg-green-100 text-green-800" },
    { title: "Total Orders", value: orders?.length || 0, color: "bg-orange-100 text-orange-800" },
    { title: "Total Categories", value: categories?.length || 0, color: "bg-purple-100 text-purple-800" },
  ];

  const isLoading = usersLoading || productsLoading || ordersLoading || categoriesLoading;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
  };

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "User deleted successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/products/${productId}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Product deleted successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${orderId}`, { status });
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Order status updated successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update order status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header onCartClick={() => setIsCartOpen(true)} />
      
      <main className="flex-1 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your marketplace platform</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                        <div className={`inline-flex px-2 py-1 rounded-full text-sm font-semibold ${stat.color}`}>
                          {stat.value}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Main Content */}
              <Card className="border shadow-sm">
                <CardHeader className="bg-white p-4 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Admin Management</CardTitle>
                      <CardDescription>Manage users, products, orders, and categories</CardDescription>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          type="search"
                          placeholder="Search..."
                          className="w-full sm:w-[300px] pl-8"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </form>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                      <TabsTrigger 
                        value="overview"
                        className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-gray-500 data-[state=active]:border-primary data-[state=active]:text-primary"
                      >
                        Overview
                      </TabsTrigger>
                      <TabsTrigger 
                        value="users"
                        className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-gray-500 data-[state=active]:border-primary data-[state=active]:text-primary"
                      >
                        Users
                      </TabsTrigger>
                      <TabsTrigger 
                        value="products"
                        className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-gray-500 data-[state=active]:border-primary data-[state=active]:text-primary"
                      >
                        Products
                      </TabsTrigger>
                      <TabsTrigger 
                        value="orders"
                        className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-gray-500 data-[state=active]:border-primary data-[state=active]:text-primary"
                      >
                        Orders
                      </TabsTrigger>
                      <TabsTrigger 
                        value="categories"
                        className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-gray-500 data-[state=active]:border-primary data-[state=active]:text-primary"
                      >
                        Categories
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="p-4">
                      <div className="rounded-md bg-blue-50 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-blue-800">Welcome to the Admin Dashboard</h3>
                            <div className="mt-2 text-sm text-blue-700">
                              <p>
                                Here you can manage all aspects of the AgriConnect marketplace. Use the tabs above to navigate between different sections.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Recent Users</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>User</TableHead>
                                  <TableHead>Role</TableHead>
                                  <TableHead>Joined</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {users?.slice(0, 5).map((user) => (
                                  <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.fullName}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Order ID</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Amount</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {orders?.slice(0, 5).map((order) => (
                                  <TableRow key={order.id}>
                                    <TableCell className="font-medium">#{order.id}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          order.status === "delivered" ? "success" :
                                          order.status === "processing" ? "warning" :
                                          order.status === "cancelled" ? "destructive" : "outline"
                                        }
                                      >
                                        {order.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    {/* Users Tab */}
                    <TabsContent value="users" className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">User Management</h3>
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add User
                        </Button>
                      </div>
                      
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Joined Date</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users?.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={user.profileImage || undefined} />
                                      <AvatarFallback>
                                        {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="font-medium">{user.fullName}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{user.role}</Badge>
                                </TableCell>
                                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete ${user.fullName}?`)) {
                                        deleteUserMutation.mutate(user.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    
                    {/* Products Tab */}
                    <TabsContent value="products" className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Product Management</h3>
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Product
                        </Button>
                      </div>
                      
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products?.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {product.imageUrl && (
                                      <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="h-10 w-10 rounded object-cover"
                                      />
                                    )}
                                    <div className="font-medium">{product.name}</div>
                                  </div>
                                </TableCell>
                                <TableCell>${product.price.toFixed(2)}</TableCell>
                                <TableCell>{product.stock}</TableCell>
                                <TableCell>
                                  {categories?.find(c => c.id === product.categoryId)?.name || 'Unknown'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
                                        deleteProductMutation.mutate(product.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    
                    {/* Orders Tab */}
                    <TabsContent value="orders" className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Order Management</h3>
                        <Button 
                          variant="outline"
                          className="gap-2"
                          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] })}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Refresh
                        </Button>
                      </div>
                      
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order ID</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders?.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">#{order.id}</TableCell>
                                <TableCell>
                                  {users?.find(u => u.id === order.userId)?.fullName || 'Unknown'}
                                </TableCell>
                                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                                <TableCell>
                                  <select
                                    className="rounded-md border-gray-300 text-sm focus:border-primary focus:ring-primary"
                                    value={order.status}
                                    onChange={(e) => {
                                      updateOrderStatusMutation.mutate({
                                        orderId: order.id,
                                        status: e.target.value
                                      });
                                    }}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Order #{order.id} Details</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <h4 className="text-sm font-medium">Customer Information</h4>
                                          <p className="text-sm text-gray-500">
                                            {users?.find(u => u.id === order.userId)?.fullName}<br />
                                            {users?.find(u => u.id === order.userId)?.email}
                                          </p>
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-medium">Shipping Address</h4>
                                          <p className="text-sm text-gray-500">{order.shippingAddress}</p>
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-medium">Payment Method</h4>
                                          <p className="text-sm text-gray-500">{order.paymentMethod}</p>
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-medium">Total Amount</h4>
                                          <p className="text-sm font-bold">${order.totalAmount.toFixed(2)}</p>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    
                    {/* Categories Tab */}
                    <TabsContent value="categories" className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Category Management</h3>
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Category
                        </Button>
                      </div>
                      
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Category</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Products</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categories?.map((category) => (
                              <TableRow key={category.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {category.imageUrl && (
                                      <img
                                        src={category.imageUrl}
                                        alt={category.name}
                                        className="h-10 w-10 rounded object-cover"
                                      />
                                    )}
                                    <div className="font-medium">{category.name}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{category.description}</TableCell>
                                <TableCell>{category.productCount}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}