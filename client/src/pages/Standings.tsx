import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const LEAGUES = [
  { code: "SPL", name: "Saudi Pro League", flag: "🇸🇦" },
  { code: "ACL", name: "AFC Champions", flag: "🏆" },
  { code: "PL", name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "PD", name: "La Liga", flag: "🇪🇸" },
  { code: "BL1", name: "Bundesliga", flag: "🇩🇪" },
  { code: "SA", name: "Serie A", flag: "🇮🇹" },
  { code: "FL1", name: "Ligue 1", flag: "🇫🇷" },
  { code: "CL", name: "Champions League", flag: "🏆" },
];

interface Standing {
  position: number;
  team: { name: string; crest: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

function StandingsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default function Standings() {
  const [selectedLeague, setSelectedLeague] = useState("SPL");

  const { data: standings, isLoading } = useQuery<Standing[]>({
    queryKey: ["/api/leagues", selectedLeague, "standings"],
    queryFn: async () => {
      const res = await fetch(`/api/leagues/${selectedLeague}/standings`);
      return res.json();
    },
  });

  const leagueName = LEAGUES.find(l => l.code === selectedLeague)?.name || selectedLeague;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">League Standings</h1>
        <p className="text-gray-500">Current season standings across major leagues</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {LEAGUES.map(l => (
          <button
            key={l.code}
            data-testid={`tab-league-${l.code}`}
            onClick={() => setSelectedLeague(l.code)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedLeague === l.code
                ? "bg-sport-blue text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {l.flag} {l.name}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{leagueName} Table</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <StandingsSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left py-2 w-8">#</th>
                    <th className="text-left py-2">Club</th>
                    <th className="text-center py-2 w-10">P</th>
                    <th className="text-center py-2 w-10">W</th>
                    <th className="text-center py-2 w-10">D</th>
                    <th className="text-center py-2 w-10">L</th>
                    <th className="text-center py-2 w-12">GD</th>
                    <th className="text-center py-2 w-12 font-bold text-gray-900">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings?.map((row, idx) => (
                    <tr
                      key={row.position}
                      data-testid={`row-standing-${idx}`}
                      className={`border-b last:border-0 ${
                        row.position <= 4 ? "bg-green-50" : row.position <= 6 ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="py-3">
                        <span className={`font-bold text-sm ${
                          row.position <= 4 ? "text-green-700" : row.position <= 6 ? "text-blue-700" : "text-gray-500"
                        }`}>
                          {row.position}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {row.team.crest ? (
                            <img src={row.team.crest} alt="" className="w-6 h-6 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-sport-blue flex items-center justify-center text-white text-xs font-bold">
                              {row.team.name[0]}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{row.team.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 text-gray-600">{row.playedGames}</td>
                      <td className="text-center py-3 text-gray-600">{row.won}</td>
                      <td className="text-center py-3 text-gray-600">{row.draw}</td>
                      <td className="text-center py-3 text-gray-600">{row.lost}</td>
                      <td className="text-center py-3 text-gray-600">
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </td>
                      <td className="text-center py-3 font-bold text-gray-900">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex gap-4 mt-4 pt-3 border-t text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-200" />
                  <span>{selectedLeague === "SPL" ? "AFC Champions League" : "Next Round / Champions League"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-200" />
                  <span>{selectedLeague === "SPL" ? "AFC Champions League Play-off" : "Europa League"}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
