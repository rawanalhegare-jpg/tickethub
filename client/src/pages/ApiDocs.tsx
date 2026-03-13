import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Code2, Globe, Zap, Lock, CheckCircle2, ChevronRight, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const endpoints = [
  {
    method: "GET", path: "/api/events",
    desc: "Retrieve all active events with ticket availability",
    params: [],
    response: `[{\n  "id": "evt-1",\n  "title": "Saudi Pro League Clash",\n  "sport": "Football",\n  "homeTeam": "Al Hilal",\n  "awayTeam": "Al Nassr",\n  "date": "2026-04-15",\n  "venue": "King Fahd International Stadium",\n  "city": "Riyadh",\n  "fanZonePrice": 80\n}]`,
  },
  {
    method: "POST", path: "/api/tickets/purchase",
    desc: "Purchase a ticket for a specific event and category",
    body: `{\n  "eventId": "evt-1",\n  "category": "VIP",\n  "userId": "user-demo"\n}`,
    response: `{\n  "id": "tkt-abc123",\n  "eventId": "evt-1",\n  "category": "VIP",\n  "section": "VIP Lounge",\n  "row": "3",\n  "seat": "12",\n  "status": "active"\n}`,
  },
  {
    method: "GET", path: "/api/tickets/{id}",
    desc: "Retrieve a specific ticket by its ID",
    params: [{ name: "id", type: "string", desc: "The unique ticket identifier" }],
    response: `{\n  "id": "tkt-abc123",\n  "eventId": "evt-1",\n  "category": "Premium",\n  "status": "active",\n  "section": "A",\n  "row": "5",\n  "seat": "14"\n}`,
  },
  {
    method: "POST", path: "/api/verify-ticket",
    desc: "Verify a ticket at venue entry — marks ticket as used",
    body: `{\n  "ticketId": "tkt-abc123"\n}`,
    response: `{\n  "valid": true,\n  "message": "Ticket verified successfully",\n  "ticket": { ... }\n}`,
  },
  {
    method: "GET", path: "/api/resale",
    desc: "Browse all active resale listings with event and ticket details",
    params: [],
    response: `[{\n  "id": "res-1",\n  "ticketId": "tkt-abc123",\n  "price": 1100,\n  "originalPrice": 850,\n  "status": "active",\n  "event": { ... },\n  "ticket": { ... }\n}]`,
  },
  {
    method: "POST", path: "/api/resale",
    desc: "List a ticket on the official resale market",
    body: `{\n  "ticketId": "tkt-abc123",\n  "price": 1100,\n  "userId": "user-demo"\n}`,
    response: `{\n  "id": "res-new123",\n  "ticketId": "tkt-abc123",\n  "price": 1100,\n  "originalPrice": 850,\n  "status": "active"\n}`,
  },
];

const integrations = [
  { icon: "🏟️", title: "Stadium Systems", desc: "Connect turnstile systems for real-time ticket verification at entry gates." },
  { icon: "⚽", title: "Sports Clubs", desc: "Issue tickets directly from club management systems via API." },
  { icon: "💳", title: "Payment Providers", desc: "Integrate with Stripe, PayPal, Apple Pay for seamless checkout flows." },
  { icon: "🎫", title: "Ticketing Platforms", desc: "Sync inventory with third-party ticketing platforms and box offices." },
  { icon: "📱", title: "Mobile Apps", desc: "Build native iOS/Android apps with full TickFan functionality." },
  { icon: "🔔", title: "Event Systems", desc: "Webhook events for real-time purchase, transfer, and scan notifications." },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded">
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function EndpointCard({ endpoint }: { endpoint: typeof endpoints[0] }) {
  const [expanded, setExpanded] = useState(false);
  const methodColor = endpoint.method === "GET" ? "bg-emerald-900/50 text-emerald-300 border-emerald-700" : "bg-yellow-900/50 text-yellow-300 border-yellow-700";

  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden bg-gray-800/50" data-testid={`api-endpoint-${endpoint.path.replace(/\//g, "-").replace(/[{}]/g, "")}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-4 text-left"
      >
        <span className={`text-xs font-bold px-2.5 py-1 rounded-md border shrink-0 ${methodColor}`}>{endpoint.method}</span>
        <code className="text-sky-300 font-mono text-sm flex-1">{endpoint.path}</code>
        <span className="text-gray-500 text-sm hidden sm:block flex-1">{endpoint.desc}</span>
        <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-700">
          <p className="text-gray-300 text-sm mt-4 mb-4">{endpoint.desc}</p>
          {endpoint.params && endpoint.params.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Parameters</p>
              {endpoint.params.map(p => (
                <div key={p.name} className="flex items-center gap-3 text-sm">
                  <code className="text-sky-300 font-mono">{p.name}</code>
                  <span className="text-gray-500">{p.type}</span>
                  <span className="text-gray-400">{p.desc}</span>
                </div>
              ))}
            </div>
          )}
          {(endpoint as any).body && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Request Body</p>
              <div className="bg-gray-900 rounded-lg p-3 relative group">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={(endpoint as any).body} />
                </div>
                <pre className="text-sm text-green-300 font-mono overflow-x-auto">{(endpoint as any).body}</pre>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Response</p>
            <div className="bg-gray-900 rounded-lg p-3 relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={endpoint.response} />
              </div>
              <pre className="text-sm text-sky-300 font-mono overflow-x-auto">{endpoint.response}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="border-b border-gray-800 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <p className="text-sky-400 text-sm font-medium">Developer Platform</p>
              <h1 className="text-3xl font-extrabold text-white font-[Montserrat]">TickFan API</h1>
            </div>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mb-8">
            Integrate TickFan into your sports club, stadium system, or ticketing platform. Full REST API with webhooks and real-time event streams.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { icon: Globe, text: "REST API" },
              { icon: Lock, text: "API Key Auth" },
              { icon: Zap, text: "Webhooks" },
              { icon: CheckCircle2, text: "99.9% Uptime SLA" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-full text-sm text-gray-300">
                <Icon className="w-3.5 h-3.5 text-sky-400" />
                {text}
              </div>
            ))}
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Base URL</p>
            <code className="text-sky-300 font-mono">https://api.tickfan.com/v1</code>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication</h2>
          <p className="text-gray-400 text-sm mb-4">All API requests require an API key passed in the Authorization header:</p>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 font-mono text-sm">
            <span className="text-gray-500">Authorization: </span>
            <span className="text-sky-300">Bearer YOUR_API_KEY</span>
          </div>
        </div>

        <Separator className="bg-gray-800" />

        <div>
          <h2 className="text-xl font-bold text-white mb-5">Endpoints</h2>
          <div className="space-y-3">
            {endpoints.map((ep, i) => <EndpointCard key={i} endpoint={ep} />)}
          </div>
        </div>

        <Separator className="bg-gray-800" />

        <div>
          <h2 className="text-xl font-bold text-white mb-2">Integration Partners</h2>
          <p className="text-gray-400 text-sm mb-6">TickFan integrates with the world's leading sports and event technology platforms.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map(({ icon, title, desc }) => (
              <div key={title} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover-elevate">
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-gray-800" />

        <div className="bg-gradient-to-r from-blue-900/50 to-sky-900/50 border border-blue-700/50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Ready to Integrate?</h3>
          <p className="text-gray-400 mb-6">Get your API key and start building in minutes. Full documentation, SDKs, and sandbox environment included.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="bg-sport-sky-blue text-white px-8" data-testid="btn-get-api-key">
              Get API Key
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300">
              View SDK
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
