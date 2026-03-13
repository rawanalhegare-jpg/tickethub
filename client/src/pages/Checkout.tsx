import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ChevronLeft, ShieldCheck, CreditCard, Ticket, CheckCircle2, ArrowRight,
  Lock, Calendar, MapPin, User, Mail
} from "lucide-react";
import type { Event, Ticket as TicketType } from "@shared/schema";

const steps = ["Select Ticket", "Your Details", "Confirm & Pay"];

export default function Checkout() {
  const { eventId } = useParams<{ eventId: string }>();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const category = params.get("category") || "Regular";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "Alex Johnson", email: "alex@tickfan.com", phone: "+1 555-0100" });
  const [purchased, setPurchased] = useState<TicketType | null>(null);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) throw new Error("Event not found");
      return res.json();
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tickets/purchase", { eventId, category, userId: "user-demo" });
      return res.json();
    },
    onSuccess: (ticket: TicketType) => {
      setPurchased(ticket);
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Purchase Successful!", description: "Your ticket has been issued and added to My Tickets." });
    },
    onError: () => {
      toast({ title: "Purchase Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const priceMap: Record<string, number> = event ? {
    VIP: event.vipPrice, Premium: event.premiumPrice, Regular: event.regularPrice, "Fan Zone": event.fanZonePrice,
  } : {};
  const price = priceMap[category] || 0;
  const serviceFee = Math.round(price * 0.05);
  const total = price + serviceFee;

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8"><Skeleton className="h-80 rounded-xl" /></div>;
  if (!event) return <div className="text-center py-20"><p className="text-gray-500">Event not found</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center gap-4">
          <Link href={`/events/${eventId}`}>
            <Button variant="ghost" size="sm" data-testid="btn-back-event">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-sport-blue text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${step === i + 1 ? "text-sport-blue" : "text-gray-400"}`}>{s}</span>
                {i < steps.length - 1 && <div className={`w-8 h-0.5 ${step > i + 1 ? "bg-emerald-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {step === 3 && purchased ? (
          <div className="text-center py-10 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3 font-[Montserrat]">Purchase Complete!</h2>
            <p className="text-gray-500 text-lg mb-2">Your ticket has been issued and secured.</p>
            <p className="text-gray-400 text-sm mb-8">Ticket ID: <span className="font-mono font-semibold text-gray-700">{purchased.id}</span></p>
            <div className="max-w-sm mx-auto bg-gradient-to-br from-sport-blue to-sky-500 rounded-2xl p-6 text-white mb-8 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Ticket className="w-5 h-5" />
                <span className="font-bold">TickFan Digital Ticket</span>
              </div>
              <p className="font-bold text-lg mb-1">{event.homeTeam} vs {event.awayTeam}</p>
              <p className="text-sky-200 text-sm mb-4">{event.title}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-sky-200 text-xs">Category</p><p className="font-semibold">{purchased.category}</p></div>
                <div><p className="text-sky-200 text-xs">Section</p><p className="font-semibold">{purchased.section}</p></div>
                <div><p className="text-sky-200 text-xs">Row</p><p className="font-semibold">{purchased.row}</p></div>
                <div><p className="text-sky-200 text-xs">Seat</p><p className="font-semibold">{purchased.seat}</p></div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-sky-200 text-xs">{event.venue} · {event.city}</p>
                <p className="text-sky-200 text-xs">{new Date(event.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {event.time}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/my-tickets">
                <Button className="bg-sport-blue text-white px-8" data-testid="btn-view-my-tickets">
                  <Ticket className="w-4 h-4 mr-2" /> View My Tickets
                </Button>
              </Link>
              <Link href={`/tickets/${purchased.id}`}>
                <Button variant="outline" data-testid="btn-view-ticket-detail">
                  View Ticket Details
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {step === 1 && (
                <Card className="p-6 animate-fade-in">
                  <h3 className="font-bold text-gray-900 text-lg mb-4">Ticket Summary</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl p-5 border border-blue-100">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{event.homeTeam} vs {event.awayTeam}</p>
                        <p className="text-gray-500 text-sm mb-2">{event.title}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(event.date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.city}</span>
                        </div>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full font-medium border">{category}</span>
                      </div>
                      <p className="text-2xl font-extrabold text-sport-blue">${price}</p>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-sport-blue text-white h-12 text-base font-semibold" onClick={() => setStep(2)} data-testid="btn-next-details">
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Card>
              )}

              {step === 2 && (
                <Card className="p-6 animate-fade-in">
                  <h3 className="font-bold text-gray-900 text-lg mb-5">Your Details</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input id="name" className="pl-10" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" data-testid="input-name" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 block">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input id="email" type="email" className="pl-10" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" data-testid="input-email" />
                      </div>
                    </div>
                    <Separator />
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Payment (Demo)</h4>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
                      <Lock className="w-4 h-4 shrink-0" />
                      <span>This is a demo. No real payment will be processed.</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm mb-1.5 block">Card Number</Label>
                        <Input defaultValue="4242 4242 4242 4242" readOnly className="bg-gray-50" data-testid="input-card-number" />
                      </div>
                      <div>
                        <Label className="text-sm mb-1.5 block">Expiry</Label>
                        <Input defaultValue="12/28" readOnly className="bg-gray-50" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                    <Button className="flex-2 bg-sport-blue text-white h-12 font-semibold" onClick={() => purchaseMutation.mutate()} disabled={purchaseMutation.isPending} data-testid="btn-confirm-purchase">
                      {purchaseMutation.isPending ? "Processing..." : `Pay $${total}`}
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            <div className="lg:col-span-2">
              <Card className="p-5 border border-gray-100 sticky top-20">
                <h4 className="font-bold text-gray-900 mb-4">Order Summary</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Ticket ({category})</span><span>${price}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Service fee (5%)</span><span>${serviceFee}</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-sport-blue">${total}</span></div>
                </div>
                <div className="mt-5 space-y-2 pt-4 border-t border-gray-100">
                  {["Secure checkout", "Instant digital delivery", "Buyer protection guaranteed"].map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-gray-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
