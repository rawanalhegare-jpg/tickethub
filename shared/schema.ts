import { pgTable, text, varchar, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  sport: text("sport").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  venue: text("venue").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  vipPrice: integer("vip_price").notNull(),
  premiumPrice: integer("premium_price").notNull(),
  regularPrice: integer("regular_price").notNull(),
  fanZonePrice: integer("fan_zone_price").notNull(),
  totalSeats: integer("total_seats").notNull(),
  soldSeats: integer("sold_seats").notNull().default(0),
});

export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey(),
  eventId: varchar("event_id").notNull(),
  userId: varchar("user_id").notNull(),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  section: text("section").notNull(),
  row: text("row").notNull(),
  seat: text("seat").notNull(),
  status: text("status").notNull().default("active"),
  purchasedAt: text("purchased_at").notNull(),
});

export const resaleListings = pgTable("resale_listings", {
  id: varchar("id").primaryKey(),
  ticketId: varchar("ticket_id").notNull(),
  userId: varchar("user_id").notNull(),
  price: integer("price").notNull(),
  originalPrice: integer("original_price").notNull(),
  listedAt: text("listed_at").notNull(),
  status: text("status").notNull().default("active"),
});

export const integrityAlerts = pgTable("integrity_alerts", {
  id: varchar("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  riskScore: integer("risk_score").notNull(),
  status: text("status").notNull(),
  userId: varchar("user_id"),
  timestamp: text("timestamp").notNull(),
  details: text("details").notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true, soldSeats: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, purchasedAt: true });
export const insertResaleSchema = createInsertSchema(resaleListings).omit({ id: true, listedAt: true });
export const insertAlertSchema = createInsertSchema(integrityAlerts).omit({ id: true, timestamp: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type ResaleListing = typeof resaleListings.$inferSelect;
export type InsertResale = z.infer<typeof insertResaleSchema>;
export type IntegrityAlert = typeof integrityAlerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export const ticketCategories = ["VIP", "Premium", "Regular", "Fan Zone"] as const;
export type TicketCategory = typeof ticketCategories[number];

export const ticketStatuses = ["active", "used", "resale", "sold"] as const;
export type TicketStatus = typeof ticketStatuses[number];

export const resaleStatuses = ["active", "sold", "cancelled"] as const;
export type ResaleStatus = typeof resaleStatuses[number];

export const alertStatuses = ["Safe", "Suspicious", "High Risk"] as const;
export type AlertStatus = typeof alertStatuses[number];
