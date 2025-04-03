import { 
  User, InsertUser, Product, InsertProduct, 
  Category, InsertCategory, CartItem, InsertCartItem,
  Order, InsertOrder, OrderItem, InsertOrderItem,
  Article, InsertArticle, Review, InsertReview
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(filters?: { categoryId?: number; search?: string }): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  
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
  
  // Article methods
  getArticle(id: number): Promise<(Article & { expert: User }) | undefined>;
  getAllArticles(): Promise<(Article & { expert: User })[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  
  // Review methods
  createReview(review: InsertReview): Promise<Review>;
  getProductReviews(productId: number): Promise<(Review & { user: User })[]>;
  
  // Session store
  sessionStore: session.SessionStore;
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
  
  sessionStore: session.SessionStore;

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
}

export const storage = new MemStorage();
