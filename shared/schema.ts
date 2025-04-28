import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  online: boolean("online").notNull().default(false),
  lastSeen: timestamp("last_seen", { mode: 'date' }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
});

// Channel schema
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertChannelSchema = createInsertSchema(channels).pick({
  name: true,
  description: true,
});

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  channelId: integer("channel_id").notNull().references(() => channels.id),
  timestamp: timestamp("timestamp", { mode: 'date' }).notNull().defaultNow(),
});

// Message relations
export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id]
  }),
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id]
  })
}));

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  userId: true,
  channelId: true,
});

// Define the relations after all tables are defined
export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages)
}));

export const channelsRelations = relations(channels, ({ many }) => ({
  messages: many(messages)
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// WebSocket message types
export type WebSocketMessage = {
  type: string;
  payload: any;
};

export type ChatMessage = {
  id: number;
  content: string;
  userId: number;
  username: string;
  channelId: number;
  timestamp: string;
};

export type UserStatus = {
  userId: number;
  username: string;
  online: boolean;
};
