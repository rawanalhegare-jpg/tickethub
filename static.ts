import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { query, queryOne } from "./db";
import { hashPassword, verifyPassword, requireAuth } from "./auth";
import { getAllMatches, getMatches, getMatch, getStandings, getCompetitions } from "./football-api";

function generateTicketId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "TF";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function generateSeat(category: string): { section: string; row: string; seat: string } {
  const rows = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const rand = (n: number) => Math.floor(Math.random() * n);
  switch (category) {
    case "vip":
      return { section: `VIP-${String.fromCharCode(65 + rand(3))}`, row: rows[rand(5)], seat: String(rand(20) + 1) };
    case "premium":
      return { section: `PREM-${String.fromCharCode(65 + rand(4))}`, row: rows[rand(8)], seat: String(rand(30) + 1) };
    case "fanZone":
      return { section: `ZONE-${String.fromCharCode(65 + rand(4))}`, row: rows[rand(12)], seat: String(rand(60) + 1) };
    default:
      return { section: `G${rand(5) + 1}`, row: rows[rand(10)], seat: String(rand(40) + 1) };
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── AUTH ─────────────────────────────────────────────────────────────────

  const registerSchema = z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().email(),
    password: z.string().min(6),
    displayName: z.string().optional(),
  });

  app.post("/api/auth/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const { username, email, password, displayName } = parsed.data;
    const exists = await queryOne("SELECT id FROM tf_users WHERE username=$1 OR email=$2", [username, email]);
    if (exists) return res.status(409).json({ error: "Username or email already taken" });

    const password_hash = hashPassword(password);
    const user = await queryOne<{ id: number; username: string; email: string; display_name: string }>(
      "INSERT INTO tf_users(username,email,password_hash,display_name) VALUES($1,$2,$3,$4) RETURNING id,username,email,display_name",
      [username, email, password_hash, displayName || username]
    );

    (req.session as any).userId = user!.id;
    (req.session as any).username = user!.username;
    (req.session as any).displayName = user!.display_name;
    res.json({ id: user!.id, username: user!.username, email: user!.email, displayName: user!.display_name });
  });

  const loginSchema = z.object({ username: z.string(), password: z.string() });

  app.post("/api/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

    const { username, password } = parsed.data;
    const user = await queryOne<{ id: number; username: string; email: string; display_name: string; password_hash: string }>(
      "SELECT id,username,email,display_name,password_hash FROM tf_users WHERE username=$1 OR email=$1", [username]
    );

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    (req.session as any).userId = user.id;
    (req.session as any).username = user.username;
    (req.session as any).displayName = user.display_name;
    res.json({ id: user.id, username: user.username, email: user.email, displayName: user.display_name });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  app.get("/api/auth/me", async (req, res) => {
    const sess = req.session as any;
    if (!sess.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await queryOne<{ id: number; username: string; email: string; display_name: string }>(
      "SELECT id,username,email,display_name FROM tf_users WHERE id=$1", [sess.userId]
    );
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json({ id: user.id, username: user.username, email: user.email, displayName: user.display_name });
  });

  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    const sess = req.session as any;
    const { displayName } = req.body;
    if (!displayName || typeof displayName !== "string" || displayName.trim().length < 1) {
      return res.status(400).json({ error: "Display name is required" });
    }
    const user = await queryOne<{ id: number; username: string; email: string; display_name: string }>(
      "UPDATE tf_users SET display_name=$1 WHERE id=$2 RETURNING id,username,email,display_name",
      [displayName.trim(), sess.userId]
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    (req.session as any).displayName = user.display_name;
    res.json({ id: user.id, username: user.username, email: user.email, displayName: user.display_name });
  });

  // ── FOOTBALL DATA ─────────────────────────────────────────────────────────

  app.get("/api/leagues", async (_req, res) => {
    res.json(await getCompetitions());
  });

  app.get("/api/matches", async (req, res) => {
    const { league, dateFrom, dateTo, status } = req.query as Record<string, string>;
    try {
      let matches = league ? await getMatches(league, dateFrom, dateTo) : await getAllMatches();
      if (status && status !== "all") matches = matches.filter((m: any) => m.status === status);
      res.json(matches);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/matches/:id", async (req, res) => {
    try {
      const match = await getMatch(req.params.id);
      if (!match) return res.status(404).json({ error: "Match not found" });
      res.json(match);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/leagues/:code/matches", async (req, res) => {
    try { res.json(await getMatches(req.params.code)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/leagues/:code/standings", async (req, res) => {
    try { res.json(await getStandings(req.params.code)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── BOOKINGS ─────────────────────────────────────────────────────────────

  const bookingSchema = z.object({
    matchId: z.string(),
    matchData: z.record(z.any()),
    category: z.enum(["vip", "premium", "regular", "fanZone"]),
    seats: z.number().int().min(1).max(10),
  });

  app.post("/api/bookings", requireAuth, async (req, res) => {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const sess = req.session as any;
    const { matchId, matchData, category, seats } = parsed.data;
    const priceMap: Record<string, number> = {
      vip: matchData.prices?.vip || 500,
      premium: matchData.prices?.premium || 250,
      regular: matchData.prices?.regular || 100,
      fanZone: matchData.prices?.fanZone || 50,
    };
    const price = priceMap[category] * seats;
    const ticketId = generateTicketId();
    const seatInfo = generateSeat(category);

    const booking = await queryOne(
      `INSERT INTO tf_bookings(user_id,match_id,match_data,category,price,seats,status,ticket_id,section,row_label,seat_number)
       VALUES($1,$2,$3,$4,$5,$6,'confirmed',$7,$8,$9,$10) RETURNING *`,
      [sess.userId, matchId, JSON.stringify(matchData), category, price, seats,
       ticketId, seatInfo.section, seatInfo.row, seatInfo.seat]
    );
    res.json(booking);
  });

  app.get("/api/bookings/my", requireAuth, async (req, res) => {
    const sess = req.session as any;
    const bookings = await query(
      "SELECT * FROM tf_bookings WHERE user_id=$1 ORDER BY created_at DESC", [sess.userId]
    );
    res.json(bookings);
  });

  app.delete("/api/bookings/:id", requireAuth, async (req, res) => {
    const sess = req.session as any;
    const result = await queryOne(
      "UPDATE tf_bookings SET status='cancelled' WHERE id=$1 AND user_id=$2 RETURNING id",
      [req.params.id, sess.userId]
    );
    if (!result) return res.status(404).json({ error: "Booking not found" });
    res.json({ success: true });
  });

  // List for resale (with 10% fair resale cap)
  app.post("/api/bookings/:id/resell", requireAuth, async (req, res) => {
    const sess = req.session as any;
    const { resalePrice } = req.body;
    if (!resalePrice || resalePrice < 1) return res.status(400).json({ error: "Invalid resale price" });

    const booking = await queryOne<any>(
      "SELECT * FROM tf_bookings WHERE id=$1 AND user_id=$2 AND status='confirmed'",
      [req.params.id, sess.userId]
    );
    if (!booking) return res.status(404).json({ error: "Booking not found or not eligible for resale" });

    const maxAllowed = Math.round(booking.price * 1.10);
    if (resalePrice > maxAllowed) {
      await queryOne(
        "INSERT INTO tf_resale_blocks(booking_id,user_id,attempted_price,max_allowed_price) VALUES($1,$2,$3,$4)",
        [booking.id, sess.userId, resalePrice, maxAllowed]
      );
      return res.status(400).json({
        error: "Resale price exceeds fair resale policy",
        maxAllowed,
        originalPrice: booking.price,
        policy: "TickFan limits resale to 10% above the original ticket price to protect fans from scalping.",
      });
    }

    const updated = await queryOne(
      "UPDATE tf_bookings SET status='listed_resale', resale_price=$1 WHERE id=$2 RETURNING *",
      [resalePrice, req.params.id]
    );
    res.json(updated);
  });

  // ── VALIDATE TICKET (Scanner) ─────────────────────────────────────────────

  app.post("/api/validate-ticket", async (req, res) => {
    const { ticketId } = req.body;
    if (!ticketId) return res.status(400).json({ result: "invalid", message: "No ticket ID provided" });

    const booking = await queryOne<any>(
      `SELECT b.*, u.display_name, u.username
       FROM tf_bookings b
       JOIN tf_users u ON u.id = b.user_id
       WHERE b.ticket_id=$1`,
      [ticketId.toUpperCase().trim()]
    );

    if (!booking) {
      await queryOne(
        "INSERT INTO tf_scan_logs(ticket_id,result,note) VALUES($1,'invalid','Ticket not found')",
        [ticketId]
      );
      return res.json({ result: "invalid", message: "Invalid ticket — not found in system" });
    }

    const md = booking.match_data || {};
    const matchInfo = md.homeTeam?.shortName && md.awayTeam?.shortName
      ? `${md.homeTeam.shortName} vs ${md.awayTeam.shortName}`
      : "Unknown match";

    if (booking.status === "used") {
      await queryOne(
        "INSERT INTO tf_scan_logs(ticket_id,result,holder_name,match_info,note) VALUES($1,'already_used',$2,$3,'Duplicate scan attempt')",
        [ticketId, booking.display_name, matchInfo]
      );
      return res.json({
        result: "already_used",
        message: "Ticket already used — entry denied",
        ticket: {
          ticketId: booking.ticket_id,
          holderName: booking.display_name,
          matchInfo,
          category: booking.category,
          section: booking.section,
          row: booking.row_label,
          seat: booking.seat_number,
          status: booking.status,
        },
      });
    }

    if (booking.status === "cancelled") {
      await queryOne(
        "INSERT INTO tf_scan_logs(ticket_id,result,holder_name,match_info,note) VALUES($1,'invalid',$2,$3,'Cancelled ticket')",
        [ticketId, booking.display_name, matchInfo]
      );
      return res.json({ result: "invalid", message: "Ticket is cancelled" });
    }

    if (booking.status === "listed_resale" || booking.status === "transferred") {
      await queryOne(
        "INSERT INTO tf_scan_logs(ticket_id,result,holder_name,match_info,note) VALUES($1,'invalid',$2,$3,'Ticket ownership transferred')",
        [ticketId, booking.display_name, matchInfo]
      );
      return res.json({ result: "invalid", message: "Invalid — ticket has been transferred or is listed for resale" });
    }

    if (booking.status === "confirmed") {
      await queryOne(
        "UPDATE tf_bookings SET status='used' WHERE ticket_id=$1", [ticketId]
      );
      await queryOne(
        "INSERT INTO tf_scan_logs(ticket_id,result,holder_name,match_info,note) VALUES($1,'valid',$2,$3,'Entry granted')",
        [ticketId, booking.display_name, matchInfo]
      );
      return res.json({
        result: "valid",
        message: "Ticket validated — entry granted",
        ticket: {
          ticketId: booking.ticket_id,
          holderName: booking.display_name,
          matchInfo,
          category: booking.category,
          section: booking.section,
          row: booking.row_label,
          seat: booking.seat_number,
          status: "used",
          competitionName: md.competitionName,
          utcDate: md.utcDate,
          venue: md.venue,
        },
      });
    }

    res.json({ result: "invalid", message: "Ticket status unknown" });
  });

  // ── RESALE LISTINGS (DB-backed) ───────────────────────────────────────────

  app.get("/api/resale-listings", async (_req, res) => {
    const listings = await query(
      `SELECT b.*, u.display_name, u.username
       FROM tf_bookings b
       JOIN tf_users u ON u.id = b.user_id
       WHERE b.status='listed_resale'
       ORDER BY b.created_at DESC`
    );
    res.json(listings);
  });

  app.post("/api/resale-listings/:id/buy", requireAuth, async (req, res) => {
    const sess = req.session as any;
    const listing = await queryOne<any>(
      "SELECT * FROM tf_bookings WHERE id=$1 AND status='listed_resale'",
      [req.params.id]
    );
    if (!listing) return res.status(404).json({ error: "Listing not found or no longer available" });
    if (listing.user_id === sess.userId) return res.status(400).json({ error: "Cannot buy your own listing" });

    // Generate new ticket ID for the buyer (old one becomes invalid for anti-fraud)
    const newTicketId = generateTicketId();

    const updated = await queryOne(
      `UPDATE tf_bookings
       SET user_id=$1, status='confirmed', resale_price=NULL, ticket_id=$2, ticket_origin='resale'
       WHERE id=$3 RETURNING *`,
      [sess.userId, newTicketId, req.params.id]
    );

    res.json({ success: true, booking: updated });
  });

  // ── SCAN LOGS ─────────────────────────────────────────────────────────────

  app.get("/api/scan-logs", async (_req, res) => {
    const logs = await query(
      "SELECT * FROM tf_scan_logs ORDER BY scanned_at DESC LIMIT 100"
    );
    res.json(logs);
  });

  // ── FAVORITES ─────────────────────────────────────────────────────────────

  const favoriteSchema = z.object({
    resourceType: z.enum(["team", "match", "competition"]),
    resourceId: z.string(),
    resourceName: z.string(),
    metadata: z.record(z.any()).optional(),
  });

  app.post("/api/favorites/toggle", requireAuth, async (req, res) => {
    const parsed = favoriteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const sess = req.session as any;
    const { resourceType, resourceId, resourceName, metadata } = parsed.data;
    const existing = await queryOne(
      "SELECT id FROM tf_favorites WHERE user_id=$1 AND resource_type=$2 AND resource_id=$3",
      [sess.userId, resourceType, resourceId]
    );
    if (existing) {
      await query("DELETE FROM tf_favorites WHERE id=$1", [(existing as any).id]);
      res.json({ favorited: false });
    } else {
      const fav = await queryOne(
        "INSERT INTO tf_favorites(user_id,resource_type,resource_id,resource_name,metadata) VALUES($1,$2,$3,$4,$5) RETURNING id",
        [sess.userId, resourceType, resourceId, resourceName, JSON.stringify(metadata || {})]
      );
      res.json({ favorited: true, id: (fav as any).id });
    }
  });

  app.post("/api/favorites", requireAuth, async (req, res) => {
    const parsed = favoriteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const sess = req.session as any;
    const { resourceType, resourceId, resourceName, metadata } = parsed.data;
    const existing = await queryOne(
      "SELECT id FROM tf_favorites WHERE user_id=$1 AND resource_type=$2 AND resource_id=$3",
      [sess.userId, resourceType, resourceId]
    );
    if (existing) return res.status(409).json({ error: "Already favorited" });
    const fav = await queryOne(
      "INSERT INTO tf_favorites(user_id,resource_type,resource_id,resource_name,metadata) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [sess.userId, resourceType, resourceId, resourceName, JSON.stringify(metadata || {})]
    );
    res.json(fav);
  });

  app.get("/api/favorites/my", requireAuth, async (req, res) => {
    const sess = req.session as any;
    res.json(await query("SELECT * FROM tf_favorites WHERE user_id=$1 ORDER BY created_at DESC", [sess.userId]));
  });

  app.delete("/api/favorites/:id", requireAuth, async (req, res) => {
    const sess = req.session as any;
    const result = await queryOne(
      "DELETE FROM tf_favorites WHERE id=$1 AND user_id=$2 RETURNING id",
      [req.params.id, sess.userId]
    );
    if (!result) return res.status(404).json({ error: "Favorite not found" });
    res.json({ success: true });
  });

  // ── ADMIN ─────────────────────────────────────────────────────────────────

  app.get("/api/admin/stats", async (_req, res) => {
    const [legacyStats, dbUsers, dbBookings, dbRevenue, dbUsed, dbListed, dbBlocked] = await Promise.all([
      storage.getAdminStats(),
      queryOne<{ count: string }>("SELECT COUNT(*) as count FROM tf_users"),
      queryOne<{ count: string }>("SELECT COUNT(*) as count FROM tf_bookings WHERE status='confirmed'"),
      queryOne<{ total: string }>("SELECT COALESCE(SUM(price),0) as total FROM tf_bookings WHERE status IN ('confirmed','used')"),
      queryOne<{ count: string }>("SELECT COUNT(*) as count FROM tf_bookings WHERE status='used'"),
      queryOne<{ count: string }>("SELECT COUNT(*) as count FROM tf_bookings WHERE status='listed_resale'"),
      queryOne<{ count: string }>("SELECT COUNT(*) as count FROM tf_resale_blocks").catch(() => ({ count: "0" })),
    ]);
    const alerts = await storage.getIntegrityAlerts();
    res.json({
      ...legacyStats,
      totalUsers: parseInt(dbUsers?.count || "0"),
      totalBookings: parseInt(dbBookings?.count || "0"),
      dbRevenue: parseInt(dbRevenue?.total || "0"),
      ticketsUsed: parseInt(dbUsed?.count || "0"),
      ticketsListed: parseInt(dbListed?.count || "0"),
      blockedResale: parseInt(dbBlocked?.count || "0"),
      suspiciousAlerts: alerts.filter(a => a.status === "Suspicious" || a.status === "High Risk").length,
    });
  });

  app.get("/api/admin/users", async (_req, res) => {
    res.json(await query("SELECT id,username,email,display_name,created_at FROM tf_users ORDER BY created_at DESC LIMIT 50"));
  });

  app.get("/api/admin/bookings", async (_req, res) => {
    res.json(await query(
      `SELECT b.*, u.username, u.display_name
       FROM tf_bookings b
       JOIN tf_users u ON u.id = b.user_id
       ORDER BY b.created_at DESC LIMIT 100`
    ));
  });

  // ── LEGACY EVENTS / TICKETS ────────────────────────────────────────────────

  app.get("/api/events", async (_req, res) => res.json(await storage.getEvents()));
  app.get("/api/events/:id", async (req, res) => {
    const event = await storage.getEvent(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  });

  app.get("/api/tickets", async (req, res) => {
    const userId = (req.query.userId as string) || "user-demo";
    res.json(await storage.getTickets(userId));
  });

  app.get("/api/tickets/:id", async (req, res) => {
    const ticket = await storage.getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  });

  const purchaseSchema = z.object({
    eventId: z.string(), category: z.enum(["VIP", "Premium", "Regular", "Fan Zone"]),
    userId: z.string().optional(),
  });

  app.post("/api/tickets/purchase", async (req, res) => {
    const parsed = purchaseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const { eventId, category, userId = "user-demo" } = parsed.data;
    const event = await storage.getEvent(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });
    const priceMap: Record<string, number> = { VIP: event.vipPrice, Premium: event.premiumPrice, Regular: event.regularPrice, "Fan Zone": event.fanZonePrice };
    const sectionMap: Record<string, string> = { VIP: "VIP Lounge", Premium: "Premium West", Regular: "General", "Fan Zone": "Fan Zone South" };
    const ticket = await storage.createTicket({ eventId, userId, category, price: priceMap[category], section: sectionMap[category], row: String(Math.floor(Math.random() * 25) + 1), seat: String(Math.floor(Math.random() * 30) + 1) });
    await storage.updateEventSoldSeats(eventId, 1);
    res.json(ticket);
  });

  app.post("/api/verify-ticket", async (req, res) => {
    const { ticketId } = req.body;
    const ticket = await storage.getTicket(ticketId);
    if (!ticket) return res.status(404).json({ valid: false, message: "Ticket not found" });
    if (ticket.status === "used") return res.json({ valid: false, message: "Ticket already used" });
    if (ticket.status === "resale") return res.json({ valid: false, message: "Ticket is listed for resale" });
    await storage.updateTicketStatus(ticketId, "used");
    res.json({ valid: true, message: "Ticket verified successfully", ticket });
  });

  app.get("/api/resale", async (_req, res) => {
    const listings = await storage.getResaleListings();
    const active = listings.filter(l => l.status === "active");
    const withDetails = await Promise.all(active.map(async l => {
      const ticket = await storage.getTicket(l.ticketId);
      const event = ticket ? await storage.getEvent(ticket.eventId) : null;
      return { ...l, ticket, event };
    }));
    res.json(withDetails);
  });

  const resaleSchema = z.object({ ticketId: z.string(), price: z.number().min(1), userId: z.string().optional() });

  app.post("/api/resale", async (req, res) => {
    const parsed = resaleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const { ticketId, price, userId = "user-demo" } = parsed.data;
    const ticket = await storage.getTicket(ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    if (ticket.status !== "active") return res.status(400).json({ error: "Ticket not available for resale" });
    await storage.updateTicketStatus(ticketId, "resale");
    const listing = await storage.createResaleListing({ ticketId, userId, price, originalPrice: ticket.price });
    res.json(listing);
  });

  app.post("/api/resale/:id/buy", async (req, res) => {
    const listing = await storage.getResaleListing(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.status !== "active") return res.status(400).json({ error: "Listing no longer active" });
    await storage.updateResaleStatus(listing.id, "sold");
    await storage.updateTicketStatus(listing.ticketId, "active");
    res.json({ success: true, message: "Ticket purchased from resale" });
  });

  app.get("/api/integrity/alerts", async (_req, res) => res.json(await storage.getIntegrityAlerts()));

  app.get("/api/user", async (req, res) => {
    const sess = req.session as any;
    if (sess.userId) {
      const user = await queryOne("SELECT id,username,email,display_name FROM tf_users WHERE id=$1", [sess.userId]);
      if (user) return res.json(user);
    }
    res.json({ id: "user-demo", displayName: "Alex Johnson", email: "alex@tickfan.com" });
  });

  return httpServer;
}
