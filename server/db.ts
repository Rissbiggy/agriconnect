import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is available, but don't throw an error
// This allows us to use in-memory storage when no database is available
let pool;
let db;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
  console.log("PostgreSQL database connected successfully");
} else {
  console.log("No DATABASE_URL found, using in-memory storage instead");
  // Create dummy pool and db objects to prevent errors
  pool = null;
  db = null;
}

export { pool, db };
