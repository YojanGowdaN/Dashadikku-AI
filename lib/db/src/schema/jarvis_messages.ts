import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { conversations } from "./conversations";

export const jarvisMessages = pgTable("jarvis_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  intent: text("intent"),
  provider: text("provider"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertJarvisMessageSchema = createInsertSchema(jarvisMessages).omit({
  id: true,
  createdAt: true,
});

export type JarvisMessage = typeof jarvisMessages.$inferSelect;
export type InsertJarvisMessage = z.infer<typeof insertJarvisMessageSchema>;
