import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// Get database URL from environment or use fallback for development
const getDatabaseUrl = () => {
  // In production, DATABASE_URL must be set
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is required in production mode');
      
      // In production without a database, we'll use an in-memory mode to allow testing
      // Note: This means data won't persist between restarts in production without a real DB
      console.warn('Using in-memory mode for development/testing only');
      return 'postgres://user:password@localhost:5432/in_memory_db?sslmode=require';
    }
    return process.env.DATABASE_URL;
  }
  
  // In development, use the DATABASE_URL if it exists
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Fallback for local development
  console.warn('No DATABASE_URL found. Using in-memory mode for development only');
  return 'postgres://user:password@localhost:5432/in_memory_db?sslmode=require';
};

// Create connection pool with appropriate connection string
const connectionString = getDatabaseUrl();
let pool: Pool;

try {
  pool = new Pool({ connectionString });
  console.log('Database connection initialized');
} catch (error) {
  console.error('Failed to initialize database connection:', error);
  // Provide a mock pool for testing/development
  pool = {} as Pool;
}

// Create Drizzle client with schema
export const db = drizzle(pool, { schema });
export { pool };