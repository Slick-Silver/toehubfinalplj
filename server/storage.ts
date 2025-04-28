import { 
  users, type User, type InsertUser,
  channels, type Channel, type InsertChannel,
  messages, type Message, type InsertMessage,
  type ChatMessage
} from "@shared/schema";

// Storage interface for the application
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: number, online: boolean): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Channel methods
  getChannel(id: number): Promise<Channel | undefined>;
  getChannelByName(name: string): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  getAllChannels(): Promise<Channel[]>;

  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByChannel(channelId: number): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
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
    this.createChannel({ name: "general", description: "General toe discussion" });
    this.createChannel({ name: "toe-tips", description: "Share advice and toe care tips" });
    this.createChannel({ name: "toe-tales", description: "Share funny toe stories" });
    this.createChannel({ name: "toe-support", description: "Get help with your toe issues" });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
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
      (channel) => channel.name.toLowerCase() === name.toLowerCase(),
    );
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const id = this.channelIdCounter++;
    // Ensure description is not undefined
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
}

import { DatabaseStorage } from './database-storage';

// Use the DatabaseStorage implementation
export const storage = new DatabaseStorage();
