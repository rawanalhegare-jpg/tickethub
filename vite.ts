import { randomUUID } from "crypto";
import type {
  User, Event, Ticket, ResaleListing, IntegrityAlert,
  InsertEvent, InsertTicket, InsertResale, InsertAlert
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id">): Promise<User>;

  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEventSoldSeats(id: string, count: number): Promise<void>;

  getTickets(userId: string): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  createTicket(ticket: Omit<InsertTicket, "purchasedAt"> & { userId: string; eventId: string }): Promise<Ticket>;
  updateTicketStatus(id: string, status: string): Promise<void>;

  getResaleListings(): Promise<ResaleListing[]>;
  getResaleListing(id: string): Promise<ResaleListing | undefined>;
  createResaleListing(listing: Omit<InsertResale, "listedAt"> & { userId: string; ticketId: string }): Promise<ResaleListing>;
  updateResaleStatus(id: string, status: string): Promise<void>;

  getIntegrityAlerts(): Promise<IntegrityAlert[]>;
  createIntegrityAlert(alert: Omit<InsertAlert, "timestamp">): Promise<IntegrityAlert>;

  getAdminStats(): Promise<{ totalTickets: number; activeEvents: number; suspiciousAlerts: number; resaleListings: number; totalRevenue: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private events: Map<string, Event> = new Map();
  private tickets: Map<string, Ticket> = new Map();
  private resaleListings: Map<string, ResaleListing> = new Map();
  private integrityAlerts: Map<string, IntegrityAlert> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    const demoUser: User = {
      id: "user-demo",
      username: "fan_user",
      password: "hashed",
      displayName: "Alex Johnson",
      email: "alex@tickfan.com",
    };
    this.users.set(demoUser.id, demoUser);

    const events: Event[] = [
      {
        id: "evt-1",
        title: "Saudi Pro League Clash",
        sport: "Football",
        homeTeam: "Al Hilal",
        awayTeam: "Al Nassr",
        date: "2026-04-15",
        time: "20:00",
        venue: "King Fahd International Stadium",
        city: "Riyadh",
        country: "Saudi Arabia",
        imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80",
        description: "The biggest clash in Saudi football between two of the most storied clubs. Al Hilal vs Al Nassr promises an electrifying night at King Fahd International Stadium.",
        isActive: true,
        vipPrice: 850,
        premiumPrice: 450,
        regularPrice: 180,
        fanZonePrice: 80,
        totalSeats: 68000,
        soldSeats: 42000,
      },
      {
        id: "evt-2",
        title: "Saudi Derby Day",
        sport: "Football",
        homeTeam: "Al Ittihad",
        awayTeam: "Al Ahli",
        date: "2026-04-22",
        time: "19:30",
        venue: "King Abdullah Sports City",
        city: "Jeddah",
        country: "Saudi Arabia",
        imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80",
        description: "Jeddah derby between the Yellow Tigers and the Red Eagles. A match filled with passion, history, and intense rivalry at one of the most modern stadiums in the region.",
        isActive: true,
        vipPrice: 720,
        premiumPrice: 380,
        regularPrice: 150,
        fanZonePrice: 65,
        totalSeats: 58000,
        soldSeats: 31000,
      },
      {
        id: "evt-3",
        title: "UEFA Champions League Final",
        sport: "Football",
        homeTeam: "Real Madrid",
        awayTeam: "Manchester City",
        date: "2026-05-30",
        time: "21:00",
        venue: "Wembley Stadium",
        city: "London",
        country: "United Kingdom",
        imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80",
        description: "The pinnacle of European club football. Real Madrid face Manchester City in an epic final at Wembley. Don't miss the greatest night in club football.",
        isActive: true,
        vipPrice: 2500,
        premiumPrice: 1200,
        regularPrice: 600,
        fanZonePrice: 250,
        totalSeats: 90000,
        soldSeats: 87000,
      },
      {
        id: "evt-4",
        title: "NBA Finals Game 7",
        sport: "Basketball",
        homeTeam: "Boston Celtics",
        awayTeam: "Golden State Warriors",
        date: "2026-06-18",
        time: "20:30",
        venue: "TD Garden",
        city: "Boston",
        country: "United States",
        imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
        description: "Winner takes all. Game 7 of the NBA Finals between the Boston Celtics and Golden State Warriors. The most electric atmosphere in basketball awaits.",
        isActive: true,
        vipPrice: 3200,
        premiumPrice: 1800,
        regularPrice: 850,
        fanZonePrice: 320,
        totalSeats: 19156,
        soldSeats: 18900,
      },
      {
        id: "evt-5",
        title: "Wimbledon Men's Final",
        sport: "Tennis",
        homeTeam: "Carlos Alcaraz",
        awayTeam: "Novak Djokovic",
        date: "2026-07-13",
        time: "14:00",
        venue: "All England Club",
        city: "London",
        country: "United Kingdom",
        imageUrl: "https://images.unsplash.com/photo-1588338792372-11a80b41a06b?w=800&q=80",
        description: "The Championship on the sacred grass of Centre Court. Alcaraz defends his title against the legendary Djokovic in what promises to be an all-time classic.",
        isActive: true,
        vipPrice: 4500,
        premiumPrice: 2200,
        regularPrice: 900,
        fanZonePrice: 350,
        totalSeats: 15000,
        soldSeats: 14800,
      },
    ];

    events.forEach(e => this.events.set(e.id, e));

    const tickets: Ticket[] = [
      {
        id: "tkt-1",
        eventId: "evt-1",
        userId: "user-demo",
        category: "VIP",
        price: 850,
        section: "A",
        row: "3",
        seat: "12",
        status: "active",
        purchasedAt: "2026-03-05T10:30:00Z",
      },
      {
        id: "tkt-2",
        eventId: "evt-3",
        userId: "user-demo",
        category: "Premium",
        price: 1200,
        section: "C",
        row: "8",
        seat: "22",
        status: "active",
        purchasedAt: "2026-03-08T14:15:00Z",
      },
      {
        id: "tkt-3",
        eventId: "evt-4",
        userId: "user-demo",
        category: "Regular",
        price: 850,
        section: "Upper East",
        row: "15",
        seat: "7",
        status: "resale",
        purchasedAt: "2026-02-28T09:00:00Z",
      },
    ];

    tickets.forEach(t => this.tickets.set(t.id, t));

    const resaleListings: ResaleListing[] = [
      {
        id: "res-1",
        ticketId: "tkt-3",
        userId: "user-demo",
        price: 1100,
        originalPrice: 850,
        listedAt: "2026-03-10T08:00:00Z",
        status: "active",
      },
      {
        id: "res-2",
        ticketId: "fake-tkt-1",
        userId: "user-other",
        price: 750,
        originalPrice: 600,
        listedAt: "2026-03-09T11:00:00Z",
        status: "active",
      },
      {
        id: "res-3",
        ticketId: "fake-tkt-2",
        userId: "user-other-2",
        price: 280,
        originalPrice: 250,
        listedAt: "2026-03-08T16:30:00Z",
        status: "active",
      },
    ];

    resaleListings.forEach(r => this.resaleListings.set(r.id, r));

    const alerts: IntegrityAlert[] = [
      {
        id: "alrt-1",
        type: "Bulk Purchase Attempt",
        description: "Account attempted to purchase 12 tickets simultaneously for Champions League Final",
        riskScore: 92,
        status: "High Risk",
        userId: "user-suspicious-1",
        timestamp: "2026-03-10T07:42:00Z",
        details: "IP: 185.220.101.x | Device: Bot Agent | Purchases: 12 | Velocity: 0.8s avg",
      },
      {
        id: "alrt-2",
        type: "Bot-Like Behavior",
        description: "Abnormal purchase speed detected - 8 tickets in 3 seconds from same device fingerprint",
        riskScore: 87,
        status: "High Risk",
        userId: "user-suspicious-2",
        timestamp: "2026-03-10T06:15:00Z",
        details: "Request interval: 342ms | Human avg: 4200ms | Confidence: 94%",
      },
      {
        id: "alrt-3",
        type: "Suspicious Resale Price",
        description: "NBA Finals ticket listed at 380% of face value - exceeds platform maximum",
        riskScore: 74,
        status: "Suspicious",
        userId: "user-suspicious-3",
        timestamp: "2026-03-09T22:10:00Z",
        details: "Original: $850 | Listed: $3,230 | Markup: 380% | Platform max: 150%",
      },
      {
        id: "alrt-4",
        type: "Duplicate Ticket Scan",
        description: "Same QR code scanned at two different entry gates within 5 minutes",
        riskScore: 95,
        status: "High Risk",
        userId: "user-suspicious-4",
        timestamp: "2026-03-09T19:55:00Z",
        details: "Gate A scan: 19:48 | Gate C scan: 19:53 | Distance: 400m | Impossible travel",
      },
      {
        id: "alrt-5",
        type: "Account Activity Pattern",
        description: "New account created and purchased 6 tickets within 2 hours of account creation",
        riskScore: 61,
        status: "Suspicious",
        userId: "user-suspicious-5",
        timestamp: "2026-03-09T15:30:00Z",
        details: "Account age: 1h 48m | Tickets: 6 | Events: 2 | Payment cards: 3",
      },
      {
        id: "alrt-6",
        type: "Identity Verification Flag",
        description: "Profile photo mismatch detected with government ID verification",
        riskScore: 45,
        status: "Suspicious",
        userId: "user-suspicious-6",
        timestamp: "2026-03-09T11:20:00Z",
        details: "Confidence score: 38% match | AI model: FaceVerify v3.2 | Action: Manual review",
      },
      {
        id: "alrt-7",
        type: "Normal Purchase",
        description: "Regular ticket purchase verified - no anomalies detected",
        riskScore: 8,
        status: "Safe",
        userId: "user-demo",
        timestamp: "2026-03-08T14:15:00Z",
        details: "Human behavior score: 96% | Device: Known | Payment: Verified",
      },
    ];

    alerts.forEach(a => this.integrityAlerts.set(a.id, a));
  }

  async getUser(id: string) { return this.users.get(id); }
  async getUserByUsername(username: string) {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  async createUser(user: Omit<User, "id">): Promise<User> {
    const id = randomUUID();
    const u: User = { ...user, id };
    this.users.set(id, u);
    return u;
  }

  async getEvents() { return Array.from(this.events.values()); }
  async getEvent(id: string) { return this.events.get(id); }
  async createEvent(event: InsertEvent): Promise<Event> {
    const id = `evt-${randomUUID()}`;
    const e: Event = { ...event, id, soldSeats: 0 };
    this.events.set(id, e);
    return e;
  }
  async updateEventSoldSeats(id: string, count: number) {
    const e = this.events.get(id);
    if (e) this.events.set(id, { ...e, soldSeats: e.soldSeats + count });
  }

  async getTickets(userId: string) {
    return Array.from(this.tickets.values()).filter(t => t.userId === userId);
  }
  async getTicket(id: string) { return this.tickets.get(id); }
  async createTicket(data: { eventId: string; userId: string; category: string; price: number; section: string; row: string; seat: string }): Promise<Ticket> {
    const id = `tkt-${randomUUID()}`;
    const t: Ticket = {
      id,
      eventId: data.eventId,
      userId: data.userId,
      category: data.category,
      price: data.price,
      section: data.section,
      row: data.row,
      seat: data.seat,
      status: "active",
      purchasedAt: new Date().toISOString(),
    };
    this.tickets.set(id, t);
    return t;
  }
  async updateTicketStatus(id: string, status: string) {
    const t = this.tickets.get(id);
    if (t) this.tickets.set(id, { ...t, status });
  }

  async getResaleListings() { return Array.from(this.resaleListings.values()); }
  async getResaleListing(id: string) { return this.resaleListings.get(id); }
  async createResaleListing(data: { ticketId: string; userId: string; price: number; originalPrice: number }): Promise<ResaleListing> {
    const id = `res-${randomUUID()}`;
    const r: ResaleListing = {
      id,
      ticketId: data.ticketId,
      userId: data.userId,
      price: data.price,
      originalPrice: data.originalPrice,
      listedAt: new Date().toISOString(),
      status: "active",
    };
    this.resaleListings.set(id, r);
    return r;
  }
  async updateResaleStatus(id: string, status: string) {
    const r = this.resaleListings.get(id);
    if (r) this.resaleListings.set(id, { ...r, status });
  }

  async getIntegrityAlerts() { return Array.from(this.integrityAlerts.values()).sort((a, b) => b.riskScore - a.riskScore); }
  async createIntegrityAlert(alert: Omit<InsertAlert, "timestamp">): Promise<IntegrityAlert> {
    const id = `alrt-${randomUUID()}`;
    const a: IntegrityAlert = { ...alert, id, timestamp: new Date().toISOString() };
    this.integrityAlerts.set(id, a);
    return a;
  }

  async getAdminStats() {
    const tickets = Array.from(this.tickets.values());
    const events = Array.from(this.events.values());
    const resales = Array.from(this.resaleListings.values());
    const alerts = Array.from(this.integrityAlerts.values());
    return {
      totalTickets: tickets.length,
      activeEvents: events.filter(e => e.isActive).length,
      suspiciousAlerts: alerts.filter(a => a.status !== "Safe").length,
      resaleListings: resales.filter(r => r.status === "active").length,
      totalRevenue: tickets.reduce((sum, t) => sum + t.price, 0),
    };
  }
}

export const storage = new MemStorage();
