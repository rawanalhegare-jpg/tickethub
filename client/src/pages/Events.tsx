import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Calendar, MapPin, ChevronRight, Trophy, Radio, CheckCircle, Clock } from "lucide-react";

interface Match {
  id: string;
  competitionCode: string;
  competitionName: string;
  homeTeam: { id: number; name: string; crest: string; shortName: string };
  awayTeam: { id: number; name: string; crest: string; shortName: string };
  utcDate: string;
  status: "upcoming" | "live" | "finished" | "postponed";
  matchday: number;
  venue: string;
  prices: { vip: number; premium: number; regular: number; fanZone: number };
}

const LEAGUES = [
  { code: "ALL", name: "All Leagues" },
  { code: "SPL", name: "Saudi Pro League" },
  { code: "ACL", name: "AFC Champions" },
  { code: "PL", name: "Premier League" },
  { code: "CL", name: "Champions League" },
  { code: "PD", name: "La Liga" },
  { code: "BL1", name: "Bundesliga" },
  { code: "SA", name: "Serie A" },
  { code: "FL1", name: "Ligue 1" },
];

const STATUSES = [
  { key: "all", label: "All Matches", icon: null },
  { key: "live", label: "Live Now", icon: Radio },
  { key: "upcoming", label: "Upcoming", icon: Clock },
  { key: "finished", label: "Finished", icon: CheckCircle },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "live") return (
    <Badge className="bg-red-500 text-white border-0 text-xs animate-pulse flex items-center gap-1">
      <Radio className="w-2.5 h-2.5" /> LIVE
    </Badge>
  );
  if (status === "finished") return (
    <Badge className="bg-gray-500 text-white border-0 text-xs">Finished</Badge>
  );
  if (status === "postponed") return (
    <Badge className="bg-yellow-500 text-white border-0 text-xs">Postponed</Badge>
  );
  return (
    <Badge className="bg-green-600 text-white border-0 text-xs">Upcoming</Badge>
  );
}

function MatchCard({ match }: { match: Match }) {
  const date = new Date(match.utcDate);
  return (
    <Card className="group hover-elevate border border-gray-100 overflow-hidden" data-testid={`card-match-${match.id}`}>
      <div className="bg-gradient-to-br from-sport-blue to-blue-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/70 text-xs font-medium truncate max-w-[140px]">{match.competitionName}</span>
          <StatusBadge status={match.status} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-1.5 flex-1">
            {match.homeTeam.crest ? (
              <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-12 h-12 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center text-white font-bold text-lg">{match.homeTeam.shortName[0]}</div>
            )}
            <span className="text-white font-semibold text-xs text-center leading-tight">{match.homeTeam.shortName}</span>
          </div>
          <span className="text-white/40 text-sm font-bold px-3">vs</span>
          <div className="flex flex-col items-center gap-1.5 flex-1">
            {match.awayTeam.crest ? (
              <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-12 h-12 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center text-white font-bold text-lg">{match.awayTeam.shortName[0]}</div>
            )}
            <span className="text-white font-semibold text-xs text-center leading-tight">{match.awayTeam.shortName}</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            {" · "}{date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        {match.venue && match.venue !== "TBD" && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{match.venue}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">From</p>
            <p className="text-lg font-bold text-sport-blue">${match.prices.fanZone}</p>
          </div>
          <Link href={`/events/${match.id}`}>
            <Button size="sm" className="bg-sport-blue text-white" data-testid={`btn-view-match-${match.id}`}>
              {match.status === "finished" ? "View" : "Tickets"} <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function MatchSkeleton() {
  return (
    <Card className="overflow-hidden border border-gray-100">
      <Skeleton className="h-40 w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-7 w-14" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    </Card>
  );
}

export default function Events() {
  const [search, setSearch] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: matches, isLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches", selectedLeague, selectedStatus, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedLeague !== "ALL") params.set("league", selectedLeague);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/matches?${params.toString()}`);
      return res.json();
    },
  });

  const filtered = (matches || []).filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.homeTeam.name.toLowerCase().includes(q) ||
      m.awayTeam.name.toLowerCase().includes(q) ||
      m.competitionName.toLowerCase().includes(q) ||
      (m.venue || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Match Fixtures</h1>
        <p className="text-gray-500">Browse matches and book your tickets</p>
      </div>

      {/* Search + Date Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams, leagues or venues..." className="pl-9" data-testid="input-search" />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="pl-8 w-36 text-xs" data-testid="input-date-from" title="From date" />
          </div>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="pl-8 w-36 text-xs" data-testid="input-date-to" title="To date" />
          </div>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-gray-500">Clear</Button>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s.key}
            data-testid={`filter-status-${s.key}`}
            onClick={() => setSelectedStatus(s.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedStatus === s.key
                ? s.key === "live" ? "bg-red-500 text-white" : "bg-sport-blue text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s.icon && <s.icon className="w-3.5 h-3.5" />}
            {s.label}
          </button>
        ))}
      </div>

      {/* League Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {LEAGUES.map(l => (
          <button
            key={l.code}
            data-testid={`filter-league-${l.code}`}
            onClick={() => setSelectedLeague(l.code)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              selectedLeague === l.code
                ? "bg-sport-blue text-white border-sport-blue"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <MatchSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No fixtures found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{filtered.length} {filtered.length === 1 ? "match" : "matches"} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(match => <MatchCard key={match.id} match={match} />)}
          </div>
        </>
      )}
    </div>
  );
}
