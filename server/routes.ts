import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertCartItemSchema, 
  insertProductSchema, 
  insertCategorySchema, 
  insertReviewSchema,
  insertBlockchainTransactionSchema 
} from "@shared/schema";
import { blockchainService } from "./blockchain";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add healthcheck route for Replit
  app.get("/healthcheck", (req, res) => {
    console.log("Healthcheck endpoint accessed");
    res.status(200).send("OK");
  });
  
  // Add root route for Replit detection
  app.get("/", (req, res) => {
    console.log("Root endpoint accessed");
    res.status(200).send("AgriConnect server is running. Access the application through the web view.");
  });
  
  // Add explicit API root route
  app.get("/api", (req, res) => {
    console.log("API root endpoint accessed");
    res.status(200).json({ message: "AgriConnect API is running", status: "online" });
  });
  
  // Setup authentication routes
  await setupAuth(app);

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get category by ID
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.getCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const search = req.query.search as string | undefined;
      
      const products = await storage.getAllProducts({ categoryId, search });
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get product by ID
  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Add a new product (requires authentication)
  app.post("/api/products", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (req.user.role !== "farmer" && req.user.role !== "supplier") {
        return res.status(403).json({ message: "Only farmers and suppliers can add products" });
      }

      const validatedData = insertProductSchema.parse({
        ...req.body,
        sellerId: req.user.id
      });

      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Get user's cart
  app.get("/api/cart", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const cartItems = await storage.getCartItems(req.user.id);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  // Add item to cart
  app.post("/api/cart", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  // Update cart item quantity
  app.patch("/api/cart/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const itemId = parseInt(req.params.id);
      const { quantity } = req.body;

      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ message: "Quantity must be a positive number" });
      }

      const cartItem = await storage.updateCartItemQuantity(itemId, req.user.id, quantity);
      
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  // Remove item from cart
  app.delete("/api/cart/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const itemId = parseInt(req.params.id);
      const success = await storage.removeFromCart(itemId, req.user.id);
      
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Get expert articles
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getAllArticles();
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // Get article by ID
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const article = await storage.getArticle(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // Create order (checkout)
  app.post("/api/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { shippingAddress, paymentMethod } = req.body;

      if (!shippingAddress || !paymentMethod) {
        return res.status(400).json({ message: "Shipping address and payment method are required" });
      }

      const order = await storage.createOrder({
        userId: req.user.id,
        shippingAddress,
        paymentMethod
      });

      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Get user's orders
  app.get("/api/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orders = await storage.getUserOrders(req.user.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get order by ID
  app.get("/api/orders/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId, req.user.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Add a review for a product
  app.post("/api/reviews", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = insertReviewSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Get reviews for a product
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // ADMIN ROUTES
  // Admin authentication middleware
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied: Admin privileges required" });
    }
    next();
  };

  // Get all users (admin only)
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get all orders (admin only)
  app.get("/api/admin/orders", isAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Update order status (admin only)
  app.patch("/api/admin/orders/:id", isAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const order = await storage.updateOrderStatus(orderId, status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Delete product (admin only)
  app.delete("/api/admin/products/:id", isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const success = await storage.deleteProduct(productId);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // BLOCKCHAIN ROUTES
  // Check if blockchain service is active
  app.get("/api/blockchain/status", async (req, res) => {
    try {
      const isActive = blockchainService.isActive();
      const networkId = blockchainService.getNetworkId();
      
      res.json({
        active: isActive,
        networkId,
        mode: isActive ? "connected" : "simulation"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check blockchain status" });
    }
  });

  // Get all blockchain transactions
  app.get("/api/blockchain/transactions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const transactions = await blockchainService.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blockchain transactions" });
    }
  });

  // Get blockchain transaction by ID
  app.get("/api/blockchain/transactions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const txId = req.params.id;
      const transaction = await blockchainService.getTransaction(txId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blockchain transaction" });
    }
  });

  // Create a new blockchain transaction
  app.post("/api/blockchain/transactions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { fromAddress, toAddress, amount, productId, orderId } = req.body;
      
      if (!fromAddress || !toAddress || !amount) {
        return res.status(400).json({ message: "From address, to address, and amount are required" });
      }
      
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      
      const userId = req.user?.id;
      
      const transaction = await blockchainService.createTransaction(
        fromAddress,
        toAddress,
        amount,
        productId,
        orderId,
        userId
      );
      
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to create blockchain transaction" });
    }
  });

  // Confirm a blockchain transaction (delivery confirmation)
  app.post("/api/blockchain/transactions/:id/confirm", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const txId = req.params.id;
      const success = await blockchainService.confirmDelivery(txId);
      
      if (!success) {
        return res.status(404).json({ message: "Transaction not found or confirmation failed" });
      }
      
      res.json({ message: "Transaction confirmed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to confirm blockchain transaction" });
    }
  });
  
  // Get current user's blockchain transactions
  app.get("/api/blockchain/user/transactions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user!.id;
      const transactions = await storage.getUserBlockchainTransactions(userId);
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user blockchain transactions" });
    }
  });

  // Verify a blockchain transaction
  app.get("/api/blockchain/transactions/:id/verify", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const txId = req.params.id;
      const transaction = await blockchainService.verifyTransaction(txId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found or verification failed" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to verify blockchain transaction" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
