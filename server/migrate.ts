import { db } from './db';
import { users, channels, messages } from '@shared/schema';
import { DatabaseStorage } from './database-storage';

// Function to set up the database schema
async function migrateSchema() {
  console.log('Starting database schema migration...');
  
  try {
    // Create tables
    console.log('Creating users table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        online BOOLEAN NOT NULL DEFAULT FALSE,
        last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log('Creating channels table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS channels (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      )
    `);
    
    console.log('Creating messages table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        channel_id INTEGER NOT NULL REFERENCES channels(id),
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log('Tables created successfully');
    
    // Initialize default channels
    const storage = new DatabaseStorage();
    await storage.initializeDefaultChannels();
    
    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Error during database migration:', error);
    throw error;
  }
}

// Export function to be used in the server setup
export default migrateSchema;