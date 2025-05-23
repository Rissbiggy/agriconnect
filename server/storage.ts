import { 
  User, InsertUser, Product, InsertProduct, 
  Category, InsertCategory, CartItem, InsertCartItem,
  Order, InsertOrder, OrderItem, InsertOrderItem,
  Article, InsertArticle, Review, InsertReview,
  BlockchainTransaction, InsertBlockchainTransaction,
  users, products, categories, cartItems, orders, orderItems, articles, reviews,
  blockchainTransactions
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, like, desc, sql } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import { NeonDatabase } from "drizzle-orm/neon-serverless";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>; // Admin function
  deleteUser(id: number): Promise<boolean>; // Admin function
  
  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(filters?: { categoryId?: number; search?: string }): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>; // Admin function
  
  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Cart methods
  getCartItems(userId: number): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, userId: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number, userId: number): Promise<boolean>;
  
  // Order methods
  createOrder(orderData: { userId: number; shippingAddress: string; paymentMethod: string }): Promise<Order>;
  getOrder(id: number, userId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>; // Admin function
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>; // Admin function
  
  // Article methods
  getArticle(id: number): Promise<(Article & { expert: User }) | undefined>;
  getAllArticles(): Promise<(Article & { expert: User })[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  
  // Review methods
  createReview(review: InsertReview): Promise<Review>;
  getProductReviews(productId: number): Promise<(Review & { user: User })[]>;
  
  // Blockchain transaction methods
  getBlockchainTransaction(id: string): Promise<BlockchainTransaction | undefined>;
  getAllBlockchainTransactions(): Promise<BlockchainTransaction[]>;
  createBlockchainTransaction(transaction: InsertBlockchainTransaction): Promise<BlockchainTransaction>;
  updateBlockchainTransaction(id: string, transaction: Partial<BlockchainTransaction>): Promise<BlockchainTransaction | undefined>;
  getUserBlockchainTransactions(userId: number): Promise<BlockchainTransaction[]>;
  
  // Session store
  sessionStore: any; // Using any type for session store as Express.SessionStore type issues
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private categories: Map<number, Category>;
  private cartItems: Map<number, CartItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private articles: Map<number, Article>;
  private reviews: Map<number, Review>;
  
  private userIdCounter: number;
  private productIdCounter: number;
  private categoryIdCounter: number;
  private cartItemIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  private articleIdCounter: number;
  private reviewIdCounter: number;
  
  sessionStore: any; // Using any for session store type

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.articles = new Map();
    this.reviews = new Map();
    
    this.userIdCounter = 1;
    this.productIdCounter = 1;
    this.categoryIdCounter = 1;
    this.cartItemIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    this.articleIdCounter = 1;
    this.reviewIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...userData, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getAllProducts(filters?: { categoryId?: number; search?: string }): Promise<Product[]> {
    let products = Array.from(this.products.values());
    
    if (filters?.categoryId) {
      products = products.filter(product => product.categoryId === filters.categoryId);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) || 
        product.description.toLowerCase().includes(searchLower)
      );
    }
    
    return products;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const createdAt = new Date();
    const product: Product = { ...productData, id, createdAt };
    this.products.set(id, product);
    
    // Update category product count
    const category = await this.getCategory(productData.categoryId);
    if (category) {
      await this.updateCategoryProductCount(category.id, category.productCount + 1);
    }
    
    return product;
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.name.toLowerCase() === name.toLowerCase()
    );
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...categoryData, id };
    this.categories.set(id, category);
    return category;
  }

  private async updateCategoryProductCount(categoryId: number, count: number): Promise<void> {
    const category = this.categories.get(categoryId);
    if (category) {
      const updatedCategory = { ...category, productCount: count };
      this.categories.set(categoryId, updatedCategory);
    }
  }

  // Cart methods
  async getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
    const cartItems = Array.from(this.cartItems.values()).filter(item => item.userId === userId);
    
    return Promise.all(cartItems.map(async (item) => {
      const product = await this.getProduct(item.productId);
      return {
        ...item,
        product: product as Product
      };
    }));
  }

  async addToCart(cartItemData: InsertCartItem): Promise<CartItem> {
    // Check if product exists
    const product = await this.getProduct(cartItemData.productId);
    if (!product) {
      throw new Error("Product not found");
    }
    
    // Check if item is already in cart, update quantity if so
    const existingCartItem = Array.from(this.cartItems.values()).find(
      item => item.userId === cartItemData.userId && item.productId === cartItemData.productId
    );
    
    if (existingCartItem) {
      const updatedQuantity = existingCartItem.quantity + (cartItemData.quantity || 1);
      return (await this.updateCartItemQuantity(existingCartItem.id, cartItemData.userId, updatedQuantity)) as CartItem;
    }
    
    // Create new cart item
    const id = this.cartItemIdCounter++;
    const createdAt = new Date();
    const cartItem: CartItem = { ...cartItemData, id, createdAt };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItemQuantity(id: number, userId: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem || cartItem.userId !== userId) return undefined;
    
    const updatedCartItem = { ...cartItem, quantity };
    this.cartItems.set(id, updatedCartItem);
    return updatedCartItem;
  }

  async removeFromCart(id: number, userId: number): Promise<boolean> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem || cartItem.userId !== userId) return false;
    
    return this.cartItems.delete(id);
  }

  // Order methods
  async createOrder(orderData: { userId: number; shippingAddress: string; paymentMethod: string }): Promise<Order> {
    // Get cart items
    const cartItems = await this.getCartItems(orderData.userId);
    
    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }
    
    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);
    
    // Create order
    const id = this.orderIdCounter++;
    const createdAt = new Date();
    const order: Order = {
      id,
      userId: orderData.userId,
      status: "pending",
      totalAmount,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      createdAt
    };
    
    this.orders.set(id, order);
    
    // Create order items
    for (const cartItem of cartItems) {
      const orderItemId = this.orderItemIdCounter++;
      const orderItem: OrderItem = {
        id: orderItemId,
        orderId: order.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        unitPrice: cartItem.product.price
      };
      
      this.orderItems.set(orderItemId, orderItem);
      
      // Remove from cart
      await this.removeFromCart(cartItem.id, orderData.userId);
    }
    
    return order;
  }

  async getOrder(id: number, userId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
    const order = this.orders.get(id);
    
    if (!order || order.userId !== userId) return undefined;
    
    const orderItems = Array.from(this.orderItems.values()).filter(item => item.orderId === id);
    
    const itemsWithProducts = await Promise.all(orderItems.map(async (item) => {
      const product = await this.getProduct(item.productId);
      return {
        ...item,
        product: product as Product
      };
    }));
    
    return {
      ...order,
      items: itemsWithProducts
    };
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }
  
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Article methods
  async getArticle(id: number): Promise<(Article & { expert: User }) | undefined> {
    const article = this.articles.get(id);
    
    if (!article) return undefined;
    
    const expert = await this.getUser(article.expertId);
    
    return {
      ...article,
      expert: expert as User
    };
  }

  async getAllArticles(): Promise<(Article & { expert: User })[]> {
    const articles = Array.from(this.articles.values());
    
    return Promise.all(articles.map(async (article) => {
      const expert = await this.getUser(article.expertId);
      return {
        ...article,
        expert: expert as User
      };
    }));
  }

  async createArticle(articleData: InsertArticle): Promise<Article> {
    const id = this.articleIdCounter++;
    const createdAt = new Date();
    const article: Article = { ...articleData, id, createdAt };
    this.articles.set(id, article);
    return article;
  }

  // Review methods
  async createReview(reviewData: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const createdAt = new Date();
    const review: Review = { ...reviewData, id, createdAt };
    this.reviews.set(id, review);
    
    // Update product rating
    const product = await this.getProduct(reviewData.productId);
    if (product) {
      const productReviews = await this.getProductReviews(reviewData.productId);
      const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / productReviews.length;
      
      await this.updateProduct(product.id, {
        rating: parseFloat(averageRating.toFixed(1)),
        reviewCount: productReviews.length
      });
    }
    
    return review;
  }

  async getProductReviews(productId: number): Promise<(Review & { user: User })[]> {
    const reviews = Array.from(this.reviews.values()).filter(review => review.productId === productId);
    
    return Promise.all(reviews.map(async (review) => {
      const user = await this.getUser(review.userId);
      return {
        ...review,
        user: user as User
      };
    }));
  }
  
  // Blockchain transaction methods
  private blockchainTransactions: Map<string, BlockchainTransaction> = new Map();
  
  async getBlockchainTransaction(id: string): Promise<BlockchainTransaction | undefined> {
    return this.blockchainTransactions.get(id);
  }
  
  async getAllBlockchainTransactions(): Promise<BlockchainTransaction[]> {
    return Array.from(this.blockchainTransactions.values());
  }
  
  async createBlockchainTransaction(transaction: InsertBlockchainTransaction): Promise<BlockchainTransaction> {
    const createdAt = new Date();
    const blockchainTransaction: BlockchainTransaction = { 
      ...transaction, 
      createdAt,
      updatedAt: createdAt,
      status: "pending",
      verificationHash: null
    };
    
    this.blockchainTransactions.set(transaction.id, blockchainTransaction);
    return blockchainTransaction;
  }
  
  async updateBlockchainTransaction(id: string, transaction: Partial<BlockchainTransaction>): Promise<BlockchainTransaction | undefined> {
    const existingTransaction = this.blockchainTransactions.get(id);
    
    if (!existingTransaction) {
      return undefined;
    }
    
    const updatedTransaction = { 
      ...existingTransaction, 
      ...transaction,
      updatedAt: new Date()
    };
    
    this.blockchainTransactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async getUserBlockchainTransactions(userId: number): Promise<BlockchainTransaction[]> {
    return Array.from(this.blockchainTransactions.values()).filter(tx => 
      tx.userId === userId
    );
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any for session store type

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product || undefined;
  }

  async getAllProducts(filters?: { categoryId?: number; search?: string }): Promise<Product[]> {
    let query = db.select().from(products);
    
    if (filters?.categoryId) {
      query = query.where(eq(products.categoryId, filters.categoryId));
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.where(
        sql`${products.name} ILIKE ${searchTerm} OR ${products.description} ILIKE ${searchTerm}`
      );
    }
    
    return await query.orderBy(desc(products.createdAt));
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();
    
    // Update category product count
    await this.updateCategoryProductCount(productData.categoryId);
    
    return product;
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    
    return product || undefined;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name));
    return category || undefined;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  private async updateCategoryProductCount(categoryId: number): Promise<void> {
    // Count products in this category
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(products)
      .where(eq(products.categoryId, categoryId));
    
    const count = result?.count || 0;
    
    // Update category
    await db
      .update(categories)
      .set({ productCount: count })
      .where(eq(categories.id, categoryId));
  }

  // Cart methods
  async getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));
    
    return Promise.all(
      items.map(async (item) => {
        const product = await this.getProduct(item.productId);
        return {
          ...item,
          product: product as Product,
        };
      })
    );
  }

  async addToCart(cartItemData: InsertCartItem): Promise<CartItem> {
    // Check if product exists
    const product = await this.getProduct(cartItemData.productId);
    if (!product) {
      throw new Error("Product not found");
    }
    
    // Check if item is already in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, cartItemData.userId),
          eq(cartItems.productId, cartItemData.productId)
        )
      );
    
    if (existingItem) {
      // Update quantity instead of creating new item
      const newQuantity = existingItem.quantity + (cartItemData.quantity || 1);
      return (await this.updateCartItemQuantity(
        existingItem.id,
        cartItemData.userId,
        newQuantity
      )) as CartItem;
    }
    
    // Create new cart item
    const [cartItem] = await db
      .insert(cartItems)
      .values(cartItemData)
      .returning();
    
    return cartItem;
  }

  async updateCartItemQuantity(id: number, userId: number, quantity: number): Promise<CartItem | undefined> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(
        and(
          eq(cartItems.id, id),
          eq(cartItems.userId, userId)
        )
      )
      .returning();
    
    return updatedItem || undefined;
  }

  async removeFromCart(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.id, id),
          eq(cartItems.userId, userId)
        )
      );
    
    return result.rowCount > 0;
  }

  // Order methods
  async createOrder(orderData: { userId: number; shippingAddress: string; paymentMethod: string }): Promise<Order> {
    // Get cart items
    const cartItemsList = await this.getCartItems(orderData.userId);
    
    if (cartItemsList.length === 0) {
      throw new Error("Cart is empty");
    }
    
    // Calculate total amount
    const totalAmount = cartItemsList.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    
    // Start a transaction
    const order = await db.transaction(async (tx) => {
      // Create order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          userId: orderData.userId,
          status: "pending",
          totalAmount,
          shippingAddress: orderData.shippingAddress,
          paymentMethod: orderData.paymentMethod,
        })
        .returning();
      
      // Create order items
      for (const cartItem of cartItemsList) {
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          unitPrice: cartItem.product.price,
        });
        
        // Remove from cart
        await tx
          .delete(cartItems)
          .where(eq(cartItems.id, cartItem.id));
      }
      
      return newOrder;
    });
    
    return order;
  }

  async getOrder(id: number, userId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, id),
          eq(orders.userId, userId)
        )
      );
    
    if (!order) return undefined;
    
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));
    
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await this.getProduct(item.productId);
        return {
          ...item,
          product: product as Product,
        };
      })
    );
    
    return {
      ...order,
      items: itemsWithProducts,
    };
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }
  
  async getAllOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    
    return order || undefined;
  }

  // Article methods
  async getArticle(id: number): Promise<(Article & { expert: User }) | undefined> {
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id));
    
    if (!article) return undefined;
    
    const expert = await this.getUser(article.expertId);
    
    return {
      ...article,
      expert: expert as User,
    };
  }

  async getAllArticles(): Promise<(Article & { expert: User })[]> {
    const articlesList = await db
      .select()
      .from(articles)
      .orderBy(desc(articles.createdAt));
    
    return Promise.all(
      articlesList.map(async (article) => {
        const expert = await this.getUser(article.expertId);
        return {
          ...article,
          expert: expert as User,
        };
      })
    );
  }

  async createArticle(articleData: InsertArticle): Promise<Article> {
    const [article] = await db
      .insert(articles)
      .values(articleData)
      .returning();
    
    return article;
  }

  // Review methods
  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(reviewData)
      .returning();
    
    // Update product rating
    await this.updateProductRating(reviewData.productId);
    
    return review;
  }

  async getProductReviews(productId: number): Promise<(Review & { user: User })[]> {
    const reviewsList = await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
    
    return Promise.all(
      reviewsList.map(async (review) => {
        const user = await this.getUser(review.userId);
        return {
          ...review,
          user: user as User,
        };
      })
    );
  }

  private async updateProductRating(productId: number): Promise<void> {
    // Calculate average rating
    const [result] = await db
      .select({
        avgRating: sql<number>`AVG(${reviews.rating})`,
        count: sql<number>`COUNT(*)`
      })
      .from(reviews)
      .where(eq(reviews.productId, productId));
    
    if (result) {
      const avgRating = parseFloat(result.avgRating.toFixed(1));
      const count = result.count;
      
      // Update product rating and count
      await db
        .update(products)
        .set({
          rating: avgRating,
          reviewCount: count
        })
        .where(eq(products.id, productId));
    }
  }
  
  // Blockchain transaction methods
  async getBlockchainTransaction(id: string): Promise<BlockchainTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(blockchainTransactions)
      .where(eq(blockchainTransactions.id, id));
    
    return transaction || undefined;
  }
  
  async getAllBlockchainTransactions(): Promise<BlockchainTransaction[]> {
    return await db
      .select()
      .from(blockchainTransactions)
      .orderBy(desc(blockchainTransactions.createdAt));
  }
  
  async createBlockchainTransaction(transaction: InsertBlockchainTransaction): Promise<BlockchainTransaction> {
    const [blockchainTransaction] = await db
      .insert(blockchainTransactions)
      .values({
        ...transaction,
        status: "pending",
        verificationHash: null
      })
      .returning();
    
    return blockchainTransaction;
  }
  
  async updateBlockchainTransaction(id: string, transaction: Partial<BlockchainTransaction>): Promise<BlockchainTransaction | undefined> {
    const [updatedTransaction] = await db
      .update(blockchainTransactions)
      .set({
        ...transaction,
        updatedAt: new Date()
      })
      .where(eq(blockchainTransactions.id, id))
      .returning();
    
    return updatedTransaction || undefined;
  }
  
  async getUserBlockchainTransactions(userId: number): Promise<BlockchainTransaction[]> {
    return await db
      .select()
      .from(blockchainTransactions)
      .where(eq(blockchainTransactions.userId, userId))
      .orderBy(desc(blockchainTransactions.createdAt));
  }
}

/**
 * Initialize the appropriate storage implementation based on database availability
 * This provides a reliable fallback to in-memory storage when database is unavailable
 */
const initializeStorage = (): IStorage => {
  // Simple check for database availability
  if (pool !== null && db !== null) {
    try {
      // Additional validation that pool is working
      if (typeof pool === 'object' && typeof pool.query === 'function') {
        console.log("Using PostgreSQL database for storage");
        return new DatabaseStorage();
      }
    } catch (err) {
      console.error("Database validation failed, using in-memory storage instead:", 
                  err instanceof Error ? err.message : String(err));
    }
  }
  
  // Default to in-memory storage if any check fails
  console.log("Using in-memory storage (database connection not available)");
  return new MemStorage();
};

// Export the appropriate storage implementation
export const storage = initializeStorage();
