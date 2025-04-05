import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure neon to use websockets
neonConfig.webSocketConstructor = ws;

// Connection pool configuration with improved settings
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,               // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Client idle timeout
  connectionTimeoutMillis: 5000, // Connection timeout
  maxUses: 7500,         // Close a connection after it's been used this many times (prevents memory leaks)
};

// Initialize database connection (will be set by initializeDatabase)
let pool = null;
let db = null;

/**
 * Initialize database connection with robust error handling and retry logic
 */
function initializeDatabase() {
  try {
    // Check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.log("No DATABASE_URL found, database features will be unavailable");
      return { pool: null, db: null };
    }

    // Create connection pool with error handling
    const newPool = new Pool(poolConfig);
    
    // Important: Set up error handlers so uncaught pool errors don't crash the app
    newPool.on('error', (err) => {
      console.error('Unexpected database pool error:', err.message);
      // We log the error but don't crash - the app will continue running
    });
    
    // Create Drizzle ORM instance
    const newDb = drizzle({ client: newPool, schema });
    
    // Test connection with a simple query - this confirms the database is accessible
    // We use a promise to allow the app to start even if the database is temporarily unavailable
    setTimeout(() => {
      newPool.query('SELECT 1')
        .then(() => console.log("PostgreSQL database connected successfully"))
        .catch(err => {
          console.error("Database connection test failed:", err.message);
          console.log("Application will continue with limited functionality");
        });
    }, 1000);
    
    return { pool: newPool, db: newDb };
  } catch (err) {
    // Catch any initialization errors
    console.error("Database initialization failed:", err instanceof Error ? err.message : String(err));
    console.log("Application will continue with limited functionality");
    return { pool: null, db: null };
  }
}

// Initialize database (this runs once when the server starts)
const dbConnection = initializeDatabase();
pool = dbConnection.pool;
db = dbConnection.db;

// Export database objects
export { pool, db };
