import { eq, asc, and, sql } from 'drizzle-orm';
import { db } from './db';
import { 
  users, type User, type InsertUser,
  channels, type Channel, type InsertChannel,
  messages, type Message, type InsertMessage,
  type ChatMessage
} from "@shared/schema";
import { IStorage } from './storage';

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        online: true,
        lastSeen: new Date()
      })
      .returning();
    return user;
  }

  async updateUserStatus(id: number, online: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ online, lastSeen: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Channel methods
  async getChannel(id: number): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel;
  }

  async getChannelByName(name: string): Promise<Channel | undefined> {
    const [channel] = await db
      .select()
      .from(channels)
      .where(sql`LOWER(${channels.name}) = LOWER(${name})`);
    return channel;
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const [channel] = await db
      .insert(channels)
      .values({
        ...insertChannel,
        description: insertChannel.description || null
      })
      .returning();
    return channel;
  }

  async getAllChannels(): Promise<Channel[]> {
    return db.select().from(channels);
  }

  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
        timestamp: new Date()
      })
      .returning();
    return message;
  }

  async getMessagesByChannel(channelId: number): Promise<ChatMessage[]> {
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
  }

  // Initialize default channels if they don't exist
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