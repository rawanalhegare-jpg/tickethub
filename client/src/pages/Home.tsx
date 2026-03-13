import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ticket, ShieldCheck, RefreshCw, Zap, ChevronRight,
  Calendar, MapPin, Trophy, Radio, Database, Globe
} from "lucide-react";

interface Match {
  id: string;
  competitionCode: string;
  competitionName: string;
  competitionEmblem: string;
  homeTeam: { id: number; name: string; crest: string; shortName: string };
  awayTeam: { id: number; name: string; crest: string; shortName: string };
  utcDate: string;
  status: string;
  matchday: number;
  venue: string;
  score: any;
  prices: { vip: number; premium: number; regular: number; fanZone: number };
}

const LEAGUE_FILTERS = [
  { code: "all",  label: "All Leagues",  flag: "🌍" },
  { code: "PL",   label: "Premier League", flag: "󠁧󠁢󠁥󠁮󠁧󠁿🏴" },
  { code: "CL",   label: "Champions League", flag: "🇪🇺" },
  { code: "PD",   label: "La Liga",       flag: "🇪🇸" },
  { code: "BL1",  label: "Bundesliga",    flag: "🇩🇪" },
  { code: "SA",   label: "Serie A",       flag: "🇮🇹" },
  { code: "FL1",  label: "Ligue 1",       flag: "🇫🇷" },
  { code: "SPL",  label: "Saudi Pro League", flag: "🇸🇦" },
  { code: "ACL",  label: "AFC Champions", flag: "🌏" },
];

function isLiveApiData(matches: Match[]): boolean {
  return matches.some(m => !m.id.startsWith("fb_") && !m.id.startsWith("spl_") && !m.id.startsWith("acl_"));
}

function TeamCrest({ crest, shortName, size = "md" }: { crest: string; shortName: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-10 h-10 text-base" : "w-14 h-14 text-xl";
  if (crest) {
    return (
      <img
        src={crest}
        alt={shortName}
        className={`${dim} object-contain drop-shadow-md`}
        onError={e => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-white/20 flex items-center justify-center text-white font-bold`}>
      {shortName[0]}
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const date = new Date(match.utcDate);
  const isToday = new Date().toDateString() === date.toDateString();
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === date.toDateString();
  const isLive = match.status === "live";

  return (
    <Card
      className="group overflow-hidden hover-elevate cursor-pointer border border-gray-100"
      data-testid={`card-match-${match.id}`}
    >
      {/* Card header — gradient with team info */}
      <div className="bg-gradient-to-br from-sport-blue to-blue-800 p-5 relative">
        {/* Competition badge */}
        <div className="flex items-center gap-1.5 mb-4">
          {match.competitionEmblem ? (
            <img
              src={match.competitionEmblem}
              alt={match.competitionName}
              className="w-4 h-4 object-contain opacity-90"
              onError={e => (e.currentTarget.style.display = "none")}
            />
          ) : null}
          <Badge className="bg-white/20 text-white text-xs border-0 backdrop-blur-sm truncate max-w-[160px]">
            {match.competitionName}
          </Badge>
          {isLive && (
            <Badge className="bg-red-500 text-white text-xs border-0 animate-pulse flex items-center gap-1 ml-auto">
              <Radio className="w-3 h-3" /> LIVE
            </Badge>
          )}
          {isToday && !isLive && (
            <Badge className="bg-yellow-400 text-yellow-900 text-xs border-0 ml-auto font-semibold">TODAY</Badge>
          )}
          {isTomorrow && !isToday && (
            <Badge className="bg-white/20 text-white text-xs border-0 ml-auto">TOMORROW</Badge>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-2 flex-1">
            <TeamCrest crest={match.homeTeam.crest} shortName={match.homeTeam.shortName} />
            <span className="text-white font-bold text-sm text-center leading-tight">
              {match.homeTeam.shortName}
            </span>
          </div>

          <div className="flex flex-col items-center px-3">
            <span className="text-white/50 text-xs font-medium tracking-widest">VS</span>
            {match.matchday ? (
              <span className="text-white/30 text-xs mt-1">MD{match.matchday}</span>
            ) : null}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <TeamCrest crest={match.awayTeam.crest} shortName={match.awayTeam.shortName} />
            <span className="text-white font-bold text-sm text-center leading-tight">
              {match.awayTeam.shortName}
            </span>
          </div>
        </div>
      </div>

      {/* Card body — date, venue, price, CTA */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1.5">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>
            {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            {" · "}
            {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        {match.venue && match.venue !== "TBD" && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{match.venue}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs text-gray-400">From</p>
            <p className="text-xl font-bold text-sport-blue">${match.prices.fanZone}</p>
          </div>
          <Link href={`/events/${match.id}`}>
            <Button
              size="sm"
              className="bg-sport-blue text-white hover:bg-blue-700 font-semibold"
              data-testid={`btn-buy-tickets-${match.id}`}
            >
              <Ticket className="w-4 h-4 mr-1.5" />
              Buy Tickets
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function MatchCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-gray-100">
      <Skeleton className="h-44 w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between pt-1">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
    </Card>
  );
}

export default function Home() {
  const [activeLeague, setActiveLeague] = useState("all");

  const { data: matches, isLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
    queryFn: async () => {
      const res = await fetch("/api/matches");
      if (!res.ok) throw new Error("Failed to load matches");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const liveApi = useMemo(() => matches ? isLiveApiData(matches) : false, [matches]);

  const filtered = useMemo(() => {
    if (!matches) return [];
    const base = activeLeague === "all"
      ? matches
      : matches.filter(m => m.competitionCode === activeLeague);
    return base.slice(0, 9);
  }, [matches, activeLeague]);

  const totalCount = useMemo(() => {
    if (!matches) return 0;
    return activeLeague === "all" ? matches.length : matches.filter(m => m.competitionCode === activeLeague).length;
  }, [matches, activeLeague]);

  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-sport-blue via-blue-700 to-blue-900 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="bg-white/20 text-white border-0 mb-4 backdrop-blur-sm">
            🏆 Official Match Tickets
          </Badge>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
            Book Tickets for<br />
            <span className="text-yellow-400">Real Football</span> Matches
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Premier League, Champions League, La Liga, Bundesliga, Serie A, Saudi Pro League and more.
            Secure, verified tickets from official sources.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events">
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold" data-testid="btn-browse-matches">
                <Ticket className="w-5 h-5 mr-2" />
                Browse All Fixtures
              </Button>
            </Link>
            <Link href="/standings">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" data-testid="btn-view-standings">
                <Trophy className="w-5 h-5 mr-2" />
                View Standings
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 text-blue-200 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified tickets</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span>Live data</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Instant booking</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Upcoming Matches ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        {/* Section header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Fixtures</h2>
            <p className="text-gray-500 mt-1">
              {isLoading ? "Loading matches..." : `${totalCount} fixture${totalCount !== 1 ? "s" : ""} available`}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Data source badge */}
            {!isLoading && matches && (
              <div className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                liveApi
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`} data-testid="badge-data-source">
                {liveApi
                  ? <><Globe className="w-3.5 h-3.5" /> Live: football-data.org</>
                  : <><Database className="w-3.5 h-3.5" /> Curated Fixtures</>
                }
              </div>
            )}
            <Link href="/events">
              <Button variant="outline" className="hidden sm:flex items-center gap-1" data-testid="btn-view-all-fixtures">
                View all <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* League filter strip */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide" data-testid="league-filter-strip">
          {LEAGUE_FILTERS.map(f => {
            const count = f.code === "all"
              ? (matches?.length || 0)
              : (matches?.filter(m => m.competitionCode === f.code).length || 0);
            if (f.code !== "all" && !isLoading && count === 0) return null;
            return (
              <button
                key={f.code}
                data-testid={`filter-league-${f.code}`}
                onClick={() => setActiveLeague(f.code)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeLeague === f.code
                    ? "bg-sport-blue text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{f.flag}</span>
                <span>{f.label}</span>
                {!isLoading && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                    activeLeague === f.code ? "bg-white/20" : "bg-gray-200"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Match grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <MatchCardSkeleton key={i} />)
            : filtered.length > 0
              ? filtered.map(match => <MatchCard key={match.id} match={match} />)
              : (
                <div className="col-span-3 text-center py-16 text-gray-400">
                  <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-gray-600">No fixtures in this league right now</p>
                  <button onClick={() => setActiveLeague("all")} className="text-sport-blue text-sm mt-2 underline">
                    Show all leagues
                  </button>
                </div>
              )
          }
        </div>

        {/* Mobile CTA + View all */}
        <div className="flex items-center justify-between mt-8">
          <Link href="/events">
            <Button variant="outline" data-testid="btn-view-all-mobile">
              View all fixtures <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          {!isLoading && matches && (
            <p className="text-xs text-gray-400">
              Powered by{" "}
              <a href="https://www.football-data.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
                football-data.org
              </a>
              {" "}+ Saudi Pro League
            </p>
          )}
        </div>
      </section>

      {/* ── How it works / Features ──────────────────────────────────── */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Why TickFan?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Verified & Secure",
                desc: "Every ticket carries a unique QR code with anti-duplication protection. Fraud-proof, always.",
                color: "text-green-600 bg-green-50",
              },
              {
                icon: Zap,
                title: "Instant Booking",
                desc: "Book your seat in seconds. QR ticket delivered immediately — ready to scan at the gate.",
                color: "text-blue-600 bg-blue-50",
              },
              {
                icon: RefreshCw,
                title: "Safe Resale",
                desc: "List or buy resale tickets within our platform. New Ticket ID issued on purchase — no fraudulent re-entry.",
                color: "text-purple-600 bg-purple-50",
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="text-center p-6">
                <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── League showcase ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Leagues We Cover</h2>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {[
            { name: "Premier League", emblem: "https://crests.football-data.org/PL.png" },
            { name: "Champions League", emblem: "https://crests.football-data.org/CL.png" },
            { name: "La Liga", emblem: "https://crests.football-data.org/PD.png" },
            { name: "Bundesliga", emblem: "https://crests.football-data.org/BL1.png" },
            { name: "Serie A", emblem: "https://crests.football-data.org/SA.png" },
            { name: "Ligue 1", emblem: "https://crests.football-data.org/FL1.png" },
          ].map(l => (
            <div key={l.name} className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
              <img src={l.emblem} alt={l.name} className="w-10 h-10 object-contain" />
              <span className="text-xs text-gray-500 font-medium">{l.name}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">SPL</div>
            <span className="text-xs text-gray-500 font-medium">Saudi Pro League</span>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">ACL</div>
            <span className="text-xs text-gray-500 font-medium">AFC Champions</span>
          </div>
        </div>
      </section>
    </div>
  );
}
