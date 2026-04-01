import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// ─── In-memory cache for World Bank data ──────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}
const worldBankCache: CacheEntry<WorldBankResponse> | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let wbCacheEntry: CacheEntry<WorldBankResponse> | null = null;

// ─── World Bank indicator definitions ─────────────────────────────────────────
const WB_INDICATORS: Record<string, string> = {
  "SE.PRM.ENRR":       "Primary Enrollment Rate (Gross %)",
  "SE.SEC.ENRR":       "Secondary Enrollment Rate (Gross %)",
  "SE.PRM.UNER":       "Out-of-School Children (Primary)",
  "SE.XPD.TOTL.GD.ZS": "Gov't Expenditure on Education (% GDP)",
  "SE.ADT.1524.LT.ZS": "Youth Literacy Rate (15–24)",
  "SE.PRM.TCAQ.ZS":    "Trained Teachers – Primary (%)",
};

interface WBRawEntry { date: string; value: number | null; }

interface IndicatorResult {
  code: string;
  name: string;
  latestValue: number | null;
  latestYear: string | null;
  unit: string;
  trend: { year: string; value: number }[];
}

interface WorldBankResponse {
  indicators: IndicatorResult[];
  fetchedAt: string;
}

async function fetchWorldBankIndicator(code: string): Promise<WBRawEntry[]> {
  const url = `https://api.worldbank.org/v2/country/NGA/indicator/${code}?format=json&date=2015:2024&per_page=20`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`WB API error ${res.status}`);
  const json = await res.json();
  // Response is [metadata, dataArray]
  if (!Array.isArray(json) || json.length < 2) return [];
  return (json[1] as WBRawEntry[]) || [];
}

function unitForIndicator(code: string): string {
  if (code === "SE.PRM.UNER") return "children";
  if (code === "SE.XPD.TOTL.GD.ZS") return "% of GDP";
  return "%";
}

async function fetchAllWorldBankData(): Promise<WorldBankResponse> {
  const now = Date.now();
  if (wbCacheEntry && now - wbCacheEntry.fetchedAt < CACHE_TTL_MS) {
    return wbCacheEntry.data;
  }

  const codes = Object.keys(WB_INDICATORS);
  const results = await Promise.allSettled(codes.map(fetchWorldBankIndicator));

  const indicators: IndicatorResult[] = codes.map((code, i) => {
    const result = results[i];
    const entries: WBRawEntry[] = result.status === "fulfilled" ? result.value : [];
    const withData = entries.filter(e => e.value !== null).sort((a, b) => Number(b.date) - Number(a.date));
    const latest = withData[0] || null;
    const trend = withData
      .slice(0, 6)
      .reverse()
      .map(e => ({ year: e.date, value: e.value as number }));

    return {
      code,
      name: WB_INDICATORS[code],
      latestValue: latest ? latest.value : null,
      latestYear: latest ? latest.date : null,
      unit: unitForIndicator(code),
      trend,
    };
  });

  const response: WorldBankResponse = {
    indicators,
    fetchedAt: new Date().toISOString(),
  };

  wbCacheEntry = { data: response, fetchedAt: now };
  return response;
}

// ─── Attendance simulation helpers ─────────────────────────────────────────────
const STATES = ["Kano", "Kaduna", "Lagos", "Oyo", "Anambra", "Enugu", "Edo", "Rivers", "Bauchi", "Borno", "Plateau", "Kwara"];
const BASE_RATES: Record<string, number> = {
  Kano: 71.2, Kaduna: 73.5, Lagos: 83.1, Oyo: 79.4, Anambra: 85.3, Enugu: 84.1,
  Edo: 81.9, Rivers: 82.5, Bauchi: 68.4, Borno: 64.8, Plateau: 76.3, Kwara: 78.9,
};
const BASE_STUDENT_COUNT = 23000;

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getAttendanceData(windowSecs: number) {
  const now = new Date();
  // deterministic per 30-second window
  const window30 = Math.floor(Date.now() / 30000);
  const dayOfWeek = now.getDay(); // 0=Sun,1=Mon,...,5=Fri,6=Sat
  // Monday penalty, mid-week boost
  const dayMultiplier = dayOfWeek === 1 ? -3.5 : dayOfWeek === 3 || dayOfWeek === 2 ? 2.1 : 0;

  const stateData = STATES.map((state, si) => {
    const base = BASE_RATES[state];
    const seed = window30 * 100 + si;
    const jitter = (seededRandom(seed) - 0.5) * 4.5; // ±2.25%
    const rate = Math.min(96, Math.max(55, base + dayMultiplier + jitter));
    return { state, rate: parseFloat(rate.toFixed(1)) };
  });

  const avgRate = stateData.reduce((sum, s) => sum + s.rate, 0) / stateData.length;
  const studentsPresent = Math.round(BASE_STUDENT_COUNT * (avgRate / 100) + seededRandom(window30) * 400 - 200);

  return {
    timestamp: now.toISOString(),
    lastUpdated: new Date().toISOString(),
    windowKey: window30,
    avgAttendanceRate: parseFloat(avgRate.toFixed(1)),
    studentsPresent,
    studentBaselineEdoBest: 81.9,
    teacherBaselineEdoBest: 78.4,
    dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek],
    byState: stateData,
  };
}

// ─── Visit simulation helpers ───────────────────────────────────────────────
const SCHOOLS = [
  "Government Primary School Badawa", "LEA Primary School Wuse",
  "Government Primary School Rigasa", "Central Primary School Kano",
  "Municipal Primary School Dorayi", "Government Primary School Zaria",
  "LEA Primary School Kawo", "Government Primary School Ungwan Boro",
  "Primary School Birnin Kebbi", "Government Primary School Daura",
  "Government Primary School Dutse", "Central Primary School Hadejia",
  "LEA Primary School Ringim", "Primary School Kazaure",
  "Government School Yankwashi", "LEA School Rano", "Primary School Gabasawa",
];
const LGAS = ["Kano Municipal", "Fagge", "Gwale", "Rigasa", "Zaria", "Tudun Wada", "Dutse", "Hadejia", "Ringim", "Kazaure"];
const SSO_NAMES = [
  "Aisha Musa", "Ibrahim Sule", "Fatima Yusuf", "Ahmed Bello", "Maryam Garba",
  "Usman Danjuma", "Hadiza Aliyu", "Muhammed Lawal", "Zainab Kwari", "Kabiru Isa",
];
const GPS_COORDS: [number, number][] = [
  [12.0022, 8.5920], [12.0523, 8.6234], [11.9987, 8.5512], [12.1032, 8.6012],
  [11.9754, 8.5234], [11.1234, 7.7120], [11.8872, 8.9012], [12.0345, 8.4501],
  [12.2000, 9.3201], [11.8532, 8.7654], [11.6123, 9.3456], [12.4523, 9.8120],
];

interface VisitEntry {
  id: number;
  timestamp: string;
  schoolName: string;
  lga: string;
  state: string;
  ssoName: string;
  gpsLat: number;
  gpsLng: number;
  activity: string;
}

function getVisitsData() {
  const now = new Date();
  const hourWAT = (now.getUTCHours() + 1) % 24; // WAT = UTC+1
  const isWorkingHours = hourWAT >= 8 && hourWAT <= 16;

  // Deterministic per 30-second window
  const window30 = Math.floor(Date.now() / 30000);
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
  const monthBase = 38 + dayOfYear * 2;
  const visitsTodaySeed = window30 * 7;

  // Visits today increment realistically during working hours
  const todayCount = isWorkingHours
    ? Math.min(85, Math.max(5, monthBase % 47 + Math.floor(visitsTodaySeed % 12)))
    : Math.floor(visitsTodaySeed % 8) + 2;

  const monthTotal = 847 + (dayOfYear % 15) * 8 + Math.floor(seededRandom(window30 * 3) * 5);

  // Generate recent visit log (last 10)
  const activities = ["Lesson Observation", "Coaching Session", "HT Interview", "Enrollment Check", "Infrastructure Audit"];
  const stateList = ["Kano", "Kaduna", "Lagos", "Oyo", "Anambra", "Enugu", "Edo", "Rivers", "Bauchi", "Borno", "Plateau", "Kwara"];

  const recentVisits: VisitEntry[] = Array.from({ length: 10 }, (_, i) => {
    const seed = window30 - i;
    const school = SCHOOLS[Math.floor(seededRandom(seed * 11) * SCHOOLS.length)];
    const lga = LGAS[Math.floor(seededRandom(seed * 13) * LGAS.length)];
    const state = stateList[Math.floor(seededRandom(seed * 17) * stateList.length)];
    const sso = SSO_NAMES[Math.floor(seededRandom(seed * 19) * SSO_NAMES.length)];
    const coords = GPS_COORDS[Math.floor(seededRandom(seed * 23) * GPS_COORDS.length)];
    const activity = activities[Math.floor(seededRandom(seed * 29) * activities.length)];
    const minsAgo = i * Math.floor(seededRandom(seed * 31) * 18 + 5);
    const ts = new Date(now.getTime() - minsAgo * 60000);

    return {
      id: seed,
      timestamp: ts.toISOString(),
      schoolName: school,
      lga,
      state,
      ssoName: sso,
      gpsLat: coords[0] + (seededRandom(seed * 37) - 0.5) * 0.05,
      gpsLng: coords[1] + (seededRandom(seed * 41) - 0.5) * 0.05,
      activity,
    };
  });

  return {
    timestamp: now.toISOString(),
    isWorkingHours,
    visitsTodayCount: todayCount,
    monthTotal,
    recentVisits,
    nextVisitExpectedInSecs: isWorkingHours ? Math.floor(seededRandom(window30 * 53) * 40 + 15) : null,
  };
}

// ─── Status helpers ─────────────────────────────────────────────────────────
async function checkWorldBankReachable(): Promise<boolean> {
  try {
    const res = await fetch("https://api.worldbank.org/v2/country/NGA?format=json&per_page=1", {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Route registration ──────────────────────────────────────────────────────
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // GET /api/live/worldbank
  app.get("/api/live/worldbank", async (_req, res) => {
    try {
      const data = await fetchAllWorldBankData();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch World Bank data" });
    }
  });

  // GET /api/live/attendance
  app.get("/api/live/attendance", (_req, res) => {
    try {
      const data = getAttendanceData(30);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/live/visits
  app.get("/api/live/visits", (_req, res) => {
    try {
      const data = getVisitsData();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/live/status
  app.get("/api/live/status", async (_req, res) => {
    try {
      const wbReachable = await checkWorldBankReachable();
      const now = new Date().toISOString();
      res.json({
        timestamp: now,
        sources: [
          {
            name: "World Bank API",
            type: "API",
            status: wbReachable ? "active" : "degraded",
            statusLabel: wbReachable ? "Active" : "Degraded",
            lastUpdated: wbCacheEntry ? wbCacheEntry.data.fetchedAt : null,
            dataPoints: 6,
            url: "https://api.worldbank.org/v2",
            description: "Education indicators for Nigeria",
          },
          {
            name: "UNESCO UIS",
            type: "API",
            status: "available",
            statusLabel: "Available",
            lastUpdated: "2024-01-01T00:00:00Z",
            dataPoints: 120,
            url: "https://uis.unesco.org/",
            description: "Global education statistics",
          },
          {
            name: "UBEC NPA 2022/23",
            type: "Cached",
            status: "cached",
            statusLabel: "Cached",
            lastUpdated: "2023-12-01T00:00:00Z",
            dataPoints: 3400,
            url: "https://ubec.gov.ng/",
            description: "Nigeria Basic Education Annual Report",
          },
          {
            name: "EdoBEST Programme",
            type: "Simulated",
            status: "active",
            statusLabel: "Active",
            lastUpdated: now,
            dataPoints: 890,
            url: "https://edobest.ng/",
            description: "Edo State school attendance feed",
          },
          {
            name: "PLANE Dashboard",
            type: "Simulated",
            status: "active",
            statusLabel: "Active",
            lastUpdated: now,
            dataPoints: 1522,
            url: "https://plane.gov.ng/",
            description: "SSO visit GPS tracking",
          },
          {
            name: "DHIS2 / EdoEMIS",
            type: "Cached",
            status: "cached",
            statusLabel: "Cached",
            lastUpdated: "2024-03-01T00:00:00Z",
            dataPoints: 2100,
            url: "https://dhis2.org/",
            description: "District health & education info system",
          },
          {
            name: "NBS Nigeria",
            type: "Cached",
            status: "cached",
            statusLabel: "Cached",
            lastUpdated: "2024-01-15T00:00:00Z",
            dataPoints: 450,
            url: "https://nigerianstat.gov.ng/",
            description: "National Bureau of Statistics education data",
          },
        ],
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}
