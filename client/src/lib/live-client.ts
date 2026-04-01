/**
 * Client-side live data module.
 * Replaces server API calls so the app works as a static site (GitHub Pages).
 * - World Bank: fetches via allorigins.win CORS proxy, with hardcoded fallback
 * - Attendance & Visits: deterministic simulation (same logic as server)
 * - Status: derived from above
 */

// ─── Seeded random (same as server) ──────────────────────────────────────────
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ─── World Bank ──────────────────────────────────────────────────────────────
const WB_INDICATORS: Record<string, { name: string; unit: string }> = {
  "SE.PRM.ENRR":       { name: "Primary Enrollment Rate (Gross %)", unit: "%" },
  "SE.SEC.ENRR":       { name: "Secondary Enrollment Rate (Gross %)", unit: "%" },
  "SE.PRM.UNER":       { name: "Out-of-School Children (Primary)", unit: "children" },
  "SE.XPD.TOTL.GD.ZS": { name: "Gov't Expenditure on Education (% GDP)", unit: "% of GDP" },
  "SE.ADT.1524.LT.ZS": { name: "Youth Literacy Rate (15–24)", unit: "%" },
  "SE.PRM.TCAQ.ZS":    { name: "Trained Teachers – Primary (%)", unit: "%" },
};

// Hardcoded fallback from real World Bank data (confirmed March 2026)
const WB_FALLBACK: Record<string, { year: string; value: number }[]> = {
  "SE.PRM.ENRR":       [{ year: "2015", value: 25.57 }, { year: "2016", value: 78.88 }, { year: "2018", value: 81.63 }, { year: "2020", value: 84.37 }, { year: "2021", value: 83.81 }, { year: "2023", value: 89.59 }],
  "SE.SEC.ENRR":       [{ year: "2018", value: 40.49 }, { year: "2020", value: 44.12 }, { year: "2021", value: 45.44 }, { year: "2023", value: 46.89 }],
  "SE.PRM.UNER":       [{ year: "2023", value: 9070702 }],
  "SE.XPD.TOTL.GD.ZS": [{ year: "2018", value: 0.42 }, { year: "2019", value: 0.36 }, { year: "2020", value: 0.36 }, { year: "2021", value: 0.38 }, { year: "2022", value: 0.35 }, { year: "2023", value: 0.32 }],
  "SE.ADT.1524.LT.ZS": [{ year: "2016", value: 72.96 }, { year: "2021", value: 73.67 }, { year: "2024", value: 81.36 }],
  "SE.PRM.TCAQ.ZS":    [{ year: "2018", value: 62.18 }],
};

interface IndicatorResult {
  code: string;
  name: string;
  latestValue: number | null;
  latestYear: string | null;
  unit: string;
  trend: { year: string; value: number }[];
}

export interface WorldBankResponse {
  indicators: IndicatorResult[];
  fetchedAt: string;
  source: "live" | "cached";
}

let wbCache: { data: WorldBankResponse; ts: number } | null = null;
const WB_CACHE_TTL = 5 * 60 * 1000;

async function fetchWBIndicator(code: string): Promise<{ year: string; value: number }[]> {
  const apiUrl = `https://api.worldbank.org/v2/country/NGA/indicator/${code}?format=json&date=2015:2024&per_page=20`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json) || json.length < 2 || !json[1]) return [];
  return (json[1] as { date: string; value: number | null }[])
    .filter(e => e.value !== null)
    .sort((a, b) => Number(b.date) - Number(a.date))
    .map(e => ({ year: e.date, value: e.value as number }));
}

export async function fetchWorldBank(): Promise<WorldBankResponse> {
  const now = Date.now();
  if (wbCache && now - wbCache.ts < WB_CACHE_TTL) return wbCache.data;

  const codes = Object.keys(WB_INDICATORS);
  let source: "live" | "cached" = "live";

  const results = await Promise.allSettled(codes.map(fetchWBIndicator));

  const indicators: IndicatorResult[] = codes.map((code, i) => {
    const result = results[i];
    let trend: { year: string; value: number }[];

    if (result.status === "fulfilled" && result.value.length > 0) {
      trend = result.value.slice(0, 6).reverse();
    } else {
      trend = WB_FALLBACK[code] || [];
      source = "cached";
    }

    const latest = trend.length > 0 ? trend[trend.length - 1] : null;

    return {
      code,
      name: WB_INDICATORS[code].name,
      latestValue: latest ? latest.value : null,
      latestYear: latest ? latest.year : null,
      unit: WB_INDICATORS[code].unit,
      trend,
    };
  });

  const response: WorldBankResponse = { indicators, fetchedAt: new Date().toISOString(), source };
  wbCache = { data: response, ts: now };
  return response;
}

// ─── Attendance simulation (identical to server) ─────────────────────────────
const STATES = ["Kano", "Kaduna", "Lagos", "Oyo", "Anambra", "Enugu", "Edo", "Rivers", "Bauchi", "Borno", "Plateau", "Kwara"];
const BASE_RATES: Record<string, number> = {
  Kano: 71.2, Kaduna: 73.5, Lagos: 83.1, Oyo: 79.4, Anambra: 85.3, Enugu: 84.1,
  Edo: 81.9, Rivers: 82.5, Bauchi: 68.4, Borno: 64.8, Plateau: 76.3, Kwara: 78.9,
};
const BASE_STUDENT_COUNT = 23000;

export interface AttendanceResponse {
  timestamp: string;
  lastUpdated: string;
  windowKey: number;
  avgAttendanceRate: number;
  studentsPresent: number;
  studentBaselineEdoBest: number;
  teacherBaselineEdoBest: number;
  dayOfWeek: string;
  byState: { state: string; rate: number }[];
}

export function getAttendance(): AttendanceResponse {
  const now = new Date();
  const window30 = Math.floor(Date.now() / 30000);
  const dayOfWeek = now.getDay();
  const dayMultiplier = dayOfWeek === 1 ? -3.5 : dayOfWeek === 3 || dayOfWeek === 2 ? 2.1 : 0;

  const stateData = STATES.map((state, si) => {
    const base = BASE_RATES[state];
    const seed = window30 * 100 + si;
    const jitter = (seededRandom(seed) - 0.5) * 4.5;
    const rate = Math.min(96, Math.max(55, base + dayMultiplier + jitter));
    return { state, rate: parseFloat(rate.toFixed(1)) };
  });

  const avgRate = stateData.reduce((sum, s) => sum + s.rate, 0) / stateData.length;
  const studentsPresent = Math.round(BASE_STUDENT_COUNT * (avgRate / 100) + seededRandom(window30) * 400 - 200);

  return {
    timestamp: now.toISOString(),
    lastUpdated: now.toISOString(),
    windowKey: window30,
    avgAttendanceRate: parseFloat(avgRate.toFixed(1)),
    studentsPresent,
    studentBaselineEdoBest: 81.9,
    teacherBaselineEdoBest: 78.4,
    dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek],
    byState: stateData,
  };
}

// ─── Visits simulation (identical to server) ─────────────────────────────────
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

export interface VisitEntry {
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

export interface VisitsResponse {
  timestamp: string;
  isWorkingHours: boolean;
  visitsTodayCount: number;
  monthTotal: number;
  recentVisits: VisitEntry[];
  nextVisitExpectedInSecs: number | null;
}

export function getVisits(): VisitsResponse {
  const now = new Date();
  const hourWAT = (now.getUTCHours() + 1) % 24;
  const isWorkingHours = hourWAT >= 8 && hourWAT <= 16;
  const window30 = Math.floor(Date.now() / 30000);
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
  const monthBase = 38 + dayOfYear * 2;
  const visitsTodaySeed = window30 * 7;
  const todayCount = isWorkingHours
    ? Math.min(85, Math.max(5, monthBase % 47 + Math.floor(visitsTodaySeed % 12)))
    : Math.floor(visitsTodaySeed % 8) + 2;
  const monthTotal = 847 + (dayOfYear % 15) * 8 + Math.floor(seededRandom(window30 * 3) * 5);
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

// ─── Status ──────────────────────────────────────────────────────────────────
export interface StatusResponse {
  timestamp: string;
  sources: {
    name: string; type: string; status: string; statusLabel: string;
    lastUpdated: string | null; dataPoints: number; url: string; description: string;
  }[];
}

export function getStatus(wbFetchedAt?: string): StatusResponse {
  const now = new Date().toISOString();
  return {
    timestamp: now,
    sources: [
      { name: "World Bank API", type: "API", status: "active", statusLabel: "Active", lastUpdated: wbFetchedAt || now, dataPoints: 6, url: "https://api.worldbank.org/v2", description: "Education indicators for Nigeria" },
      { name: "UNESCO UIS", type: "API", status: "available", statusLabel: "Available", lastUpdated: "2024-01-01T00:00:00Z", dataPoints: 120, url: "https://uis.unesco.org/", description: "Global education statistics" },
      { name: "UBEC NPA 2022/23", type: "Cached", status: "cached", statusLabel: "Cached", lastUpdated: "2023-12-01T00:00:00Z", dataPoints: 3400, url: "https://ubec.gov.ng/", description: "Nigeria Basic Education Annual Report" },
      { name: "EdoBEST Programme", type: "Simulated", status: "active", statusLabel: "Active", lastUpdated: now, dataPoints: 890, url: "https://edobest.ng/", description: "Edo State school attendance feed" },
      { name: "PLANE Dashboard", type: "Simulated", status: "active", statusLabel: "Active", lastUpdated: now, dataPoints: 1522, url: "https://plane.gov.ng/", description: "SSO visit GPS tracking" },
      { name: "DHIS2 / EdoEMIS", type: "Cached", status: "cached", statusLabel: "Cached", lastUpdated: "2024-03-01T00:00:00Z", dataPoints: 2100, url: "https://dhis2.org/", description: "District health & education info system" },
      { name: "NBS Nigeria", type: "Cached", status: "cached", statusLabel: "Cached", lastUpdated: "2024-01-15T00:00:00Z", dataPoints: 450, url: "https://nigerianstat.gov.ng/", description: "National Bureau of Statistics education data" },
    ],
  };
}
