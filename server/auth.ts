import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, UserRole } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "agriconnect-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register a new user
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Remove password before sending back to client
      const { password, ...userWithoutPassword } = user;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login a user
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: Express.User, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        // Remove password before sending back to client
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout a user
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get the current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    // Remove password before sending back to client
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  // Seed some initial data for testing
  await seedInitialData();
}

// Function to seed initial data
async function seedInitialData() {
  try {
    // Check if users exist already
    const existingUser = await storage.getUserByUsername("demo_farmer");
    if (existingUser) {
      return; // Data already seeded
    }

    // Create demo users for different roles
    const users = [
      {
        username: "demo_farmer",
        password: await hashPassword("password123"),
        email: "farmer@example.com",
        fullName: "John Farmer",
        role: UserRole.FARMER,
        phoneNumber: "123-456-7890",
        address: "123 Farm Road",
      },
      {
        username: "demo_buyer",
        password: await hashPassword("password123"),
        email: "buyer@example.com",
        fullName: "Emily Buyer",
        role: UserRole.BUYER,
        phoneNumber: "123-456-7891",
        address: "456 Market Street",
      },
      {
        username: "demo_expert",
        password: await hashPassword("password123"),
        email: "expert@example.com",
        fullName: "Dr. Sarah Expert",
        role: UserRole.EXPERT,
        phoneNumber: "123-456-7892",
        address: "789 University Ave",
      }
    ];

    // Create users
    for (const userData of users) {
      await storage.createUser(userData);
    }

    // Create categories
    const categories = [
      {
        name: "Vegetables",
        description: "Fresh vegetables directly from farmers",
        imageUrl: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=512&q=80",
        productCount: 128
      },
      {
        name: "Fruits",
        description: "Sweet and nutritious fruits",
        imageUrl: "https://images.unsplash.com/photo-1620117654333-c125fef82817?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=512&q=80",
        productCount: 95
      },
      {
        name: "Grains",
        description: "Wholesome grains and cereals",
        imageUrl: "https://images.unsplash.com/photo-1595661467756-2628a3a9d6c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=512&q=80",
        productCount: 64
      },
      {
        name: "Dairy",
        description: "Milk, cheese, and other dairy products",
        imageUrl: "https://images.unsplash.com/photo-1588165171080-c89acfa5a3d1?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=512&q=80",
        productCount: 42
      },
      {
        name: "Seeds",
        description: "Quality seeds for farming",
        imageUrl: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=512&q=80",
        productCount: 37
      },
      {
        name: "Equipment",
        description: "Agricultural tools and equipment",
        imageUrl: "https://images.unsplash.com/photo-1569181841057-5d6959cb1363?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=512&q=80",
        productCount: 53
      }
    ];

    for (const categoryData of categories) {
      await storage.createCategory(categoryData);
    }

    // Create sample products
    const farmer = await storage.getUserByUsername("demo_farmer");
    if (farmer) {
      const vegetablesCategory = await storage.getCategoryByName("Vegetables");
      const fruitsCategory = await storage.getCategoryByName("Fruits");
      const grainsCategory = await storage.getCategoryByName("Grains");
      const dairyCategory = await storage.getCategoryByName("Dairy");

      if (vegetablesCategory && fruitsCategory && grainsCategory && dairyCategory) {
        const products = [
          {
            name: "Organic Tomatoes",
            description: "Fresh and juicy organic tomatoes",
            price: 3.99,
            unit: "kg",
            stock: 100,
            categoryId: vegetablesCategory.id,
            sellerId: farmer.id,
            imageUrl: "https://images.unsplash.com/photo-1466979866588-672cd25cdadd?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80",
            isOrganic: true,
            isBlockchainVerified: true,
            rating: 4.8,
            reviewCount: 24
          },
          {
            name: "Fresh Carrots",
            description: "Crunchy and sweet carrots",
            price: 2.49,
            unit: "kg",
            stock: 150,
            categoryId: vegetablesCategory.id,
            sellerId: farmer.id,
            imageUrl: "https://images.unsplash.com/photo-1550828520-4cb496926fc9?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80",
            isOrganic: false,
            isBlockchainVerified: true,
            rating: 4.5,
            reviewCount: 18
          },
          {
            name: "Organic Brown Rice",
            description: "Nutritious and wholesome organic brown rice",
            price: 5.99,
            unit: "2kg pack",
            stock: 80,
            categoryId: grainsCategory.id,
            sellerId: farmer.id,
            imageUrl: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80",
            isOrganic: true,
            isBlockchainVerified: true,
            rating: 4.7,
            reviewCount: 31
          },
          {
            name: "Fresh Milk",
            description: "Creamy fresh milk from grass-fed cows",
            price: 2.99,
            unit: "liter",
            stock: 60,
            categoryId: dairyCategory.id,
            sellerId: farmer.id,
            imageUrl: "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80",
            isOrganic: false,
            isBlockchainVerified: true,
            rating: 4.9,
            reviewCount: 42
          }
        ];

        for (const productData of products) {
          await storage.createProduct(productData);
        }
      }
    }

    // Create sample expert articles
    const expert = await storage.getUserByUsername("demo_expert");
    
    if (expert) {
      const articles = [
        {
          title: "Sustainable Farming Practices",
          content: "Learn how sustainable farming practices can increase yield while protecting the environment. Implementing crop rotation, reducing chemical inputs, and using water conservation techniques can lead to long-term agricultural sustainability.",
          expertId: expert.id,
          imageUrl: "https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80"
        },
        {
          title: "Seed Selection Guide",
          content: "Choosing the right seeds for your region and climate can dramatically improve your harvest. This guide covers factors such as soil type, growing season length, and local pest pressures to help you select the perfect varieties.",
          expertId: expert.id,
          imageUrl: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80"
        },
        {
          title: "Market Pricing Strategies",
          content: "Learn effective pricing strategies to maximize profits while maintaining competitive appeal. This article discusses market research, value-based pricing, and seasonal pricing adjustments for agricultural products.",
          expertId: expert.id,
          imageUrl: "https://images.unsplash.com/photo-1536657464919-892534f60d6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80"
        }
      ];

      for (const articleData of articles) {
        await storage.createArticle(articleData);
      }
    }

  } catch (error) {
    console.error("Error seeding initial data:", error);
  }
}
