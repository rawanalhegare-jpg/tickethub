import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Ticket, DollarSign, Calendar, MapPin, ShieldCheck, Heart, X, Trophy, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: number;
  match_data: any;
  category: string;
  price: number;
  seats: number;
  status: string;
  created_at: string;
}

interface Favorite {
  id: number;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  metadata: any;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  vip: "VIP Suite", premium: "Premium", regular: "Regular", fanZone: "Fan Zone",
};

export default function FanPortal() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/my"],
    queryFn: async () => { const r = await fetch("/api/bookings/my"); return r.ok ? r.json() : []; },
    enabled: !!user,
  });

  const { data: favorites = [], isLoading: favsLoading } = useQuery<Favorite[]>({
    queryKey: ["/api/favorites/my"],
    queryFn: async () => { const r = await fetch("/api/favorites/my"); return r.ok ? r.json() : []; },
    enabled: !!user,
  });

  const removeFavMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/favorites/${id}`, undefined);
      if (!res.ok) throw new Error("Failed to remove");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites/my"] });
      toast({ title: "Removed from favorites" });
    },
  });

  const confirmedBookings = bookings.filter(b => b.status === "confirmed");
  const totalSpent = confirmedBookings.reduce((s, b) => s + b.price, 0);
  const initials = user ? (user.displayName || user.username).split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) : "?";

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Skeleton className="h-48 w-full rounded-xl mb-6" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-10 h-10 text-sport-blue" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to access Fan Portal</h2>
          <p className="text-gray-500 mb-6">View your tickets, favorites, and fan stats</p>
          <div className="flex gap-3 justify-center">
            <Link href="/login"><Button className="bg-sport-blue text-white">Sign In</Button></Link>
            <Link href="/register"><Button variant="outline">Create Account</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-700 to-sky-500 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
              {initials}
            </div>
            <div>
              <p className="text-sky-200 text-sm">Fan Portal</p>
              <h1 className="text-3xl font-extrabold text-white font-[Montserrat]">{user.displayName || user.username}</h1>
              <p className="text-sky-200 text-sm mt-0.5">@{user.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { icon: Ticket, label: "Active Tickets", value: String(confirmedBookings.length), color: "bg-white/10" },
              { icon: DollarSign, label: "Total Spent", value: `$${totalSpent.toLocaleString()}`, color: "bg-white/10" },
              { icon: Heart, label: "Favorites", value: String(favorites.length), color: "bg-white/10" },
              { icon: Star, label: "Fan Points", value: String(confirmedBookings.length * 100), color: "bg-white/10" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className={`${color} backdrop-blur-sm rounded-xl p-3 text-center`}>
                <Icon className="w-5 h-5 text-white/70 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-sky-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Upcoming Tickets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">My Tickets</h2>
            <Link href="/my-tickets"><Button variant="outline" size="sm">View all</Button></Link>
          </div>
          {bookingsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : confirmedBookings.length === 0 ? (
            <Card className="p-8 text-center border border-dashed">
              <Trophy className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">No upcoming tickets yet</p>
              <Link href="/events"><Button className="bg-sport-blue text-white">Browse Fixtures</Button></Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {confirmedBookings.slice(0, 4).map(b => {
                const md = b.match_data;
                const date = md?.utcDate ? new Date(md.utcDate) : null;
                return (
                  <Card key={b.id} className="p-4 border border-gray-100" data-testid={`fan-booking-${b.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                        <ShieldCheck className="w-3 h-3 mr-1" />Confirmed
                      </Badge>
                      <span className="font-bold text-gray-900">${b.price.toLocaleString()}</span>
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">
                      {md?.homeTeam?.shortName || "?"} vs {md?.awayTeam?.shortName || "?"}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">{md?.competitionName}</p>
                    {date && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {CATEGORY_LABELS[b.category] || b.category} · {b.seats} {b.seats === 1 ? "seat" : "seats"}
                    </p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Favorites */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Saved Favorites</h2>
            <Link href="/profile"><Button variant="outline" size="sm">Manage</Button></Link>
          </div>
          {favsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          ) : favorites.length === 0 ? (
            <Card className="p-8 text-center border border-dashed">
              <Heart className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-2">No favorites saved yet</p>
              <p className="text-xs text-gray-400">Tap the heart icon on any match to save it here</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {favorites.map(fav => {
                const meta = fav.metadata || {};
                return (
                  <Card key={fav.id} className="p-4 border border-gray-100" data-testid={`fan-fav-${fav.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <Heart className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{fav.resource_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{fav.resource_type}{meta.competitionName ? ` · ${meta.competitionName}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {fav.resource_type === "match" && (
                          <Link href={`/events/${fav.resource_id}`}>
                            <Button size="sm" variant="outline" className="text-xs h-7">View Match</Button>
                          </Link>
                        )}
                        <button
                          onClick={() => removeFavMutation.mutate(fav.id)}
                          data-testid={`btn-remove-fav-${fav.id}`}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
