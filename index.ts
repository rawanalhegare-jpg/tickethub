import https from "https";

const API_KEY = process.env.FOOTBALL_DATA_API_KEY || "";
const BASE_URL = "api.football-data.org";
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function apiRequest(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      path,
      headers: { "X-Auth-Token": API_KEY },
    };
    https
      .get(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.errorCode) {
              reject(new Error(json.message || "API error"));
            } else {
              resolve(json);
            }
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function cachedRequest(path: string): Promise<any> {
  const cached = cache.get(path);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  const data = await apiRequest(path);
  cache.set(path, { data, expiresAt: Date.now() + CACHE_TTL });
  return data;
}

export function normalizeStatus(apiStatus: string): "upcoming" | "live" | "finished" | "postponed" {
  switch (apiStatus) {
    case "IN_PLAY":
    case "LIVE":
    case "PAUSED":
    case "HALFTIME":
      return "live";
    case "FINISHED":
    case "AWARDED":
      return "finished";
    case "POSTPONED":
    case "CANCELLED":
    case "SUSPENDED":
      return "postponed";
    default:
      return "upcoming";
  }
}

export const COMPETITIONS = [
  { code: "PL", name: "Premier League", country: "England", emblem: "https://crests.football-data.org/PL.png" },
  { code: "PD", name: "La Liga", country: "Spain", emblem: "https://crests.football-data.org/PD.png" },
  { code: "BL1", name: "Bundesliga", country: "Germany", emblem: "https://crests.football-data.org/BL1.png" },
  { code: "SA", name: "Serie A", country: "Italy", emblem: "https://crests.football-data.org/SA.png" },
  { code: "FL1", name: "Ligue 1", country: "France", emblem: "https://crests.football-data.org/FL1.png" },
  { code: "CL", name: "UEFA Champions League", country: "Europe", emblem: "https://crests.football-data.org/CL.png" },
  { code: "SPL", name: "Saudi Pro League", country: "Saudi Arabia", emblem: "" },
  { code: "ACL", name: "AFC Champions League", country: "Asia", emblem: "" },
];

function normalizeMatch(m: any, competitionCode?: string, competitionName?: string): any {
  return {
    id: String(m.id),
    competitionCode: m.competition?.code || competitionCode || "PL",
    competitionName: m.competition?.name || competitionName || "Premier League",
    competitionEmblem: m.competition?.emblem || "",
    homeTeam: {
      id: m.homeTeam?.id,
      name: m.homeTeam?.name || "TBD",
      crest: m.homeTeam?.crest || "",
      shortName: m.homeTeam?.shortName || m.homeTeam?.name || "TBD",
    },
    awayTeam: {
      id: m.awayTeam?.id,
      name: m.awayTeam?.name || "TBD",
      crest: m.awayTeam?.crest || "",
      shortName: m.awayTeam?.shortName || m.awayTeam?.name || "TBD",
    },
    utcDate: m.utcDate,
    status: normalizeStatus(m.status || "SCHEDULED"),
    matchday: m.matchday,
    venue: m.venue || "TBD",
    score: m.score,
    prices: {
      vip: 500,
      premium: 250,
      regular: 100,
      fanZone: 50,
    },
  };
}

const d = (offsetDays: number) => new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000).toISOString();

export const FALLBACK_MATCHES = [
  // Premier League
  { id: "fb_1", competitionCode: "PL", competitionName: "Premier League", competitionEmblem: "https://crests.football-data.org/PL.png", homeTeam: { id: 57, name: "Arsenal FC", crest: "https://crests.football-data.org/57.png", shortName: "Arsenal" }, awayTeam: { id: 61, name: "Chelsea FC", crest: "https://crests.football-data.org/61.png", shortName: "Chelsea" }, utcDate: d(3), status: "upcoming", matchday: 30, venue: "Emirates Stadium", score: null, prices: { vip: 500, premium: 250, regular: 100, fanZone: 50 } },
  { id: "fb_2", competitionCode: "PL", competitionName: "Premier League", competitionEmblem: "https://crests.football-data.org/PL.png", homeTeam: { id: 65, name: "Manchester City FC", crest: "https://crests.football-data.org/65.png", shortName: "Man City" }, awayTeam: { id: 66, name: "Manchester United FC", crest: "https://crests.football-data.org/66.png", shortName: "Man Utd" }, utcDate: d(5), status: "upcoming", matchday: 30, venue: "Etihad Stadium", score: null, prices: { vip: 500, premium: 250, regular: 100, fanZone: 50 } },
  { id: "fb_3", competitionCode: "PL", competitionName: "Premier League", competitionEmblem: "https://crests.football-data.org/PL.png", homeTeam: { id: 73, name: "Tottenham Hotspur FC", crest: "https://crests.football-data.org/73.png", shortName: "Spurs" }, awayTeam: { id: 64, name: "Liverpool FC", crest: "https://crests.football-data.org/64.png", shortName: "Liverpool" }, utcDate: d(7), status: "upcoming", matchday: 30, venue: "Tottenham Hotspur Stadium", score: null, prices: { vip: 500, premium: 250, regular: 100, fanZone: 50 } },
  { id: "fb_10", competitionCode: "PL", competitionName: "Premier League", competitionEmblem: "https://crests.football-data.org/PL.png", homeTeam: { id: 64, name: "Liverpool FC", crest: "https://crests.football-data.org/64.png", shortName: "Liverpool" }, awayTeam: { id: 65, name: "Manchester City FC", crest: "https://crests.football-data.org/65.png", shortName: "Man City" }, utcDate: d(22), status: "upcoming", matchday: 31, venue: "Anfield", score: null, prices: { vip: 500, premium: 250, regular: 100, fanZone: 50 } },
  // Champions League
  { id: "fb_4", competitionCode: "CL", competitionName: "UEFA Champions League", competitionEmblem: "https://crests.football-data.org/CL.png", homeTeam: { id: 86, name: "Real Madrid CF", crest: "https://crests.football-data.org/86.png", shortName: "Real Madrid" }, awayTeam: { id: 57, name: "Arsenal FC", crest: "https://crests.football-data.org/57.png", shortName: "Arsenal" }, utcDate: d(9), status: "upcoming", matchday: 6, venue: "Santiago Bernabéu", score: null, prices: { vip: 650, premium: 350, regular: 150, fanZone: 75 } },
  { id: "fb_8", competitionCode: "CL", competitionName: "UEFA Champions League", competitionEmblem: "https://crests.football-data.org/CL.png", homeTeam: { id: 65, name: "Manchester City FC", crest: "https://crests.football-data.org/65.png", shortName: "Man City" }, awayTeam: { id: 81, name: "FC Barcelona", crest: "https://crests.football-data.org/81.png", shortName: "Barcelona" }, utcDate: d(18), status: "upcoming", matchday: 6, venue: "Etihad Stadium", score: null, prices: { vip: 650, premium: 350, regular: 150, fanZone: 75 } },
  // La Liga
  { id: "fb_5", competitionCode: "PD", competitionName: "La Liga", competitionEmblem: "https://crests.football-data.org/PD.png", homeTeam: { id: 81, name: "FC Barcelona", crest: "https://crests.football-data.org/81.png", shortName: "Barcelona" }, awayTeam: { id: 86, name: "Real Madrid CF", crest: "https://crests.football-data.org/86.png", shortName: "Real Madrid" }, utcDate: d(12), status: "upcoming", matchday: 29, venue: "Camp Nou", score: null, prices: { vip: 600, premium: 320, regular: 130, fanZone: 65 } },
  // Bundesliga
  { id: "fb_6", competitionCode: "BL1", competitionName: "Bundesliga", competitionEmblem: "https://crests.football-data.org/BL1.png", homeTeam: { id: 5, name: "FC Bayern München", crest: "https://crests.football-data.org/5.png", shortName: "Bayern" }, awayTeam: { id: 4, name: "Borussia Dortmund", crest: "https://crests.football-data.org/4.png", shortName: "Dortmund" }, utcDate: d(14), status: "upcoming", matchday: 26, venue: "Allianz Arena", score: null, prices: { vip: 450, premium: 230, regular: 90, fanZone: 45 } },
  // Serie A
  { id: "fb_7", competitionCode: "SA", competitionName: "Serie A", competitionEmblem: "https://crests.football-data.org/SA.png", homeTeam: { id: 109, name: "Juventus FC", crest: "https://crests.football-data.org/109.png", shortName: "Juventus" }, awayTeam: { id: 108, name: "FC Internazionale Milano", crest: "https://crests.football-data.org/108.png", shortName: "Inter" }, utcDate: d(16), status: "upcoming", matchday: 29, venue: "Allianz Stadium", score: null, prices: { vip: 420, premium: 210, regular: 85, fanZone: 40 } },
  // Ligue 1
  { id: "fb_9", competitionCode: "FL1", competitionName: "Ligue 1", competitionEmblem: "https://crests.football-data.org/FL1.png", homeTeam: { id: 524, name: "Paris Saint-Germain FC", crest: "https://crests.football-data.org/524.png", shortName: "PSG" }, awayTeam: { id: 548, name: "AS Monaco FC", crest: "https://crests.football-data.org/548.png", shortName: "Monaco" }, utcDate: d(20), status: "upcoming", matchday: 28, venue: "Parc des Princes", score: null, prices: { vip: 480, premium: 240, regular: 95, fanZone: 48 } },
  // Saudi Pro League
  { id: "spl_1", competitionCode: "SPL", competitionName: "Saudi Pro League", competitionEmblem: "", homeTeam: { id: 5001, name: "Al Hilal FC", crest: "", shortName: "Al Hilal" }, awayTeam: { id: 5002, name: "Al Nassr FC", crest: "", shortName: "Al Nassr" }, utcDate: d(4), status: "upcoming", matchday: 25, venue: "King Fahd Stadium, Riyadh", score: null, prices: { vip: 800, premium: 400, regular: 160, fanZone: 70 } },
  { id: "spl_2", competitionCode: "SPL", competitionName: "Saudi Pro League", competitionEmblem: "", homeTeam: { id: 5003, name: "Al Ittihad Club", crest: "", shortName: "Al Ittihad" }, awayTeam: { id: 5004, name: "Al Ahli SC", crest: "", shortName: "Al Ahli" }, utcDate: d(6), status: "upcoming", matchday: 25, venue: "King Abdullah Sports City, Jeddah", score: null, prices: { vip: 720, premium: 360, regular: 140, fanZone: 60 } },
  { id: "spl_3", competitionCode: "SPL", competitionName: "Saudi Pro League", competitionEmblem: "", homeTeam: { id: 5002, name: "Al Nassr FC", crest: "", shortName: "Al Nassr" }, awayTeam: { id: 5005, name: "Al Shabab FC", crest: "", shortName: "Al Shabab" }, utcDate: d(10), status: "upcoming", matchday: 26, venue: "Al Awwal Park, Riyadh", score: null, prices: { vip: 680, premium: 340, regular: 130, fanZone: 55 } },
  { id: "spl_4", competitionCode: "SPL", competitionName: "Saudi Pro League", competitionEmblem: "", homeTeam: { id: 5001, name: "Al Hilal FC", crest: "", shortName: "Al Hilal" }, awayTeam: { id: 5004, name: "Al Ahli SC", crest: "", shortName: "Al Ahli" }, utcDate: d(13), status: "upcoming", matchday: 26, venue: "King Fahd Stadium, Riyadh", score: null, prices: { vip: 760, premium: 380, regular: 150, fanZone: 65 } },
  { id: "spl_5", competitionCode: "SPL", competitionName: "Saudi Pro League", competitionEmblem: "", homeTeam: { id: 5006, name: "Al Qadsiah FC", crest: "", shortName: "Al Qadsiah" }, awayTeam: { id: 5003, name: "Al Ittihad Club", crest: "", shortName: "Al Ittihad" }, utcDate: d(17), status: "upcoming", matchday: 27, venue: "King Fahd University Stadium", score: null, prices: { vip: 600, premium: 300, regular: 120, fanZone: 50 } },
  // AFC Champions League
  { id: "acl_1", competitionCode: "ACL", competitionName: "AFC Champions League", competitionEmblem: "", homeTeam: { id: 5001, name: "Al Hilal FC", crest: "", shortName: "Al Hilal" }, awayTeam: { id: 6001, name: "Persepolis FC", crest: "", shortName: "Persepolis" }, utcDate: d(11), status: "upcoming", matchday: 5, venue: "King Fahd Stadium, Riyadh", score: null, prices: { vip: 550, premium: 280, regular: 110, fanZone: 55 } },
  { id: "acl_2", competitionCode: "ACL", competitionName: "AFC Champions League", competitionEmblem: "", homeTeam: { id: 5002, name: "Al Nassr FC", crest: "", shortName: "Al Nassr" }, awayTeam: { id: 6002, name: "Pohang Steelers", crest: "", shortName: "Pohang" }, utcDate: d(14), status: "upcoming", matchday: 5, venue: "Al Awwal Park, Riyadh", score: null, prices: { vip: 520, premium: 260, regular: 105, fanZone: 52 } },
  { id: "acl_3", competitionCode: "ACL", competitionName: "AFC Champions League", competitionEmblem: "", homeTeam: { id: 5003, name: "Al Ittihad Club", crest: "", shortName: "Al Ittihad" }, awayTeam: { id: 6003, name: "Ulsan HD FC", crest: "", shortName: "Ulsan" }, utcDate: d(19), status: "upcoming", matchday: 5, venue: "King Abdullah Sports City, Jeddah", score: null, prices: { vip: 510, premium: 255, regular: 102, fanZone: 51 } },
];

const FALLBACK_STANDINGS: Record<string, any[]> = {
  PL: [
    { position: 1, team: { name: "Liverpool FC", crest: "https://crests.football-data.org/64.png" }, playedGames: 29, won: 22, draw: 4, lost: 3, points: 70, goalsFor: 72, goalsAgainst: 30, goalDifference: 42 },
    { position: 2, team: { name: "Manchester City FC", crest: "https://crests.football-data.org/65.png" }, playedGames: 29, won: 20, draw: 5, lost: 4, points: 65, goalsFor: 68, goalsAgainst: 35, goalDifference: 33 },
    { position: 3, team: { name: "Arsenal FC", crest: "https://crests.football-data.org/57.png" }, playedGames: 29, won: 19, draw: 6, lost: 4, points: 63, goalsFor: 65, goalsAgainst: 28, goalDifference: 37 },
    { position: 4, team: { name: "Chelsea FC", crest: "https://crests.football-data.org/61.png" }, playedGames: 29, won: 17, draw: 5, lost: 7, points: 56, goalsFor: 58, goalsAgainst: 40, goalDifference: 18 },
    { position: 5, team: { name: "Tottenham Hotspur FC", crest: "https://crests.football-data.org/73.png" }, playedGames: 29, won: 15, draw: 6, lost: 8, points: 51, goalsFor: 55, goalsAgainst: 45, goalDifference: 10 },
    { position: 6, team: { name: "Newcastle United FC", crest: "https://crests.football-data.org/67.png" }, playedGames: 29, won: 14, draw: 6, lost: 9, points: 48, goalsFor: 50, goalsAgainst: 42, goalDifference: 8 },
  ],
  PD: [
    { position: 1, team: { name: "Real Madrid CF", crest: "https://crests.football-data.org/86.png" }, playedGames: 29, won: 21, draw: 5, lost: 3, points: 68, goalsFor: 70, goalsAgainst: 28, goalDifference: 42 },
    { position: 2, team: { name: "FC Barcelona", crest: "https://crests.football-data.org/81.png" }, playedGames: 29, won: 20, draw: 4, lost: 5, points: 64, goalsFor: 66, goalsAgainst: 32, goalDifference: 34 },
    { position: 3, team: { name: "Atlético de Madrid", crest: "https://crests.football-data.org/78.png" }, playedGames: 29, won: 17, draw: 7, lost: 5, points: 58, goalsFor: 52, goalsAgainst: 30, goalDifference: 22 },
    { position: 4, team: { name: "Villarreal CF", crest: "https://crests.football-data.org/94.png" }, playedGames: 29, won: 14, draw: 6, lost: 9, points: 48, goalsFor: 45, goalsAgainst: 38, goalDifference: 7 },
  ],
  BL1: [
    { position: 1, team: { name: "FC Bayern München", crest: "https://crests.football-data.org/5.png" }, playedGames: 26, won: 19, draw: 4, lost: 3, points: 61, goalsFor: 68, goalsAgainst: 30, goalDifference: 38 },
    { position: 2, team: { name: "Borussia Dortmund", crest: "https://crests.football-data.org/4.png" }, playedGames: 26, won: 16, draw: 5, lost: 5, points: 53, goalsFor: 57, goalsAgainst: 38, goalDifference: 19 },
    { position: 3, team: { name: "Bayer Leverkusen", crest: "https://crests.football-data.org/3.png" }, playedGames: 26, won: 15, draw: 6, lost: 5, points: 51, goalsFor: 54, goalsAgainst: 32, goalDifference: 22 },
    { position: 4, team: { name: "RB Leipzig", crest: "https://crests.football-data.org/721.png" }, playedGames: 26, won: 14, draw: 5, lost: 7, points: 47, goalsFor: 48, goalsAgainst: 36, goalDifference: 12 },
  ],
  SA: [
    { position: 1, team: { name: "FC Internazionale Milano", crest: "https://crests.football-data.org/108.png" }, playedGames: 28, won: 20, draw: 5, lost: 3, points: 65, goalsFor: 66, goalsAgainst: 28, goalDifference: 38 },
    { position: 2, team: { name: "Juventus FC", crest: "https://crests.football-data.org/109.png" }, playedGames: 28, won: 17, draw: 7, lost: 4, points: 58, goalsFor: 52, goalsAgainst: 28, goalDifference: 24 },
    { position: 3, team: { name: "AC Milan", crest: "https://crests.football-data.org/98.png" }, playedGames: 28, won: 16, draw: 6, lost: 6, points: 54, goalsFor: 55, goalsAgainst: 35, goalDifference: 20 },
    { position: 4, team: { name: "SSC Napoli", crest: "https://crests.football-data.org/113.png" }, playedGames: 28, won: 14, draw: 7, lost: 7, points: 49, goalsFor: 50, goalsAgainst: 38, goalDifference: 12 },
  ],
  FL1: [
    { position: 1, team: { name: "Paris Saint-Germain FC", crest: "https://crests.football-data.org/524.png" }, playedGames: 27, won: 20, draw: 4, lost: 3, points: 64, goalsFor: 65, goalsAgainst: 24, goalDifference: 41 },
    { position: 2, team: { name: "AS Monaco FC", crest: "https://crests.football-data.org/548.png" }, playedGames: 27, won: 17, draw: 5, lost: 5, points: 56, goalsFor: 58, goalsAgainst: 30, goalDifference: 28 },
    { position: 3, team: { name: "Olympique Lyonnais", crest: "https://crests.football-data.org/523.png" }, playedGames: 27, won: 15, draw: 6, lost: 6, points: 51, goalsFor: 50, goalsAgainst: 33, goalDifference: 17 },
  ],
  CL: [
    { position: 1, team: { name: "Real Madrid CF", crest: "https://crests.football-data.org/86.png" }, playedGames: 8, won: 6, draw: 1, lost: 1, points: 19, goalsFor: 22, goalsAgainst: 9, goalDifference: 13 },
    { position: 2, team: { name: "FC Bayern München", crest: "https://crests.football-data.org/5.png" }, playedGames: 8, won: 5, draw: 2, lost: 1, points: 17, goalsFor: 18, goalsAgainst: 10, goalDifference: 8 },
    { position: 3, team: { name: "Manchester City FC", crest: "https://crests.football-data.org/65.png" }, playedGames: 8, won: 5, draw: 1, lost: 2, points: 16, goalsFor: 16, goalsAgainst: 11, goalDifference: 5 },
    { position: 4, team: { name: "Arsenal FC", crest: "https://crests.football-data.org/57.png" }, playedGames: 8, won: 4, draw: 3, lost: 1, points: 15, goalsFor: 14, goalsAgainst: 8, goalDifference: 6 },
  ],
  SPL: [
    { position: 1, team: { name: "Al Hilal FC", crest: "" }, playedGames: 24, won: 19, draw: 3, lost: 2, points: 60, goalsFor: 65, goalsAgainst: 22, goalDifference: 43 },
    { position: 2, team: { name: "Al Nassr FC", crest: "" }, playedGames: 24, won: 17, draw: 4, lost: 3, points: 55, goalsFor: 58, goalsAgainst: 28, goalDifference: 30 },
    { position: 3, team: { name: "Al Ittihad Club", crest: "" }, playedGames: 24, won: 15, draw: 5, lost: 4, points: 50, goalsFor: 50, goalsAgainst: 30, goalDifference: 20 },
    { position: 4, team: { name: "Al Ahli SC", crest: "" }, playedGames: 24, won: 13, draw: 5, lost: 6, points: 44, goalsFor: 44, goalsAgainst: 32, goalDifference: 12 },
    { position: 5, team: { name: "Al Shabab FC", crest: "" }, playedGames: 24, won: 11, draw: 6, lost: 7, points: 39, goalsFor: 38, goalsAgainst: 35, goalDifference: 3 },
    { position: 6, team: { name: "Al Qadsiah FC", crest: "" }, playedGames: 24, won: 9, draw: 7, lost: 8, points: 34, goalsFor: 32, goalsAgainst: 38, goalDifference: -6 },
  ],
  ACL: [
    { position: 1, team: { name: "Al Hilal FC", crest: "" }, playedGames: 6, won: 5, draw: 0, lost: 1, points: 15, goalsFor: 16, goalsAgainst: 6, goalDifference: 10 },
    { position: 2, team: { name: "Al Nassr FC", crest: "" }, playedGames: 6, won: 4, draw: 1, lost: 1, points: 13, goalsFor: 13, goalsAgainst: 7, goalDifference: 6 },
    { position: 3, team: { name: "Persepolis FC", crest: "" }, playedGames: 6, won: 3, draw: 2, lost: 1, points: 11, goalsFor: 10, goalsAgainst: 8, goalDifference: 2 },
    { position: 4, team: { name: "Pohang Steelers", crest: "" }, playedGames: 6, won: 2, draw: 2, lost: 2, points: 8, goalsFor: 8, goalsAgainst: 10, goalDifference: -2 },
  ],
};

export async function getMatches(competitionCode?: string, dateFrom?: string, dateTo?: string): Promise<any[]> {
  // Saudi and AFC are local only
  if (competitionCode === "SPL" || competitionCode === "ACL") {
    return FALLBACK_MATCHES.filter(m => m.competitionCode === competitionCode);
  }
  try {
    let path = "/v4/matches?status=SCHEDULED";
    if (competitionCode) path = `/v4/competitions/${competitionCode}/matches?status=SCHEDULED`;
    if (dateFrom) path += `&dateFrom=${dateFrom}`;
    if (dateTo) path += `&dateTo=${dateTo}`;

    const data = await cachedRequest(path);
    const matches = data.matches || [];
    const normalized = matches.map((m: any) => normalizeMatch(m, competitionCode));
    return normalized.length > 0 ? normalized : FALLBACK_MATCHES.filter(m => !competitionCode || m.competitionCode === competitionCode);
  } catch {
    return FALLBACK_MATCHES.filter(m => !competitionCode || m.competitionCode === competitionCode);
  }
}

export async function getAllMatches(): Promise<any[]> {
  try {
    const data = await cachedRequest("/v4/matches?status=SCHEDULED");
    const matches = (data.matches || []).map((m: any) => normalizeMatch(m));
    if (matches.length > 0) {
      return [...matches, ...FALLBACK_MATCHES.filter(m => m.competitionCode === "SPL" || m.competitionCode === "ACL")];
    }
  } catch {
    // fall through
  }
  return FALLBACK_MATCHES;
}

export async function getMatch(id: string): Promise<any | null> {
  const fallback = FALLBACK_MATCHES.find(m => m.id === id);
  if (fallback) return fallback;

  try {
    const data = await cachedRequest(`/v4/matches/${id}`);
    return normalizeMatch(data);
  } catch {
    return null;
  }
}

export async function getStandings(competitionCode: string): Promise<any[]> {
  if (competitionCode === "SPL" || competitionCode === "ACL") {
    return FALLBACK_STANDINGS[competitionCode] || [];
  }
  try {
    const data = await cachedRequest(`/v4/competitions/${competitionCode}/standings`);
    const table = data.standings?.find((s: any) => s.type === "TOTAL")?.table || [];
    return table.length > 0 ? table : (FALLBACK_STANDINGS[competitionCode] || []);
  } catch {
    return FALLBACK_STANDINGS[competitionCode] || [];
  }
}

export async function getCompetitions() {
  return COMPETITIONS;
}
