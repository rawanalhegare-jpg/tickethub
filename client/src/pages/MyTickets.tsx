import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Ticket, Calendar, MapPin, QrCode, Download, RefreshCw, X, ShieldCheck, LogIn, Hash, Tag, AlertTriangle, BadgeCheck } from "lucide-react";
import { calcFairScore } from "@/lib/fairScore";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

interface Booking {
  id: number;
  user_id: number;
  match_id: string;
  match_data: {
    homeTeam: { name: string; crest: string; shortName: string };
    awayTeam: { name: string; crest: string; shortName: string };
    competitionName: string;
    utcDate: string;
    venue: string;
    prices: { vip: number; premium: number; regular: number; fanZone: number };
  };
  category: string;
  price: number;
  seats: number;
  status: string;
  ticket_id: string;
  section: string;
  row_label: string;
  seat_number: string;
  resale_price: number | null;
  ticket_origin: string | null;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  vip: "VIP Suite", premium: "Premium", regular: "Regular", fanZone: "Fan Zone",
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "Confirmed", cls: "bg-emerald-100 text-emerald-700" },
  used: { label: "Used", cls: "bg-gray-100 text-gray-500" },
  cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-600" },
  listed_resale: { label: "Listed for Resale", cls: "bg-amber-100 text-amber-700" },
  transferred: { label: "Transferred", cls: "bg-purple-100 text-purple-600" },
};

function QRDisplay({ ticketId, size = 160 }: { ticketId: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState("");
  useEffect(() => {
    QRCode.toDataURL(`TIKFAN:${ticketId}:VERIFIED`, {
      width: size, margin: 2,
      color: { dark: "#1d4ed8", light: "#ffffff" },
    }).then(setDataUrl).catch(console.error);
  }, [ticketId, size]);
  if (!dataUrl) return <div className="bg-gray-100 rounded-xl animate-pulse" style={{ width: size, height: size }} />;
  return <img src={dataUrl} alt={`QR for ${ticketId}`} className="rounded-xl shadow-sm border border-gray-100" style={{ width: size, height: size }} />;
}

function downloadTicket(booking: Booking, qrDataUrl: string, holderName: string) {
  const md = booking.match_data || {};
  const date = md.utcDate ? new Date(md.utcDate).toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBD";
  const cat = CATEGORY_LABELS[booking.category] || booking.category;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>TIKFAN Ticket — ${booking.ticket_id}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .ticket { background: white; border-radius: 16px; overflow: hidden; width: 480px; box-shadow: 0 8px 32px rgba(0,0,0,.15); }
    .header { background: linear-gradient(135deg, #1d4ed8, #0ea5e9); padding: 24px; color: white; }
    .header .brand { font-size: 11px; opacity: .7; letter-spacing: 2px; text-transform: uppercase; }
    .header h1 { margin: 6px 0 0; font-size: 20px; font-weight: 800; }
    .header .sub { font-size: 13px; opacity: .8; margin-top: 2px; }
    .teams { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; background: #f8fafc; }
    .team { text-align: center; }
    .team-name { font-weight: 700; font-size: 16px; color: #1e293b; }
    .vs { color: #94a3b8; font-size: 20px; font-weight: 300; }
    .body { padding: 20px 24px; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
    .row:last-child { border: none; }
    .row .label { color: #94a3b8; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; }
    .row .value { font-weight: 600; color: #1e293b; }
    .footer { background: #1d4ed8; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }
    .footer .id { color: white; font-size: 12px; opacity: .7; }
    .footer .tid { color: white; font-size: 18px; font-weight: 800; letter-spacing: 2px; }
    .qr-section { text-align: center; padding: 16px; background: white; }
    .qr-section img { border-radius: 8px; }
    .status { display: inline-block; background: #dcfce7; color: #166534; border-radius: 20px; padding: 3px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    @media print { body { background: white; } .ticket { box-shadow: none; } @page { margin: 0; } }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="brand">TIKFAN — Official Ticket</div>
      <h1>${md.homeTeam?.shortName || "?"} vs ${md.awayTeam?.shortName || "?"}</h1>
      <div class="sub">${md.competitionName || "Football Match"}</div>
    </div>
    <div class="teams">
      <div class="team"><div class="team-name">${md.homeTeam?.name || "Home"}</div></div>
      <span class="vs">VS</span>
      <div class="team"><div class="team-name">${md.awayTeam?.name || "Away"}</div></div>
    </div>
    <div class="body">
      <div class="row"><span class="label">Date & Time</span><span class="value">${date}</span></div>
      <div class="row"><span class="label">Venue</span><span class="value">${md.venue || "TBD"}</span></div>
      <div class="row"><span class="label">Category</span><span class="value">${cat}</span></div>
      <div class="row"><span class="label">Section / Row / Seat</span><span class="value">${booking.section} / ${booking.row_label} / ${booking.seat_number}</span></div>
      <div class="row"><span class="label">Seats</span><span class="value">${booking.seats}</span></div>
      <div class="row"><span class="label">Ticket Holder</span><span class="value">${holderName}</span></div>
      <div class="row"><span class="label">Status</span><span class="value"><span class="status">${booking.status}</span></span></div>
    </div>
    <div class="qr-section">
      <img src="${qrDataUrl}" width="140" height="140" alt="QR Code" />
      <div style="margin-top: 8px; font-size: 11px; color: #94a3b8;">Scan to validate entry</div>
    </div>
    <div class="footer">
      <div>
        <div class="id">TICKET ID</div>
        <div class="tid">${booking.ticket_id}</div>
      </div>
      <div style="color: white; font-size: 11px; text-align: right; opacity: .7;">
        Booked<br/>${new Date(booking.created_at).toLocaleDateString()}
      </div>
    </div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

function BookingCard({ booking, holderName, onCancel }: { booking: Booking; holderName: string; onCancel: (id: number) => void }) {
  const { toast } = useToast();
  const md = booking.match_data;
  const date = md?.utcDate ? new Date(md.utcDate) : null;
  const [qrDialog, setQrDialog] = useState(false);
  const [resellDialog, setResellDialog] = useState(false);
  const [resalePrice, setResalePrice] = useState("");
  const statusCfg = STATUS_CONFIG[booking.status] || { label: booking.status, cls: "bg-gray-100 text-gray-500" };

  const maxResalePrice = Math.round(booking.price * 1.10);
  const enteredPrice = Number(resalePrice);
  const exceedsCap = enteredPrice > 0 && enteredPrice > maxResalePrice;
  const liveScore = enteredPrice > 0 ? calcFairScore(booking.price, enteredPrice) : null;

  const resellMutation = useMutation({
    mutationFn: async (price: number) => {
      const res = await apiRequest("POST", `/api/bookings/${booking.id}/resell`, { resalePrice: price });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to list");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      toast({ title: "Ticket listed for resale!", description: "It will appear in the Resale Market." });
      setResellDialog(false);
    },
    onError: (e: Error) => toast({
      title: e.message.includes("fair resale") ? "Blocked by Fair Resale Policy" : "Failed to list",
      description: e.message,
      variant: "destructive",
    }),
  });

  const handleDownload = () => {
    QRCode.toDataURL(`TIKFAN:${booking.ticket_id}:VERIFIED`, { width: 200, margin: 1, color: { dark: "#1d4ed8", light: "#ffffff" } })
      .then(qrUrl => downloadTicket(booking, qrUrl, holderName));
  };

  return (
    <Card className="border border-gray-100 overflow-hidden" data-testid={`card-booking-${booking.id}`}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-sport-blue to-blue-800 p-5">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <Badge className="bg-white/20 text-white border-0 text-xs truncate max-w-[120px]">
              {md?.competitionName || "Football"}
            </Badge>
            <div className="flex items-center gap-1.5">
              {booking.ticket_origin === "resale" ? (
                <Badge className="bg-yellow-400/90 text-yellow-900 border-0 text-xs flex items-center gap-0.5">
                  <RefreshCw className="w-3 h-3" />Resold Fairly
                </Badge>
              ) : (
                <Badge className="bg-white/20 text-white border-0 text-xs flex items-center gap-0.5">
                  <BadgeCheck className="w-3 h-3" />Original
                </Badge>
              )}
              <Badge className={`border-0 text-xs ${statusCfg.cls}`}>{statusCfg.label}</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-2 flex-1">
              {md?.homeTeam?.crest ? (
                <img src={md.homeTeam.crest} alt="" className="w-12 h-12 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">{md?.homeTeam?.shortName?.[0] || "H"}</div>
              )}
              <span className="text-white font-semibold text-xs text-center">{md?.homeTeam?.shortName}</span>
            </div>
            <span className="text-white/50 font-bold px-3">vs</span>
            <div className="flex flex-col items-center gap-2 flex-1">
              {md?.awayTeam?.crest ? (
                <img src={md.awayTeam.crest} alt="" className="w-12 h-12 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">{md?.awayTeam?.shortName?.[0] || "A"}</div>
              )}
              <span className="text-white font-semibold text-xs text-center">{md?.awayTeam?.shortName}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-4 space-y-2">
          {date && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              {" · "}{date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
          {md?.venue && md.venue !== "TBD" && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {md.venue}
            </div>
          )}

          {booking.ticket_id && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
              <Hash className="w-3 h-3 shrink-0" />
              {booking.ticket_id}
            </div>
          )}

          {booking.section && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Tag className="w-3 h-3 shrink-0" />
              <span className="bg-gray-100 px-1.5 py-0.5 rounded">{booking.section}</span>
              <span className="bg-gray-100 px-1.5 py-0.5 rounded">Row {booking.row_label}</span>
              <span className="bg-gray-100 px-1.5 py-0.5 rounded">Seat {booking.seat_number}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400">{CATEGORY_LABELS[booking.category] || booking.category} · {booking.seats} seat{booking.seats > 1 ? "s" : ""}</p>
              <p className="text-lg font-bold text-gray-900">${booking.price.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1">
              {booking.ticket_id && booking.status !== "cancelled" && (
                <>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500" onClick={() => setQrDialog(true)} title="View QR" data-testid={`btn-qr-${booking.id}`}>
                    <QrCode className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500" onClick={handleDownload} title="Download Ticket" data-testid={`btn-download-${booking.id}`}>
                    <Download className="w-4 h-4" />
                  </Button>
                </>
              )}
              {booking.status === "confirmed" && (
                <>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2" onClick={() => setResellDialog(true)} data-testid={`btn-resell-${booking.id}`}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />Resell
                  </Button>
                  <button onClick={() => onCancel(booking.id)} data-testid={`btn-cancel-booking-${booking.id}`} className="text-red-400 hover:text-red-600 p-1.5">
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* QR Dialog */}
      <Dialog open={qrDialog} onOpenChange={setQrDialog}>
        <DialogContent className="sm:max-w-sm" data-testid={`dialog-qr-${booking.id}`}>
          <DialogHeader>
            <DialogTitle className="text-center">Ticket QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {booking.ticket_id && <QRDisplay ticketId={booking.ticket_id} size={200} />}
            <div className="text-center">
              <p className="font-mono text-lg font-bold tracking-widest text-sport-blue">{booking.ticket_id}</p>
              <p className="text-xs text-gray-400 mt-1">
                {md?.homeTeam?.shortName} vs {md?.awayTeam?.shortName}
              </p>
              <p className="text-xs text-gray-400">{CATEGORY_LABELS[booking.category]} · Section {booking.section} · Row {booking.row_label} · Seat {booking.seat_number}</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button className="flex-1 bg-sport-blue text-white" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1" /> Download
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQrDialog(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resell Dialog */}
      <Dialog open={resellDialog} onOpenChange={setResellDialog}>
        <DialogContent className="sm:max-w-sm" data-testid={`dialog-resell-${booking.id}`}>
          <DialogHeader>
            <DialogTitle>List Ticket for Resale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Fair Resale Policy Notice */}
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-sm font-semibold text-green-800">Fair Resale Policy Active</p>
              </div>
              <p className="text-xs text-green-700">
                Original price: <strong>${booking.price.toLocaleString()}</strong><br />
                Maximum allowed resale: <strong>${maxResalePrice.toLocaleString()}</strong> (10% cap)
              </p>
            </div>

            <div>
              <Label htmlFor={`resale-price-${booking.id}`}>Resale Price ($)</Label>
              <Input
                id={`resale-price-${booking.id}`}
                type="number"
                min={1}
                max={maxResalePrice}
                value={resalePrice}
                onChange={e => setResalePrice(e.target.value)}
                placeholder={`Max: $${maxResalePrice}`}
                data-testid={`input-resale-price-${booking.id}`}
                className={`mt-1 ${exceedsCap ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              {exceedsCap && (
                <div className="flex items-center gap-1.5 mt-2 text-red-600 text-xs" data-testid="warning-cap-exceeded">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <strong>Resale price exceeds fair resale policy.</strong>{" "}
                    Maximum allowed: ${maxResalePrice.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Live Fair Price Score */}
              {liveScore && (
                <div className={`mt-2 rounded-lg border px-3 py-2 ${liveScore.bgColor} ${liveScore.borderColor}`} data-testid="live-fair-score">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${liveScore.textColor}`}>Fair Price Score</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${liveScore.textColor}`}>{liveScore.score}/100</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${liveScore.bgColor} ${liveScore.borderColor} ${liveScore.textColor}`}>
                        {liveScore.label}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${liveScore.barColor}`}
                      style={{ width: `${liveScore.isBlocked ? 100 : liveScore.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Once listed, your ticket will appear in the Resale Market. Ownership transfers to the buyer and a new Ticket ID is issued for anti-fraud protection.
            </p>

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
                onClick={() => resellMutation.mutate(Number(resalePrice))}
                disabled={!resalePrice || exceedsCap || resellMutation.isPending}
                data-testid={`btn-confirm-resell-${booking.id}`}
              >
                {resellMutation.isPending ? "Listing..." : "List for Resale"}
              </Button>
              <Button variant="outline" onClick={() => setResellDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function BookingSkeleton() {
  return (
    <Card className="border border-gray-100 overflow-hidden">
      <Skeleton className="h-44 w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </Card>
  );
}

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Confirmed" },
  { key: "used", label: "Used" },
  { key: "listed_resale", label: "Listed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function MyTickets() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState("all");

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/my"],
    queryFn: async () => { const r = await fetch("/api/bookings/my"); return r.ok ? r.json() : []; },
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/bookings/${id}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      toast({ title: "Booking cancelled" });
    },
    onError: () => toast({ title: "Failed to cancel", variant: "destructive" }),
  });

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">{[1,2,3,4].map(i => <BookingSkeleton key={i} />)}</div>
    </div>
  );

  if (!user) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <LogIn className="w-12 h-12 mx-auto text-gray-300 mb-4" />
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Sign in to view your tickets</h2>
      <Link href="/login"><Button className="bg-sport-blue text-white">Sign In</Button></Link>
    </div>
  );

  const filtered = (bookings || []).filter(b => filter === "all" || b.status === filter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">{(bookings || []).length} total bookings</p>
        </div>
        <Link href="/events">
          <Button size="sm" className="bg-sport-blue text-white" data-testid="btn-browse-events">Browse Fixtures</Button>
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            data-testid={`filter-${tab.key}`}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === tab.key ? "bg-sport-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            {tab.key !== "all" && bookings && (
              <span className="ml-1 text-xs opacity-70">
                ({bookings.filter(b => b.status === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <BookingSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">
            {filter === "all" ? "No tickets yet" : `No ${filter} tickets`}
          </p>
          {filter === "all" && <Link href="/events"><Button size="sm" className="mt-4 bg-sport-blue text-white">Browse Fixtures</Button></Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filtered.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              holderName={user.displayName || user.username}
              onCancel={id => cancelMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
