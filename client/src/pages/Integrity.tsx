import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, Bot, Zap, Eye, CheckCircle2, Clock, TrendingUp, ShieldAlert, Users } from "lucide-react";
import type { IntegrityAlert } from "@shared/schema";

function RiskBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    "Safe": { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
    "Suspicious": { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
    "High Risk": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  };
  const c = config[status] || config["Safe"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

function RiskScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "bg-red-500" : score >= 40 ? "bg-yellow-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold w-8 text-right ${score >= 75 ? "text-red-600" : score >= 40 ? "text-yellow-600" : "text-emerald-600"}`}>
        {score}
      </span>
    </div>
  );
}

function AlertCard({ alert }: { alert: IntegrityAlert }) {
  const icons: Record<string, typeof Bot> = {
    "Bulk Purchase Attempt": ShieldAlert,
    "Bot-Like Behavior": Bot,
    "Suspicious Resale Price": TrendingUp,
    "Duplicate Ticket Scan": Eye,
    "Account Activity Pattern": Users,
    "Identity Verification Flag": Shield,
    "Normal Purchase": CheckCircle2,
    "Purchase": CheckCircle2,
  };
  const Icon = icons[alert.type] || AlertTriangle;

  return (
    <Card className={`p-5 border ${alert.status === "High Risk" ? "border-red-200 bg-red-50/40" : alert.status === "Suspicious" ? "border-yellow-200 bg-yellow-50/40" : "border-gray-100"}`} data-testid={`card-alert-${alert.id}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          alert.status === "High Risk" ? "bg-red-100" : alert.status === "Suspicious" ? "bg-yellow-100" : "bg-emerald-100"
        }`}>
          <Icon className={`w-5 h-5 ${alert.status === "High Risk" ? "text-red-600" : alert.status === "Suspicious" ? "text-yellow-600" : "text-emerald-600"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 text-sm">{alert.type}</p>
              <RiskBadge status={alert.status} />
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
              <Clock className="w-3 h-3" />
              {new Date(alert.timestamp).toLocaleString()}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Risk Score</span>
            </div>
            <RiskScoreBar score={alert.riskScore} />
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 font-mono text-xs text-gray-500 truncate">
            {alert.details}
          </div>
        </div>
      </div>
    </Card>
  );
}

const aiFeatures = [
  { icon: Bot, title: "Bot Detection", desc: "Analyzes purchase velocity and device fingerprints", color: "bg-blue-50 text-blue-600" },
  { icon: ShieldAlert, title: "Fraud Detection", desc: "ML models monitor suspicious account behavior", color: "bg-red-50 text-red-600" },
  { icon: Zap, title: "Dynamic Risk Scoring", desc: "0-100 real-time score on every transaction", color: "bg-purple-50 text-purple-600" },
  { icon: Eye, title: "Ticket Abuse Detection", desc: "Duplicate scan and transfer pattern detection", color: "bg-orange-50 text-orange-600" },
  { icon: Users, title: "Identity Verification", desc: "Biometric and document verification flagging", color: "bg-cyan-50 text-cyan-600" },
];

export default function Integrity() {
  const { data: alerts = [], isLoading } = useQuery<IntegrityAlert[]>({
    queryKey: ["/api/integrity/alerts"],
  });

  const highRisk = alerts.filter(a => a.status === "High Risk");
  const suspicious = alerts.filter(a => a.status === "Suspicious");
  const safe = alerts.filter(a => a.status === "Safe");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-800 to-blue-600 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-200 text-sm font-medium">AI-Powered</p>
              <h1 className="text-3xl font-extrabold text-white font-[Montserrat]">Integrity Dashboard</h1>
            </div>
          </div>
          <p className="text-blue-100 mb-8 max-w-xl">Real-time anti-fraud monitoring system protecting fans and venues from ticket abuse.</p>
          <div className="flex flex-wrap gap-4">
            {[
              { label: "High Risk", count: highRisk.length, color: "bg-red-500" },
              { label: "Suspicious", count: suspicious.length, color: "bg-yellow-500" },
              { label: "Safe", count: safe.length, color: "bg-emerald-500" },
              { label: "Total Alerts", count: alerts.length, color: "bg-blue-400" },
            ].map(({ label, count, color }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-white text-sm"><span className="font-bold text-lg">{count}</span> {label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">AI Security Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {aiFeatures.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-xl p-4 border border-gray-100 hover-elevate">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Alerts</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Live monitoring</span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {highRisk.map(a => <AlertCard key={a.id} alert={a} />)}
              {suspicious.map(a => <AlertCard key={a.id} alert={a} />)}
              {safe.map(a => <AlertCard key={a.id} alert={a} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
