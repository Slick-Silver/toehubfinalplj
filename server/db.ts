import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// Verify database URL exists
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

// Create connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create Drizzle client with schema
export const db = drizzle(pool, { schema });

console.log('Database connection initialized');