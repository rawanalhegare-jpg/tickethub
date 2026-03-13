import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Trophy, Heart, ArrowLeft, Ticket, Star, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Match {
  id: string;
  competitionCode: string;
  competitionName: string;
  homeTeam: { id: number; name: string; crest: string; shortName: string };
  awayTeam: { id: number; name: string; crest: string; shortName: string };
  utcDate: string;
  status: string;
  matchday: number;
  venue: string;
  prices: { vip: number; premium: number; regular: number; fanZone: number };
}

const CATEGORIES = [
  { key: "vip" as const, label: "VIP Suite", desc: "Premium hospitality, private lounge, complimentary catering" },
  { key: "premium" as const, label: "Premium", desc: "Covered stand, great views, priority entry" },
  { key: "regular" as const, label: "Regular", desc: "Standard seats with good views of the pitch" },
  { key: "fanZone" as const, label: "Fan Zone", desc: "Standing area, lively atmosphere, best value" },
];

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<"vip" | "premium" | "regular" | "fanZone">("regular");
  const [seats, setSeats] = useState(1);
  const [favorited, setFavorited] = useState(false);

  const { data: match, isLoading } = useQuery<Match>({
    queryKey: ["/api/matches", id],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${id}`);
      if (!res.ok) throw new Error("Match not found");
      return res.json();
    },
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!match) throw new Error("No match data");
      const res = await apiRequest("POST", "/api/bookings", {
        matchId: match.id,
        matchData: match,
        category: selectedCategory,
        seats,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      toast({ title: "Booking confirmed!", description: "Your tickets have been booked successfully." });
      navigate("/my-tickets");
    },
    onError: (err: Error) => {
      if (err.message.includes("Authentication")) {
        navigate("/login");
      }
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
    },
  });

  async function toggleFavorite() {
    if (!user) { navigate("/login"); return; }
    if (!match) return;
    try {
      const res = await apiRequest("POST", "/api/favorites/toggle", {
        resourceType: "match",
        resourceId: match.id,
        resourceName: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        metadata: { competitionName: match.competitionName, utcDate: match.utcDate },
      });
      const data = await res.json();
      setFavorited(data.favorited);
      toast({ title: data.favorited ? "Added to favorites" : "Removed from favorites" });
    } catch {
      toast({ title: "Failed to update favorites", variant: "destructive" });
    }
  }

  function handleBook() {
    if (!user) { navigate("/login"); return; }
    bookMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full rounded-xl mb-6" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Trophy className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Match not found</h2>
        <Link href="/events">
          <Button className="mt-4">Back to Fixtures</Button>
        </Link>
      </div>
    );
  }

  const date = new Date(match.utcDate);
  const price = match.prices[selectedCategory] * seats;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/events">
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors" data-testid="btn-back">
          <ArrowLeft className="w-4 h-4" /> Back to Fixtures
        </button>
      </Link>

      {/* Match Hero */}
      <div className="bg-gradient-to-br from-sport-blue to-blue-900 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center justify-between mb-2">
          <Badge className="bg-white/20 border-0 text-white">{match.competitionName}</Badge>
          <button
            onClick={toggleFavorite}
            data-testid="btn-favorite"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              favorited ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <Heart className="w-4 h-4" fill={favorited ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex flex-col items-center gap-3 flex-1">
            {match.homeTeam.crest ? (
              <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-20 h-20 object-contain drop-shadow-lg" onError={e => (e.currentTarget.style.display = "none")} />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">{match.homeTeam.shortName[0]}</div>
            )}
            <span className="font-bold text-base text-center">{match.homeTeam.name}</span>
          </div>
          <div className="flex flex-col items-center px-6">
            <div className="text-2xl font-extrabold text-white/30 mb-1">VS</div>
            {match.matchday && <div className="text-xs text-blue-200">Matchday {match.matchday}</div>}
          </div>
          <div className="flex flex-col items-center gap-3 flex-1">
            {match.awayTeam.crest ? (
              <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-20 h-20 object-contain drop-shadow-lg" onError={e => (e.currentTarget.style.display = "none")} />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">{match.awayTeam.shortName[0]}</div>
            )}
            <span className="font-bold text-base text-center">{match.awayTeam.name}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm text-blue-100">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            {" · "}{date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
          {match.venue && match.venue !== "TBD" && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {match.venue}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Categories */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Ticket Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map(({ key, label, desc }) => (
              <button
                key={key}
                data-testid={`btn-category-${key}`}
                onClick={() => setSelectedCategory(key)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedCategory === key
                    ? "border-sport-blue bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">{label}</span>
                  <span className="font-bold text-sport-blue">${match.prices[key]}</span>
                </div>
                <p className="text-xs text-gray-500">{desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seats & Booking */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900">Number of Seats</p>
              <p className="text-sm text-gray-500">Maximum 10 tickets per booking</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSeats(s => Math.max(1, s - 1))}
                data-testid="btn-decrease-seats"
                className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center font-bold text-gray-600 hover:border-sport-blue hover:text-sport-blue transition-colors"
              >
                -
              </button>
              <span className="text-xl font-bold w-8 text-center" data-testid="text-seat-count">{seats}</span>
              <button
                onClick={() => setSeats(s => Math.min(10, s + 1))}
                data-testid="btn-increase-seats"
                className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center font-bold text-gray-600 hover:border-sport-blue hover:text-sport-blue transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-t border-b border-gray-100 mb-4">
            <div>
              <p className="text-sm text-gray-500">{CATEGORIES.find(c => c.key === selectedCategory)?.label} × {seats}</p>
              <p className="text-2xl font-bold text-gray-900">${price.toLocaleString()}</p>
            </div>
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-8"
              data-testid="btn-book-tickets"
              onClick={handleBook}
              disabled={bookMutation.isPending}
            >
              {bookMutation.isPending ? "Booking..." : user ? "Book Now" : "Sign In to Book"}
            </Button>
          </div>

          {!user && (
            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="text-sport-blue font-medium hover:underline">Sign in</Link>
              {" "}or{" "}
              <Link href="/register" className="text-sport-blue font-medium hover:underline">create an account</Link>
              {" "}to book tickets
            </p>
          )}

          {/* Fair Resale Protected Trust Badge */}
          <div className="mt-4 flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Fair Resale Protected</p>
              <p className="text-xs text-green-600 mt-0.5">
                If you ever resell this ticket, TickFan limits the resale price to a maximum of <strong>10% above the original price</strong> — keeping tickets fair for all fans. Ownership transfer is tracked and each ticket gets a new unique ID.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
