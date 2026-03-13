export interface FairScoreResult {
  score: number;
  label: "Fair" | "Slightly Higher" | "At Limit" | "Blocked";
  markupPct: number;
  isBlocked: boolean;
  color: "green" | "amber" | "orange" | "red";
  barColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

const MAX_MARKUP_PCT = 10;

export function calcFairScore(originalPrice: number, resalePrice: number): FairScoreResult {
  if (!originalPrice || originalPrice <= 0) {
    return { score: 100, label: "Fair", markupPct: 0, isBlocked: false, color: "green", barColor: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200" };
  }

  const markupPct = ((resalePrice - originalPrice) / originalPrice) * 100;

  if (markupPct > MAX_MARKUP_PCT) {
    const overBy = Math.round(markupPct - MAX_MARKUP_PCT);
    return { score: 0, label: "Blocked", markupPct: Math.round(markupPct * 10) / 10, isBlocked: true, color: "red", barColor: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200" };
  }

  const score = Math.max(0, Math.round(100 - (markupPct / MAX_MARKUP_PCT) * 100));

  if (score >= 70) {
    return { score, label: "Fair", markupPct: Math.round(markupPct * 10) / 10, isBlocked: false, color: "green", barColor: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200" };
  } else if (score >= 1) {
    return { score, label: "Slightly Higher", markupPct: Math.round(markupPct * 10) / 10, isBlocked: false, color: "amber", barColor: "bg-amber-400", textColor: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200" };
  } else {
    return { score: 0, label: "At Limit", markupPct: Math.round(markupPct * 10) / 10, isBlocked: false, color: "orange", barColor: "bg-orange-400", textColor: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200" };
  }
}
