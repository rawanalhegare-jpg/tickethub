import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Ticket, Heart, Calendar, DollarSign, Edit2, Check, X } from "lucide-react";
import { Link, useLocation } from "wouter";

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
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  vip: "VIP Suite", premium: "Premium", regular: "Regular", fanZone: "Fan Zone",
};

export default function Profile() {
  const { user, refetch, loading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/my"],
    queryFn: async () => { const r = await fetch("/api/bookings/my"); return r.json(); },
    enabled: !!user,
  });

  const { data: favorites = [], refetch: refetchFavs } = useQuery<Favorite[]>({
    queryKey: ["/api/favorites/my"],
    queryFn: async () => { const r = await fetch("/api/favorites/my"); return r.json(); },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async (displayName: string) => {
      const res = await apiRequest("PATCH", "/api/auth/profile", { displayName });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      return data;
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setEditing(false);
      toast({ title: "Profile updated successfully" });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
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

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8"><Skeleton className="h-64 w-full rounded-xl" /></div>;
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <User className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Sign in to view your profile</h2>
        <Link href="/login"><Button className="bg-sport-blue text-white">Sign In</Button></Link>
      </div>
    );
  }

  const confirmedBookings = bookings.filter(b => b.status === "confirmed");
  const totalSpent = bookings.filter(b => b.status === "confirmed").reduce((s, b) => s + b.price, 0);
  const initials = (user.displayName || user.username).split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-sport-blue to-blue-800 px-6 pt-8 pb-14" />
        <CardContent className="relative pt-0 px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md shrink-0">
              {initials}
            </div>
            <div className="pb-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newDisplayName}
                    onChange={e => setNewDisplayName(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Display name"
                    data-testid="input-display-name-edit"
                    autoFocus
                  />
                  <button onClick={() => updateMutation.mutate(newDisplayName)} disabled={updateMutation.isPending} data-testid="btn-save-name" className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900" data-testid="text-display-name">{user.displayName}</h1>
                  <button onClick={() => { setEditing(true); setNewDisplayName(user.displayName); }} data-testid="btn-edit-name" className="text-gray-400 hover:text-gray-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-gray-500 text-sm">@{user.username} · {user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Ticket, label: "Active Bookings", value: confirmedBookings.length, color: "text-sport-blue" },
              { icon: DollarSign, label: "Total Spent", value: `$${totalSpent.toLocaleString()}`, color: "text-green-600" },
              { icon: Heart, label: "Favorites", value: favorites.length, color: "text-red-500" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
                <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Upcoming Tickets</CardTitle>
          <Link href="/my-tickets"><Button variant="ghost" size="sm" className="text-sport-blue text-xs">View all</Button></Link>
        </CardHeader>
        <CardContent>
          {confirmedBookings.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No upcoming bookings</p>
              <Link href="/events"><Button size="sm" className="mt-3 bg-sport-blue text-white">Browse Fixtures</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {confirmedBookings.slice(0, 3).map(b => {
                const md = b.match_data;
                const date = md?.utcDate ? new Date(md.utcDate) : null;
                return (
                  <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg" data-testid={`profile-booking-${b.id}`}>
                    <div className="w-10 h-10 rounded-full bg-sport-blue/10 flex items-center justify-center shrink-0">
                      <Ticket className="w-4 h-4 text-sport-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {md?.homeTeam?.shortName || "?"} vs {md?.awayTeam?.shortName || "?"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {CATEGORY_LABELS[b.category]} · {b.seats} seat{b.seats > 1 ? "s" : ""}
                        {date && ` · ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                      </p>
                    </div>
                    <span className="font-bold text-sm text-gray-900">${b.price.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Favorites */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Saved Favorites</CardTitle>
        </CardHeader>
        <CardContent>
          {favorites.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No favorites yet — heart a match to save it</p>
            </div>
          ) : (
            <div className="space-y-2">
              {favorites.map(fav => (
                <div key={fav.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg" data-testid={`profile-fav-${fav.id}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    fav.resource_type === "match" ? "bg-red-50 text-red-500" : "bg-yellow-50 text-yellow-600"
                  }`}>
                    <Heart className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{fav.resource_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{fav.resource_type}</p>
                  </div>
                  {fav.resource_type === "match" && (
                    <Link href={`/events/${fav.resource_id}`}>
                      <Button size="sm" variant="outline" className="text-xs h-7">View</Button>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
