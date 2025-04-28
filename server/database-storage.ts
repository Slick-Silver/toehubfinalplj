import { eq, asc, and, sql } from 'drizzle-orm';
import { db, pool } from './db';
import { 
  users, type User, type InsertUser,
  channels, type Channel, type InsertChannel,
  messages, type Message, type InsertMessage,
  type ChatMessage
} from "@shared/schema";
import { IStorage } from './storage';

// Flag to track if database is available
let isDatabaseAvailable = false;

// Check database availability
(async () => {
  try {
    await pool.query('SELECT NOW()');
    isDatabaseAvailable = true;
    console.log('Database is available for storage operations');
  } catch (error) {
    isDatabaseAvailable = false;
    console.warn('Database is not available, using in-memory fallback storage');
  }
})();

// In-memory storage fallback
class InMemoryStorage implements IStorage {
  private users: Map<number, User>;
  private channels: Map<number, Channel>;
  private messages: Map<number, Message>;
  private userIdCounter: number;
  private channelIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.channels = new Map();
    this.messages = new Map();
    this.userIdCounter = 1;
    this.channelIdCounter = 1;
    this.messageIdCounter = 1;

    // Initialize with toe-themed channels
    this.initializeDefaultChannels();
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      online: true, 
      lastSeen: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStatus(id: number, online: boolean): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      online, 
      lastSeen: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Channel methods
  async getChannel(id: number): Promise<Channel | undefined> {
    return this.channels.get(id);
  }

  async getChannelByName(name: string): Promise<Channel | undefined> {
    return Array.from(this.channels.values()).find(
      (channel) => channel.name.toLowerCase() === name.toLowerCase()
    );
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const id = this.channelIdCounter++;
    const channel: Channel = { 
      ...insertChannel, 
      id,
      description: insertChannel.description || null 
    };
    this.channels.set(id, channel);
    return channel;
  }

  async getAllChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }

  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      timestamp: new Date() 
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByChannel(channelId: number): Promise<ChatMessage[]> {
    const channelMessages = Array.from(this.messages.values())
      .filter(message => message.channelId === channelId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Convert to ChatMessage type with username included
    return Promise.all(channelMessages.map(async message => {
      const user = await this.getUser(message.userId);
      return {
        id: message.id,
        content: message.content,
        userId: message.userId,
        username: user?.username || "Unknown",
        channelId: message.channelId,
        timestamp: message.timestamp.toISOString()
      };
    }));
  }

  // Initialize default channels
  async initializeDefaultChannels(): Promise<void> {
    const defaultChannels = [
      { name: "general", description: "General toe discussion" },
      { name: "toe-tips", description: "Share advice and toe care tips" },
      { name: "toe-tales", description: "Share funny toe stories" },
      { name: "toe-support", description: "Get help with your toe issues" }
    ];

    for (const channel of defaultChannels) {
      const existing = await this.getChannelByName(channel.name);
      if (!existing) {
        await this.createChannel(channel);
        console.log(`Created default channel: ${channel.name}`);
      }
    }
  }
}

// Create fallback memory storage
const memStorage = new InMemoryStorage();

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    if (!isDatabaseAvailable) {
      return memStorage.getUser(id);
    }
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Database error in getUser:', error);
      return memStorage.getUser(id);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!isDatabaseAvailable) {
      return memStorage.getUserByUsername(username);
    }
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.username}) = LOWER(${username})`);
      return user;
    } catch (error) {
      console.error('Database error in getUserByUsername:', error);
      return memStorage.getUserByUsername(username);
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!isDatabaseAvailable) {
      return memStorage.createUser(insertUser);
    }
    try {
      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          online: true,
          lastSeen: new Date()
        })
        .returning();
      return user;
    } catch (error) {
      console.error('Database error in createUser:', error);
      return memStorage.createUser(insertUser);
    }
  }

  async updateUserStatus(id: number, online: boolean): Promise<User | undefined> {
    if (!isDatabaseAvailable) {
      return memStorage.updateUserStatus(id, online);
    }
    try {
      const [user] = await db
        .update(users)
        .set({ online, lastSeen: new Date() })
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error) {
      console.error('Database error in updateUserStatus:', error);
      return memStorage.updateUserStatus(id, online);
    }
  }

  async getAllUsers(): Promise<User[]> {
    if (!isDatabaseAvailable) {
      return memStorage.getAllUsers();
    }
    try {
      return db.select().from(users);
    } catch (error) {
      console.error('Database error in getAllUsers:', error);
      return memStorage.getAllUsers();
    }
  }

  // Channel methods
  async getChannel(id: number): Promise<Channel | undefined> {
    if (!isDatabaseAvailable) {
      return memStorage.getChannel(id);
    }
    try {
      const [channel] = await db.select().from(channels).where(eq(channels.id, id));
      return channel;
    } catch (error) {
      console.error('Database error in getChannel:', error);
      return memStorage.getChannel(id);
    }
  }

  async getChannelByName(name: string): Promise<Channel | undefined> {
    if (!isDatabaseAvailable) {
      return memStorage.getChannelByName(name);
    }
    try {
      const [channel] = await db
        .select()
        .from(channels)
        .where(sql`LOWER(${channels.name}) = LOWER(${name})`);
      return channel;
    } catch (error) {
      console.error('Database error in getChannelByName:', error);
      return memStorage.getChannelByName(name);
    }
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    if (!isDatabaseAvailable) {
      return memStorage.createChannel(insertChannel);
    }
    try {
      const [channel] = await db
        .insert(channels)
        .values({
          ...insertChannel,
          description: insertChannel.description || null
        })
        .returning();
      return channel;
    } catch (error) {
      console.error('Database error in createChannel:', error);
      return memStorage.createChannel(insertChannel);
    }
  }

  async getAllChannels(): Promise<Channel[]> {
    if (!isDatabaseAvailable) {
      return memStorage.getAllChannels();
    }
    try {
      return db.select().from(channels);
    } catch (error) {
      console.error('Database error in getAllChannels:', error);
      return memStorage.getAllChannels();
    }
  }

  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    if (!isDatabaseAvailable) {
      return memStorage.createMessage(insertMessage);
    }
    try {
      const [message] = await db
        .insert(messages)
        .values({
          ...insertMessage,
          timestamp: new Date()
        })
        .returning();
      return message;
    } catch (error) {
      console.error('Database error in createMessage:', error);
      return memStorage.createMessage(insertMessage);
    }
  }

  async getMessagesByChannel(channelId: number): Promise<ChatMessage[]> {
    if (!isDatabaseAvailable) {
      return memStorage.getMessagesByChannel(channelId);
    }
    try {
      const result = await db
        .select({
          id: messages.id,
          content: messages.content,
          userId: messages.userId,
          username: users.username,
          channelId: messages.channelId,
          timestamp: messages.timestamp
        })
        .from(messages)
        .innerJoin(users, eq(messages.userId, users.id))
        .where(eq(messages.channelId, channelId))
        .orderBy(asc(messages.timestamp));

      return result.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }));
    } catch (error) {
      console.error('Database error in getMessagesByChannel:', error);
      return memStorage.getMessagesByChannel(channelId);
    }
  }

  // Initialize default channels if they don't exist
  async initializeDefaultChannels(): Promise<void> {
    if (!isDatabaseAvailable) {
      return memStorage.initializeDefaultChannels();
    }
    
    try {
      const defaultChannels = [
        { name: "general", description: "General toe discussion" },
        { name: "toe-tips", description: "Share advice and toe care tips" },
        { name: "toe-tales", description: "Share funny toe stories" },
        { name: "toe-support", description: "Get help with your toe issues" }
      ];

      for (const channel of defaultChannels) {
        const existing = await this.getChannelByName(channel.name);
        if (!existing) {
          await this.createChannel(channel);
          console.log(`Created default channel: ${channel.name}`);
        }
      }
    } catch (error) {
      console.error('Database error in initializeDefaultChannels:', error);
      return memStorage.initializeDefaultChannels();
    }
  }
}