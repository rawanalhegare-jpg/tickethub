import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ChevronLeft, Ticket, QrCode, Download, RefreshCw, ShieldCheck,
  Calendar, MapPin, CheckCircle2, AlertCircle
} from "lucide-react";
import type { Ticket as TicketType, Event } from "@shared/schema";
import QRCode from "qrcode";

function QRDisplay({ ticketId }: { ticketId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(`TICKFAN:${ticketId}:VERIFIED`, {
      width: 300, margin: 2,
      color: { dark: "#1d4ed8", light: "#ffffff" },
    }).then(setDataUrl).catch(console.error);
  }, [ticketId]);

  if (!dataUrl) return <div className="w-48 h-48 bg-gray-100 rounded-xl animate-pulse" />;
  return <img src={dataUrl} alt="QR Code" className="w-48 h-48 rounded-xl shadow-sm border border-gray-100" />;
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [resalePrice, setResalePrice] = useState("");
  const [showResaleForm, setShowResaleForm] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [largeQrUrl, setLargeQrUrl] = useState("");

  const { data: ticket, isLoading: ticketLoading } = useQuery<TicketType>({
    queryKey: ["/api/tickets", id],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${id}`);
      if (!res.ok) throw new Error("Ticket not found");
      return res.json();
    },
  });

  const { data: events = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const event = events.find(e => ticket && e.id === ticket.eventId);

  useEffect(() => {
    if (qrDialogOpen && id) {
      QRCode.toDataURL(`TICKFAN:${id}:VERIFIED`, {
        width: 600, margin: 3,
        color: { dark: "#1d4ed8", light: "#ffffff" },
      }).then(setLargeQrUrl).catch(console.error);
    }
  }, [qrDialogOpen, id]);

  const resaleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/resale", { ticketId: id, price: parseInt(resalePrice), userId: "user-demo" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resale"] });
      toast({ title: "Ticket Listed!", description: "Your ticket is now listed on the resale market." });
      setShowResaleForm(false);
    },
    onError: () => {
      toast({ title: "Resale Failed", description: "Could not list ticket.", variant: "destructive" });
    },
  });

  const handleDownload = async () => {
    if (!ticket || !event) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [100, 160] });

      doc.setFillColor(29, 78, 216);
      doc.rect(0, 0, 100, 50, "F");

      doc.setFillColor(14, 165, 233);
      doc.rect(0, 45, 100, 5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("TickFan", 50, 15, { align: "center" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("OFFICIAL DIGITAL TICKET", 50, 22, { align: "center" });
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(`${event.homeTeam} vs ${event.awayTeam}`, 50, 32, { align: "center" });
      doc.setFontSize(10);
      doc.text(event.title, 50, 40, { align: "center" });

      doc.setTextColor(20, 20, 20);
      const fields = [
        ["Date", `${new Date(event.date).toLocaleDateString()} · ${event.time}`],
        ["Venue", event.venue],
        ["City", `${event.city}, ${event.country}`],
        ["Category", ticket.category],
        ["Section", ticket.section],
        ["Row", ticket.row],
        ["Seat", ticket.seat],
        ["Ticket ID", ticket.id.substring(0, 20)],
      ];
      fields.forEach(([label, val], i) => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(label, 10, 60 + i * 9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 20, 20);
        doc.text(String(val), 45, 60 + i * 9);
      });

      const qrDataUrl = await QRCode.toDataURL(`TICKFAN:${ticket.id}:VERIFIED`, { width: 150, margin: 1 });
      doc.addImage(qrDataUrl, "PNG", 30, 135, 40, 40);

      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("Scan QR code for verification", 50, 150, { align: "center" });
      doc.setFontSize(6);
      doc.text("This is an official TickFan digital ticket. Protected against duplication.", 50, 157, { align: "center" });

      doc.save(`TickFan-Ticket-${ticket.id.substring(0, 8)}.pdf`);
      toast({ title: "Downloaded!", description: "Your ticket PDF has been downloaded." });
    } catch (err) {
      toast({ title: "Download Failed", description: "Please try again.", variant: "destructive" });
    }
  };

  if (ticketLoading) return <div className="max-w-2xl mx-auto px-4 py-8 space-y-4"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>;
  if (!ticket) return <div className="text-center py-20"><p className="text-gray-500">Ticket not found</p><Link href="/my-tickets"><Button variant="outline" className="mt-4">My Tickets</Button></Link></div>;

  const statusBg = { active: "from-blue-600 to-sky-500", used: "from-gray-400 to-gray-600", resale: "from-yellow-500 to-orange-500", sold: "from-red-500 to-rose-600" };
  const bg = statusBg[ticket.status as keyof typeof statusBg] || "from-blue-600 to-sky-500";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/my-tickets">
          <Button variant="ghost" size="sm" data-testid="btn-back-tickets">
            <ChevronLeft className="w-4 h-4 mr-1" /> My Tickets
          </Button>
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-500 font-mono truncate max-w-[200px]">{ticket.id}</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <div className={`bg-gradient-to-br ${bg} rounded-2xl p-7 text-white shadow-xl`} data-testid="ticket-card-display">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wide">TickFan Digital Ticket</span>
            </div>
            <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full capitalize">{ticket.status}</span>
          </div>

          {event && (
            <>
              <h2 className="text-2xl font-extrabold mb-1">{event.homeTeam} vs {event.awayTeam}</h2>
              <p className="text-sky-200 mb-4">{event.title}</p>
            </>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm bg-white/10 rounded-xl p-4 mb-4">
            <div><p className="text-sky-200 text-xs">Category</p><p className="font-bold">{ticket.category}</p></div>
            <div><p className="text-sky-200 text-xs">Section</p><p className="font-bold">{ticket.section}</p></div>
            <div><p className="text-sky-200 text-xs">Row</p><p className="font-bold">{ticket.row}</p></div>
            <div><p className="text-sky-200 text-xs">Seat</p><p className="font-bold">{ticket.seat}</p></div>
          </div>

          {event && (
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-1.5 text-sky-200"><Calendar className="w-3.5 h-3.5" />{new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })} · {event.time}</div>
              <div className="flex items-center gap-1.5 text-sky-200"><MapPin className="w-3.5 h-3.5" />{event.venue}, {event.city}</div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-sky-200 font-mono truncate">{ticket.id}</p>
          </div>
        </div>

        <Card className="p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><QrCode className="w-5 h-5 text-sport-blue" /> Ticket QR Code</h3>
          <div className="flex items-center gap-6">
            <QRDisplay ticketId={ticket.id} />
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-4">Scan this QR code at the entrance for quick, secure verification.</p>
              <div className="space-y-2">
                <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" data-testid="btn-view-qr">
                      <QrCode className="w-4 h-4 mr-2" /> View Large QR
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Ticket QR Code</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                      {largeQrUrl && <img src={largeQrUrl} alt="QR Code Large" className="w-64 h-64 rounded-xl border border-gray-100 shadow-sm" data-testid="img-qr-large" />}
                      <p className="text-sm text-gray-500 text-center">Present this QR code at the entry gate</p>
                      <p className="font-mono text-xs text-gray-400 break-all">{ticket.id}</p>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" className="w-full" onClick={handleDownload} data-testid="btn-download-ticket">
                  <Download className="w-4 h-4 mr-2" /> Download PDF Ticket
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {ticket.status === "active" && (
          <Card className="p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-sport-blue" /> Resell Ticket</h3>
            <p className="text-sm text-gray-500 mb-4">Can't attend? Resell your ticket safely inside TickFan at a fair price.</p>
            {!showResaleForm ? (
              <Button variant="outline" className="w-full" onClick={() => setShowResaleForm(true)} data-testid="btn-start-resale">
                <RefreshCw className="w-4 h-4 mr-2" /> List for Resale
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  Max resale price: ${Math.round(ticket.price * 1.5)} (150% of original ${ticket.price})
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Your Resale Price ($)</Label>
                  <Input
                    type="number"
                    placeholder={String(Math.round(ticket.price * 1.2))}
                    value={resalePrice}
                    onChange={e => setResalePrice(e.target.value)}
                    max={ticket.price * 3}
                    data-testid="input-resale-price"
                  />
                  {resalePrice && parseInt(resalePrice) > ticket.price * 1.5 && (
                    <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Price exceeds 150% — an integrity alert will be generated
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowResaleForm(false)} className="flex-1">Cancel</Button>
                  <Button
                    className="flex-1 bg-sport-blue text-white"
                    disabled={!resalePrice || parseInt(resalePrice) < 1 || resaleMutation.isPending}
                    onClick={() => resaleMutation.mutate()}
                    data-testid="btn-confirm-resale"
                  >
                    {resaleMutation.isPending ? "Listing..." : "Confirm Listing"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {ticket.status === "used" && (
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <CheckCircle2 className="w-6 h-6 text-gray-400 shrink-0" />
            <div>
              <p className="font-semibold text-gray-700">Ticket Used</p>
              <p className="text-sm text-gray-400">This ticket was verified at the venue gate.</p>
            </div>
          </div>
        )}

        {ticket.status === "resale" && (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <RefreshCw className="w-6 h-6 text-yellow-500 shrink-0" />
            <div>
              <p className="font-semibold text-yellow-700">Listed for Resale</p>
              <p className="text-sm text-yellow-600">Your ticket is currently listed in the resale market.</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>TickFan Protected Ticket — Verified & Secure</span>
        </div>
      </div>
    </div>
  );
}
