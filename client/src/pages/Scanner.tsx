import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, CheckCircle2, XCircle, AlertTriangle, Scan, Clock, Hash, User, MapPin, Tag, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ScanResult {
  result: "valid" | "invalid" | "already_used";
  message: string;
  ticket?: {
    ticketId: string;
    holderName: string;
    matchInfo: string;
    category: string;
    section: string;
    row: string;
    seat: string;
    status: string;
    competitionName?: string;
    utcDate?: string;
    venue?: string;
  };
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

const CATEGORY_LABELS: Record<string, string> = {
  vip: "VIP Suite", premium: "Premium", regular: "Regular", fanZone: "Fan Zone",
};

const RESULT_CONFIG = {
  valid: {
    icon: CheckCircle2,
    cls: "bg-green-50 border-green-200 text-green-800",
    iconCls: "text-green-600",
    badge: "bg-green-100 text-green-800 border-0",
    title: "Valid — Entry Granted",
  },
  already_used: {
    icon: AlertTriangle,
    cls: "bg-amber-50 border-amber-200 text-amber-800",
    iconCls: "text-amber-600",
    badge: "bg-amber-100 text-amber-800 border-0",
    title: "Already Used — Entry Denied",
  },
  invalid: {
    icon: XCircle,
    cls: "bg-red-50 border-red-200 text-red-800",
    iconCls: "text-red-600",
    badge: "bg-red-100 text-red-800 border-0",
    title: "Invalid Ticket",
  },
};

function ResultCard({ result }: { result: ScanResult }) {
  const cfg = RESULT_CONFIG[result.result] || RESULT_CONFIG.invalid;
  const Icon = cfg.icon;
  const t = result.ticket;

  return (
    <div className={`border-2 rounded-xl p-5 ${cfg.cls}`} data-testid="scan-result">
      <div className="flex items-start gap-3">
        <Icon className={`w-7 h-7 mt-0.5 shrink-0 ${cfg.iconCls}`} />
        <div className="flex-1">
          <h3 className="font-bold text-lg leading-tight">{cfg.title}</h3>
          <p className="text-sm opacity-80 mt-0.5">{result.message}</p>
        </div>
        <Badge className={cfg.badge}>{result.result.replace("_", " ").toUpperCase()}</Badge>
      </div>

      {t && (
        <>
          <Separator className="my-4 opacity-30" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 opacity-60 shrink-0" />
              <div>
                <p className="text-xs opacity-60 uppercase tracking-wide">Ticket ID</p>
                <p className="font-bold font-mono">{t.ticketId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 opacity-60 shrink-0" />
              <div>
                <p className="text-xs opacity-60 uppercase tracking-wide">Holder</p>
                <p className="font-semibold">{t.holderName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 opacity-60 shrink-0" />
              <div>
                <p className="text-xs opacity-60 uppercase tracking-wide">Match</p>
                <p className="font-semibold">{t.matchInfo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 opacity-60 shrink-0" />
              <div>
                <p className="text-xs opacity-60 uppercase tracking-wide">Category</p>
                <p className="font-semibold">{CATEGORY_LABELS[t.category] || t.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 opacity-60 shrink-0" />
              <div>
                <p className="text-xs opacity-60 uppercase tracking-wide">Seat</p>
                <p className="font-semibold">Section {t.section} · Row {t.row} · Seat {t.seat}</p>
              </div>
            </div>
            {t.utcDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 opacity-60 shrink-0" />
                <div>
                  <p className="text-xs opacity-60 uppercase tracking-wide">Date</p>
                  <p className="font-semibold">{new Date(t.utcDate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            )}
          </div>
          {t.status === "used" && result.result === "valid" && (
            <div className="mt-4 p-2 bg-green-600/20 rounded-lg text-center text-xs font-semibold">
              ✓ Ticket marked as USED — entry recorded at {new Date().toLocaleTimeString()}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LogRow({ log }: { log: ScanLog }) {
  const dot = log.result === "valid" ? "bg-green-500" : log.result === "already_used" ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0" data-testid={`log-row-${log.id}`}>
      <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 font-mono">{log.ticket_id}</p>
        <p className="text-xs text-gray-500 truncate">{log.holder_name ? `${log.holder_name} · ` : ""}{log.match_info || log.note}</p>
      </div>
      <div className="text-right shrink-0">
        <span className={`text-xs font-semibold ${log.result === "valid" ? "text-green-600" : log.result === "already_used" ? "text-amber-600" : "text-red-600"}`}>
          {log.result.replace("_", " ")}
        </span>
        <p className="text-xs text-gray-400">{new Date(log.scanned_at).toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

export default function Scanner() {
  const [ticketIdInput, setTicketIdInput] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);

  const { data: scanLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery<ScanLog[]>({
    queryKey: ["/api/scan-logs"],
    queryFn: async () => { const r = await fetch("/api/scan-logs"); return r.json(); },
    refetchInterval: 10000,
  });

  const handleScan = async () => {
    const id = ticketIdInput.trim().toUpperCase();
    if (!id) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/validate-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: id }),
      });
      const data: ScanResult = await res.json();
      setScanResult(data);
      refetchLogs();
    } catch {
      setScanResult({ result: "invalid", message: "Scan failed — please try again" });
    } finally {
      setScanning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleScan();
  };

  const validCount = scanLogs.filter(l => l.result === "valid").length;
  const invalidCount = scanLogs.filter(l => l.result !== "valid").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-sport-blue/10 flex items-center justify-center">
            <Scan className="w-5 h-5 text-sport-blue" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Ticket Scanner</h1>
        </div>
        <p className="text-gray-500">Validate tickets for event entry — scan or enter Ticket ID manually</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Panel */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-sport-blue" />
                Enter Ticket ID
              </h2>

              {/* Camera scan placeholder */}
              <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl p-6 text-center mb-4">
                <QrCode className="w-16 h-16 text-white/30 mx-auto mb-2" />
                <p className="text-white/60 text-sm">Camera scanning coming soon</p>
                <p className="text-white/40 text-xs">Use manual entry below</p>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={ticketIdInput}
                    onChange={e => setTicketIdInput(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. TFA2B3C4D5"
                    className="pl-9 font-mono uppercase tracking-widest"
                    data-testid="input-ticket-id"
                    autoComplete="off"
                  />
                </div>
                <Button
                  onClick={handleScan}
                  disabled={!ticketIdInput.trim() || scanning}
                  className="bg-sport-blue text-white"
                  data-testid="btn-validate"
                >
                  {scanning ? "Validating..." : "Validate"}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Press Enter or click Validate. Ticket IDs start with TF (e.g. TFAB12CD34).</p>
            </CardContent>
          </Card>

          {/* Result */}
          {scanResult && (
            <div data-testid={`result-${scanResult.result}`}>
              <ResultCard result={scanResult} />
            </div>
          )}
        </div>

        {/* Stats + Log */}
        <div className="space-y-5">
          {/* Today's stats */}
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sport-blue" />
                Session Stats
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-700">{validCount}</p>
                  <p className="text-xs text-green-600">Valid</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl">
                  <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
                  <p className="text-xs text-red-500">Invalid</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scan log */}
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Recent Scans</h2>
              {logsLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : scanLogs.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No scans yet</p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {scanLogs.slice(0, 20).map(l => <LogRow key={l.id} log={l} />)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold text-gray-900 mb-3">How to Validate</h2>
              <ol className="text-sm text-gray-500 space-y-2">
                <li className="flex gap-2"><span className="text-sport-blue font-bold">1.</span>Ask attendee to show ticket QR code</li>
                <li className="flex gap-2"><span className="text-sport-blue font-bold">2.</span>Enter ticket ID from QR or card</li>
                <li className="flex gap-2"><span className="text-sport-blue font-bold">3.</span>Press Validate</li>
                <li className="flex gap-2"><span className="text-sport-blue font-bold">4.</span>Green = valid entry, Red = deny entry</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
