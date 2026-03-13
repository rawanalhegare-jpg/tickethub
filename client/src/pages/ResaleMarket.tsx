import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { ShoppingBag, Calendar, MapPin, Tag, Ticket, ArrowRight, RefreshCw, Hash, TrendingUp, ShieldCheck, BadgeCheck } from "lucide-react";
import { Link } from "wouter";
import { calcFairScore } from "@/lib/fairScore";

interface ResaleListing {
  id: number;
  user_id: number;
  match_data: {
    homeTeam: { name: string; crest: string; shortName: string };
    awayTeam: { name: string; crest: string; shortName: string };
    competitionName: string;
    utcDate: string;
    venue: string;
    prices: Record<string, number>;
  };
  category: string;
  price: number;
  resale_price: number;
  seats: number;
  ticket_id: string;
  section: string;
  row_label: string;
  seat_number: string;
  display_name: string;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  vip: "VIP Suite", premium: "Premium", regular: "Regular", fanZone: "Fan Zone",
};

function ListingCard({ listing, currentUserId }: { listing: ResaleListing; currentUserId?: number }) {
  const { toast } = useToast();
  const md = listing.match_data;
  const date = md?.utcDate ? new Date(md.utcDate) : null;
  const originalPrice = listing.price;
  const resalePrice = listing.resale_price || listing.price;
  const markup = originalPrice > 0 ? Math.round(((resalePrice - originalPrice) / originalPrice) * 100) : 0;
  const fairScore = calcFairScore(originalPrice, resalePrice);
  const isOwn = listing.user_id === currentUserId;

  const buyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/resale-listings/${listing.id}/buy`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resale-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      toast({ title: "Ticket Purchased!", description: "A new Ticket ID has been issued to you. Check My Tickets." });
    },
    onError: (e: Error) => toast({ title: "Purchase Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <Card className="hover-elevate border border-gray-100 overflow-hidden" data-testid={`card-listing-${listing.id}`}>
      <div className="bg-gradient-to-br from-sport-blue to-blue-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge className="bg-white/20 text-white border-0 text-xs truncate max-w-[130px]">{md?.competitionName}</Badge>
          {markup > 0 ? (
            <Badge className="bg-amber-400 text-amber-900 border-0 text-xs flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />+{markup}%
            </Badge>
          ) : (
            <Badge className="bg-green-400 text-green-900 border-0 text-xs">Face Value</Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-1.5 flex-1">
            {md?.homeTeam?.crest ? (
              <img src={md.homeTeam.crest} alt="" className="w-10 h-10 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">{md?.homeTeam?.shortName?.[0]}</div>
            )}
            <span className="text-white text-xs font-semibold">{md?.homeTeam?.shortName}</span>
          </div>
          <span className="text-white/40 font-bold text-sm px-2">vs</span>
          <div className="flex flex-col items-center gap-1.5 flex-1">
            {md?.awayTeam?.crest ? (
              <img src={md.awayTeam.crest} alt="" className="w-10 h-10 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">{md?.awayTeam?.shortName?.[0]}</div>
            )}
            <span className="text-white text-xs font-semibold">{md?.awayTeam?.shortName}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-1.5">
        {date && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        )}
        {md?.venue && md.venue !== "TBD" && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />{md.venue}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Tag className="w-3 h-3" />
          {CATEGORY_LABELS[listing.category] || listing.category}
          <span className="text-gray-300">·</span>Sec {listing.section}
          <span className="text-gray-300">·</span>Row {listing.row_label}
          <span className="text-gray-300">·</span>Seat {listing.seat_number}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
          <Hash className="w-3 h-3" />{listing.ticket_id}
        </div>

        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400">Resale Price</p>
              <p className="text-2xl font-bold text-gray-900">${resalePrice.toLocaleString()}</p>
              {markup !== 0 && <p className="text-xs text-gray-400">Original: ${originalPrice.toLocaleString()}</p>}
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Seller</p>
              <p className="font-medium text-gray-700">{listing.display_name}</p>
            </div>
          </div>

          {/* Fair Price Score */}
          <div className={`rounded-lg border px-3 py-2.5 mb-3 ${fairScore.bgColor} ${fairScore.borderColor}`} data-testid={`fair-score-card-${listing.id}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className={`w-3.5 h-3.5 ${fairScore.textColor}`} />
                <span className={`text-xs font-semibold ${fairScore.textColor}`}>Fair Price Score</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${fairScore.textColor}`} data-testid={`fair-score-value-${listing.id}`}>{fairScore.score}/100</span>
                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${fairScore.bgColor} ${fairScore.borderColor} ${fairScore.textColor}`} data-testid={`fair-score-label-${listing.id}`}>
                  {fairScore.label}
                </span>
              </div>
            </div>
            <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${fairScore.barColor}`}
                style={{ width: `${fairScore.isBlocked ? 100 : fairScore.score}%` }}
                data-testid={`fair-score-bar-${listing.id}`}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">Original: ${originalPrice.toLocaleString()}</span>
              {fairScore.markupPct > 0 && (
                <span className={`text-xs ${fairScore.textColor}`}>+{fairScore.markupPct}% markup</span>
              )}
            </div>
          </div>

          {isOwn ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg py-2 text-center text-xs text-amber-700 font-medium">
              Your listing
            </div>
          ) : (
            <Button
              className="w-full bg-sport-blue text-white"
              onClick={() => buyMutation.mutate()}
              disabled={buyMutation.isPending}
              data-testid={`btn-buy-${listing.id}`}
            >
              <Ticket className="w-4 h-4 mr-1.5" />
              {buyMutation.isPending ? "Processing..." : "Buy Ticket"}
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function ListingSkeleton() {
  return (
    <Card className="border border-gray-100 overflow-hidden">
      <Skeleton className="h-40 w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-10 w-full mt-3" />
      </div>
    </Card>
  );
}

export default function ResaleMarket() {
  const { user } = useAuth();

  const { data: listings = [], isLoading } = useQuery<ResaleListing[]>({
    queryKey: ["/api/resale-listings"],
    queryFn: async () => { const r = await fetch("/api/resale-listings"); return r.json(); },
    refetchInterval: 15000,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-6 h-6 text-sport-blue" />
            <h1 className="text-3xl font-bold text-gray-900">Resale Market</h1>
          </div>
          <p className="text-gray-500">Buy and sell tickets safely within the TIKFAN platform</p>
        </div>
        <Link href="/my-tickets">
          <Button variant="outline" size="sm" data-testid="btn-list-ticket">
            <RefreshCw className="w-4 h-4 mr-1.5" />List My Ticket
          </Button>
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-sport-blue mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-blue-900 text-sm">Fair Resale — Anti-Fraud Protected</p>
          <p className="text-blue-700 text-xs mt-0.5">
            When you buy a resale ticket, a new unique Ticket ID is generated for you. The seller's original ID is immediately invalidated — preventing duplicate entry and fraud.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{[1,2,3].map(i => <ListingSkeleton key={i} />)}</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">No listings available right now</p>
          <p className="text-sm mt-1 mb-4">List your own ticket from My Tickets to appear here</p>
          <Link href="/my-tickets"><Button size="sm" className="bg-sport-blue text-white">My Tickets</Button></Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{listings.length} {listings.length === 1 ? "listing" : "listings"} available</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map(l => <ListingCard key={l.id} listing={l} currentUserId={user?.id} />)}
          </div>
        </>
      )}
    </div>
  );
}
