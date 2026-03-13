import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Ticket, Calendar, ShieldAlert, RefreshCw, DollarSign,
  Users, TrendingUp, CheckCircle2, AlertTriangle, Scan, ShieldCheck
} from "lucide-react";
import type { IntegrityAlert } from "@shared/schema";
import { calcFairScore } from "@/lib/fairScore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const salesData = [
  { month: "Jan", tickets: 1240 }, { month: "Feb", tickets: 1850 }, { month: "Mar", tickets: 2100 },
  { month: "Apr", tickets: 1780 }, { month: "May", tickets: 2900 }, { month: "Jun", tickets: 3200 },
];

const revenueData = [
  { month: "Jan", revenue: 142000 }, { month: "Feb", revenue: 198000 }, { month: "Mar", revenue: 235000 },
  { month: "Apr", revenue: 210000 }, { month: "May", revenue: 345000 }, { month: "Jun", revenue: 412000 },
];

function StatCard({ icon: Icon, title, value, sub, color }: { icon: any; title: string; value: string; sub?: string; color: string }) {
  return (
    <Card className="p-5 border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-gray-900 mb-0.5" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </Card>
  );
}

interface AdminStats {
  totalTickets: number;
  activeEvents: number;
  suspiciousAlerts: number;
  resaleListings: number;
  totalRevenue: number;
  totalUsers: number;
  totalBookings: number;
  dbRevenue: number;
  ticketsUsed: number;
  ticketsListed: number;
  blockedResale: number;
}

interface ScanLog {
  id: number;
  ticket_id: string;
  scanned_at: string;
  result: string;
  holder_name: string;
  match_info: string;
  note: string;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  display_name: string;
  created_at: string;
}

interface AdminBooking {
  id: number;
  match_id: string;
  match_data: any;
  category: string;
  price: number;
  seats: number;
  status: string;
  username: string;
  display_name: string;
  created_at: string;
  resale_price?: number | null;
  ticket_id: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  vip: "VIP", premium: "Premium", regular: "Regular", fanZone: "Fan Zone",
};

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({ queryKey: ["/api/admin/stats"] });
  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({ queryKey: ["/api/admin/users"] });
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<AdminBooking[]>({ queryKey: ["/api/admin/bookings"] });
  const { data: alerts = [] } = useQuery<IntegrityAlert[]>({ queryKey: ["/api/integrity/alerts"] });
  const { data: scanLogs = [], isLoading: logsLoading } = useQuery<ScanLog[]>({
    queryKey: ["/api/scan-logs"],
    queryFn: async () => { const r = await fetch("/api/scan-logs"); return r.json(); },
    refetchInterval: 15000,
  });

  const categoryData = [
    { name: "VIP", value: bookings.filter(b => b.category === "vip").length || 420, color: "#1d4ed8" },
    { name: "Premium", value: bookings.filter(b => b.category === "premium").length || 890, color: "#0ea5e9" },
    { name: "Regular", value: bookings.filter(b => b.category === "regular").length || 2100, color: "#06b6d4" },
    { name: "Fan Zone", value: bookings.filter(b => b.category === "fanZone").length || 1340, color: "#10b981" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-gray-900 to-blue-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-300 text-sm font-medium">TIKFAN Platform</p>
              <h1 className="text-3xl font-extrabold text-white font-[Montserrat]">Admin Dashboard</h1>
            </div>
          </div>
          <p className="text-gray-300 mt-2">Platform overview — real-time metrics and monitoring</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} title="Total Users" value={String(stats?.totalUsers || 0)} sub="Registered accounts" color="bg-indigo-50 text-indigo-600" />
            <StatCard icon={Ticket} title="Active Bookings" value={String(stats?.totalBookings || 0)} sub="Confirmed bookings" color="bg-blue-50 text-sport-blue" />
            <StatCard icon={DollarSign} title="Live Revenue" value={`$${(stats?.dbRevenue || 0).toLocaleString()}`} sub="From real bookings" color="bg-green-50 text-green-600" />
            <StatCard icon={CheckCircle2} title="Tickets Used" value={String(stats?.ticketsUsed || 0)} sub="Entry validated" color="bg-emerald-50 text-emerald-600" />
            <StatCard icon={RefreshCw} title="Listed for Resale" value={String(stats?.ticketsListed || 0)} sub="Active resale" color="bg-amber-50 text-amber-600" />
            <StatCard icon={ShieldAlert} title="Alert Flags" value={String(stats?.suspiciousAlerts || 0)} sub="Requires attention" color="bg-red-50 text-red-600" />
            <StatCard icon={TrendingUp} title="Scan Logs" value={String(scanLogs.length)} sub="Total scan events" color="bg-purple-50 text-purple-600" />
            <StatCard icon={ShieldAlert} title="Blocked Resale" value={String(stats?.blockedResale || 0)} sub="Anti-scalping blocks" color="bg-rose-50 text-rose-600" />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-5">Monthly Ticket Sales (Simulated)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="tickets" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-5">Revenue Trend ($) — Simulated</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={v => [`$${Number(v).toLocaleString()}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} dot={{ fill: "#0ea5e9", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Breakdown */}
          <Card className="p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-5">Ticket Categories</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-3">
              {categoryData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-600">{d.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{d.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Alerts */}
          <Card className="p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Integrity Alerts</h3>
            <div className="space-y-3">
              {alerts.slice(0, 6).map(alert => (
                <div key={alert.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    alert.status === "High Risk" ? "bg-red-500" : alert.status === "Suspicious" ? "bg-yellow-500" : "bg-emerald-500"
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{alert.type}</p>
                    <p className="text-xs text-gray-500">Risk: {alert.riskScore}/100 · {alert.status}</p>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && <p className="text-sm text-gray-400">No alerts</p>}
            </div>
          </Card>

          {/* Real Bookings */}
          <Card className="p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Recent Bookings</h3>
            {bookingsLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map(b => {
                  const md = b.match_data;
                  return (
                    <div key={b.id} className="flex items-start gap-2" data-testid={`admin-booking-${b.id}`}>
                      <div className="w-2 h-2 rounded-full mt-1.5 bg-green-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {md?.homeTeam?.shortName || "?"} vs {md?.awayTeam?.shortName || "?"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {b.display_name} · {CATEGORY_LABELS[b.category] || b.category} · ${b.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {bookings.length === 0 && <p className="text-sm text-gray-400">No bookings yet</p>}
              </div>
            )}
          </Card>
        </div>

        {/* Scan Logs */}
        <Card className="p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Scan className="w-5 h-5 text-purple-600" />
            Ticket Scanner Log
          </h3>
          {logsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : scanLogs.length === 0 ? (
            <p className="text-sm text-gray-400">No scans recorded yet. Use the <a href="/scanner" className="text-sport-blue underline">Ticket Scanner</a> to validate tickets.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="text-left py-2 pr-4">Ticket ID</th>
                    <th className="text-left py-2 pr-4">Result</th>
                    <th className="text-left py-2 pr-4">Holder</th>
                    <th className="text-left py-2 pr-4">Match</th>
                    <th className="text-left py-2 pr-4">Note</th>
                    <th className="text-left py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {scanLogs.slice(0, 20).map(log => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50" data-testid={`admin-scan-${log.id}`}>
                      <td className="py-2.5 pr-4 font-mono text-xs font-bold text-sport-blue">{log.ticket_id}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          log.result === "valid" ? "bg-green-100 text-green-700" :
                          log.result === "already_used" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {log.result.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-gray-700">{log.holder_name || "—"}</td>
                      <td className="py-2.5 pr-4 text-gray-500 text-xs">{log.match_info || "—"}</td>
                      <td className="py-2.5 pr-4 text-gray-400 text-xs">{log.note || "—"}</td>
                      <td className="py-2.5 text-gray-400 text-xs">{new Date(log.scanned_at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Fair Price Score Monitor */}
        <Card className="p-6 border border-gray-100" data-testid="fair-price-monitor">
          <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Resale Listings — Fair Price Monitor
          </h3>
          <p className="text-xs text-gray-400 mb-4">All active resale listings with anti-scalping fair price scores (0–100)</p>
          {bookingsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (() => {
            const resaleBookings = bookings.filter(b => b.status === "listed_resale" && b.resale_price);
            if (resaleBookings.length === 0) {
              return <p className="text-sm text-gray-400">No active resale listings.</p>;
            }
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="text-left py-2 pr-4">Ticket ID</th>
                      <th className="text-left py-2 pr-4">Holder</th>
                      <th className="text-left py-2 pr-4">Original</th>
                      <th className="text-left py-2 pr-4">Resale</th>
                      <th className="text-left py-2 pr-4">Markup</th>
                      <th className="text-left py-2 pr-4">Fair Price Score</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resaleBookings.map(b => {
                      const fs = calcFairScore(b.price, b.resale_price!);
                      return (
                        <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50" data-testid={`admin-fair-score-${b.id}`}>
                          <td className="py-2.5 pr-4 font-mono text-xs font-bold text-sport-blue">{b.ticket_id}</td>
                          <td className="py-2.5 pr-4 text-gray-700">{b.display_name}</td>
                          <td className="py-2.5 pr-4 text-gray-600">${b.price.toLocaleString()}</td>
                          <td className="py-2.5 pr-4 font-semibold text-gray-900">${b.resale_price!.toLocaleString()}</td>
                          <td className={`py-2.5 pr-4 text-xs font-medium ${fs.textColor}`}>
                            {fs.markupPct > 0 ? `+${fs.markupPct}%` : "0%"}
                          </td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2 min-w-[140px]">
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-1.5 rounded-full ${fs.barColor}`} style={{ width: `${fs.isBlocked ? 100 : fs.score}%` }} />
                              </div>
                              <span className={`text-xs font-bold ${fs.textColor} w-8 text-right`}>{fs.score}</span>
                            </div>
                          </td>
                          <td className="py-2.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${fs.bgColor} ${fs.borderColor} ${fs.textColor}`}>
                              {fs.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </Card>

        {/* Users Table */}
        <Card className="p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Registered Users
          </h3>
          {usersLoading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-400">No users registered yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="text-left py-2 pr-4">ID</th>
                    <th className="text-left py-2 pr-4">Display Name</th>
                    <th className="text-left py-2 pr-4">Username</th>
                    <th className="text-left py-2 pr-4">Email</th>
                    <th className="text-left py-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50" data-testid={`admin-user-${u.id}`}>
                      <td className="py-2.5 pr-4 text-gray-400">#{u.id}</td>
                      <td className="py-2.5 pr-4 font-medium text-gray-900">{u.display_name}</td>
                      <td className="py-2.5 pr-4 text-gray-600">@{u.username}</td>
                      <td className="py-2.5 pr-4 text-gray-500">{u.email}</td>
                      <td className="py-2.5 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
