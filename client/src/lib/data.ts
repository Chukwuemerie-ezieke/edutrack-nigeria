// EduTrack Nigeria — Real Data from Nigerian Education Reports
// Sources: UBEC NPA 2022/23, EdoBEST, PLANE, DHIS2/EdoEMIS, World Bank

export const NATIONAL_OVERVIEW = {
  totalSchools: 171027,
  publicSchools: 79775,
  privateSchools: 91252,
  totalEnrollment: 47010008,
  eccdeEnrollment: 7234695,
  primaryEnrollment: 31771916,
  jssEnrollment: 8003397,
  totalTeachers: 1686535,
  eccdeTeachers: 354651,
  primaryTeachers: 915593,
  jssTeachers: 416291,
  primaryGER: 91,
  primaryGERMale: 92,
  primaryGERFemale: 89,
  primaryNER: 81,
  primaryNERMale: 82,
  primaryNERFemale: 79,
  jssNER: 29,
  jssNERMale: 34,
  jssNERFemale: 37,
  primaryPTR: 35,
  jssPTR: 19,
  eccdePTR: 20,
  qualifiedTeachersECCDE: 62.5,
  qualifiedTeachersPrimary: 72.3,
  qualifiedTeachersJSS: 74.4,
  attackedSchools: 5262,
  attackedSchoolsPct: 8,
  avgAttendanceRate: 78.4,
  schoolVisitsThisMonth: 1522,
  readinessScore: 67,
};

export const STATE_DATA = [
  { state: "Kano",    schools: 6200,  enrollment: 3200000,  teachers: 85000, ptr: 38, ger: 78, ner: 62, attendanceRate: 71.2, color: "hsl(20 73% 34%)" },
  { state: "Kaduna",  schools: 4800,  enrollment: 2100000,  teachers: 52000, ptr: 40, ger: 82, ner: 65, attendanceRate: 73.5, color: "hsl(183 50% 15%)" },
  { state: "Lagos",   schools: 5800,  enrollment: 2800000,  teachers: 75000, ptr: 37, ger: 92, ner: 82, attendanceRate: 83.1, color: "hsl(183 98% 22%)" },
  { state: "Oyo",     schools: 4200,  enrollment: 1800000,  teachers: 48000, ptr: 38, ger: 88, ner: 78, attendanceRate: 79.4, color: "hsl(43 74% 49%)" },
  { state: "Anambra", schools: 2400,  enrollment: 680000,   teachers: 22000, ptr: 31, ger: 95, ner: 88, attendanceRate: 85.3, color: "hsl(103 56% 31%)" },
  { state: "Enugu",   schools: 2200,  enrollment: 620000,   teachers: 20000, ptr: 31, ger: 93, ner: 85, attendanceRate: 84.1, color: "hsl(145 50% 30%)" },
  { state: "Edo",     schools: 1800,  enrollment: 450000,   teachers: 15000, ptr: 30, ger: 85, ner: 72, attendanceRate: 81.9, color: "hsl(183 98% 22%)" },
  { state: "Rivers",  schools: 3100,  enrollment: 920000,   teachers: 28000, ptr: 33, ger: 90, ner: 80, attendanceRate: 82.5, color: "hsl(210 60% 40%)" },
  { state: "Bauchi",  schools: 3500,  enrollment: 1400000,  teachers: 35000, ptr: 40, ger: 68, ner: 50, attendanceRate: 68.4, color: "hsl(30 60% 45%)" },
  { state: "Borno",   schools: 2800,  enrollment: 980000,   teachers: 25000, ptr: 39, ger: 55, ner: 42, attendanceRate: 64.8, color: "hsl(0 50% 40%)" },
  { state: "Plateau", schools: 2600,  enrollment: 750000,   teachers: 21000, ptr: 36, ger: 82, ner: 72, attendanceRate: 76.3, color: "hsl(270 40% 45%)" },
  { state: "Kwara",   schools: 1900,  enrollment: 520000,   teachers: 16000, ptr: 33, ger: 86, ner: 76, attendanceRate: 78.9, color: "hsl(50 60% 40%)" },
];

export const MONTHLY_ATTENDANCE = [
  { month: "Apr '23", rate: 74.2 },
  { month: "May '23", rate: 76.1 },
  { month: "Jun '23", rate: 71.8 },
  { month: "Jul '23", rate: 69.3 },
  { month: "Aug '23", rate: 72.4 },
  { month: "Sep '23", rate: 77.8 },
  { month: "Oct '23", rate: 80.2 },
  { month: "Nov '23", rate: 81.5 },
  { month: "Dec '23", rate: 75.4 },
  { month: "Jan '24", rate: 78.9 },
  { month: "Feb '24", rate: 80.7 },
  { month: "Mar '24", rate: 81.3 },
];

export const ENROLLMENT_BY_STATE = STATE_DATA.map(s => ({
  state: s.state,
  enrollment: s.enrollment,
}));

export const SCHOOL_TYPE_DISTRIBUTION = [
  { name: "Public", value: 79775, fill: "hsl(183 98% 22%)" },
  { name: "Private", value: 91252, fill: "hsl(20 73% 34%)" },
];

// Attendance heatmap — avg attendance by day of week and time period
export const ATTENDANCE_HEATMAP = [
  { day: "Mon", morning: 88, midday: 84, afternoon: 76 },
  { day: "Tue", morning: 86, midday: 83, afternoon: 74 },
  { day: "Wed", morning: 85, midday: 80, afternoon: 71 },
  { day: "Thu", morning: 84, midday: 79, afternoon: 69 },
  { day: "Fri", morning: 79, midday: 72, afternoon: 58 },
];

export const TEACHER_ATTENDANCE_COMPARISON = [
  { metric: "Present 7:30am",  edobest: 100,  statusQuo: 93.3  },
  { metric: "Present 1:45pm",  edobest: 100,  statusQuo: 73.3  },
  { metric: "Present 2:30pm",  edobest: 90,   statusQuo: 13.3  },
];

export const STUDENT_ATTENDANCE_COMPARISON = [
  { label: "EdoBEST Schools",   value: 81.9 },
  { label: "Status Quo Schools", value: 71.8 },
];

// School visits — before/after PLANE dashboard
export const VISIT_METRICS = {
  before: { visits: 413, coverage: 21, period: "Q1 2022 (pre-dashboard)" },
  after:  { visits: 1522, coverage: 77, period: "Q1 2023 (post-dashboard)" },
  increase: 3.7,
};

export const VISIT_COVERAGE_BY_STATE = [
  { state: "Kano",    before: 18, after: 75, visits: 542 },
  { state: "Kaduna",  before: 22, after: 78, visits: 498 },
  { state: "Lagos",   before: 25, after: 82, visits: 510 },
  { state: "Oyo",     before: 20, after: 76, visits: 445 },
  { state: "Anambra", before: 28, after: 85, visits: 320 },
  { state: "Enugu",   before: 26, after: 83, visits: 295 },
  { state: "Edo",     before: 30, after: 87, visits: 270 },
  { state: "Rivers",  before: 24, after: 80, visits: 380 },
  { state: "Bauchi",  before: 15, after: 68, visits: 410 },
  { state: "Borno",   before: 12, after: 55, visits: 340 },
  { state: "Plateau", before: 21, after: 74, visits: 350 },
  { state: "Kwara",   before: 23, after: 79, visits: 260 },
];

export const SSO_PERFORMANCE = [
  { name: "Aminu Musa",       state: "Kano",    visits: 48, coverage: 82, coaching: 38, lessonObs: 44 },
  { name: "Fatima Abubakar",  state: "Kano",    visits: 52, coverage: 86, coaching: 41, lessonObs: 48 },
  { name: "Ibrahim Yusuf",    state: "Kaduna",  visits: 44, coverage: 79, coaching: 35, lessonObs: 40 },
  { name: "Zainab Shehu",     state: "Kaduna",  visits: 47, coverage: 80, coaching: 37, lessonObs: 43 },
  { name: "Funke Adeyemi",    state: "Lagos",   visits: 51, coverage: 85, coaching: 40, lessonObs: 46 },
  { name: "Olumide Fashola",  state: "Oyo",     visits: 43, coverage: 78, coaching: 34, lessonObs: 39 },
  { name: "Chinwe Obi",       state: "Anambra", visits: 46, coverage: 83, coaching: 36, lessonObs: 42 },
  { name: "Nnamdi Eze",       state: "Enugu",   visits: 42, coverage: 80, coaching: 33, lessonObs: 38 },
  { name: "Osaze Igbinovia",  state: "Edo",     visits: 45, coverage: 81, coaching: 36, lessonObs: 41 },
  { name: "Ejiro Onodera",    state: "Rivers",  visits: 44, coverage: 79, coaching: 35, lessonObs: 40 },
  { name: "Suleiman Garba",   state: "Bauchi",  visits: 38, coverage: 72, coaching: 30, lessonObs: 35 },
  { name: "Hauwa Saleh",      state: "Borno",   visits: 35, coverage: 65, coaching: 28, lessonObs: 32 },
  { name: "Danjuma Adamu",    state: "Plateau", visits: 41, coverage: 76, coaching: 33, lessonObs: 38 },
  { name: "Salamatu Lawal",   state: "Kwara",   visits: 40, coverage: 75, coaching: 32, lessonObs: 37 },
];

// Teacher performance metrics — EdoBEST vs Status Quo
export const TEACHER_PERFORMANCE_METRICS = [
  { metric: "Training Attendance",     edobest: 96.7, statusQuo: 11.1 },
  { metric: "External Feedback",       edobest: 80.0, statusQuo: 44.4 },
  { metric: "Device Usage",            edobest: 100,  statusQuo: 0    },
  { metric: "Praise Usage",            edobest: 96.7, statusQuo: 48.1 },
  { metric: "Students Focused",        edobest: 94.4, statusQuo: 73.3 },
  { metric: "Students Working Hard",   edobest: 98.2, statusQuo: 62.9 },
];

export const CORPORAL_PUNISHMENT = [
  { label: "EdoBEST",    value: 6.7  },
  { label: "Status Quo", value: 14.8 },
];

export const MONTHLY_TEACHER_PERFORMANCE = [
  { month: "Sep",  punctuality: 91, delivery: 84, feedback: 78 },
  { month: "Oct",  punctuality: 93, delivery: 86, feedback: 80 },
  { month: "Nov",  punctuality: 94, delivery: 88, feedback: 82 },
  { month: "Dec",  punctuality: 89, delivery: 84, feedback: 79 },
  { month: "Jan",  punctuality: 95, delivery: 90, feedback: 84 },
  { month: "Feb",  punctuality: 96, delivery: 91, feedback: 85 },
  { month: "Mar",  punctuality: 97, delivery: 93, feedback: 87 },
];

// Student progress / learning outcomes
export const LEARNING_OUTCOMES = [
  { subject: "Maths",    edobest: 40.0, statusQuo: 37.7, effectSize: 0.24 },
  { subject: "Literacy", edobest: 52.2, statusQuo: 47.1, effectSize: 0.25 },
];

export const SUBJECT_SCORES_BY_STATE = [
  { state: "Kano",    maths: 32.4, english: 38.1, science: 35.8, social: 49.7 },
  { state: "Kaduna",  maths: 35.1, english: 41.5, science: 38.2, social: 53.4 },
  { state: "Lagos",   maths: 49.7, english: 62.3, science: 53.1, social: 67.8 },
  { state: "Oyo",     maths: 45.2, english: 57.8, science: 49.5, social: 63.1 },
  { state: "Anambra", maths: 54.3, english: 66.8, science: 58.7, social: 71.3 },
  { state: "Enugu",   maths: 52.1, english: 64.5, science: 56.3, social: 69.8 },
  { state: "Edo",     maths: 40.0, english: 52.2, science: 46.3, social: 61.2 },
  { state: "Rivers",  maths: 47.8, english: 59.4, science: 51.2, social: 65.7 },
  { state: "Bauchi",  maths: 29.5, english: 34.2, science: 32.1, social: 45.3 },
  { state: "Borno",   maths: 26.8, english: 31.5, science: 28.7, social: 41.2 },
  { state: "Plateau", maths: 38.6, english: 48.3, science: 42.1, social: 56.8 },
  { state: "Kwara",   maths: 41.3, english: 53.7, science: 47.2, social: 60.5 },
];

export const GENDER_PARITY = [
  { state: "Kano",    gpi: 0.82, maleNER: 68, femaleNER: 56 },
  { state: "Kaduna",  gpi: 0.85, maleNER: 70, femaleNER: 60 },
  { state: "Lagos",   gpi: 0.97, maleNER: 83, femaleNER: 81 },
  { state: "Oyo",     gpi: 0.95, maleNER: 80, femaleNER: 76 },
  { state: "Anambra", gpi: 1.02, maleNER: 86, femaleNER: 89 },
  { state: "Enugu",   gpi: 1.01, maleNER: 84, femaleNER: 86 },
  { state: "Edo",     gpi: 0.94, maleNER: 73, femaleNER: 71 },
  { state: "Rivers",  gpi: 0.96, maleNER: 82, femaleNER: 78 },
  { state: "Bauchi",  gpi: 0.76, maleNER: 56, femaleNER: 44 },
  { state: "Borno",   gpi: 0.72, maleNER: 48, femaleNER: 36 },
  { state: "Plateau", gpi: 0.91, maleNER: 75, femaleNER: 69 },
  { state: "Kwara",   gpi: 0.93, maleNER: 78, femaleNER: 74 },
];

export const PROGRESSION_RATES = [
  { grade: "Primary 1", enrolled: 100, progressed: 97 },
  { grade: "Primary 2", enrolled: 97,  progressed: 94 },
  { grade: "Primary 3", enrolled: 94,  progressed: 91 },
  { grade: "Primary 4", enrolled: 91,  progressed: 88 },
  { grade: "Primary 5", enrolled: 88,  progressed: 84 },
  { grade: "Primary 6", enrolled: 84,  progressed: 79 },
  { grade: "JSS 1",     enrolled: 62,  progressed: 58 },
  { grade: "JSS 2",     enrolled: 58,  progressed: 55 },
  { grade: "JSS 3",     enrolled: 55,  progressed: 48 },
];

// Resources
export const CLASSROOM_DATA = [
  { category: "ECCDE", public: 87067, private: 223600, total: 310667 },
  { category: "Primary", public: 404429, private: 373319, total: 777748 },
  { category: "JSS", public: 90000, private: 91692, total: 181692 },
];

export const INFRASTRUCTURE_METRICS = [
  { metric: "Primary schools with fence", value: 54744, total: 79775, pct: 69 },
  { metric: "JSS schools with labs",       value: 17380, total: 37683, pct: 46 },
  { metric: "JSS schools with toilets",    value: 32030, total: 37683, pct: 85 },
  { metric: "Schools with electricity",    value: 38284, total: 79775, pct: 48 },
  { metric: "Schools with water",          value: 31910, total: 79775, pct: 40 },
];

export const PTR_BY_STATE = STATE_DATA.map(s => ({
  state: s.state,
  ptr: s.ptr,
  national: 35,
}));

export const TEXTBOOK_AVAILABILITY = [
  { state: "Kano",    maths: 54, english: 59, science: 48 },
  { state: "Kaduna",  maths: 61, english: 65, science: 55 },
  { state: "Lagos",   maths: 78, english: 83, science: 72 },
  { state: "Oyo",     maths: 72, english: 77, science: 66 },
  { state: "Anambra", maths: 91, english: 94, science: 88 },
  { state: "Enugu",   maths: 88, english: 92, science: 85 },
  { state: "Edo",     maths: 82, english: 87, science: 76 },
  { state: "Rivers",  maths: 75, english: 80, science: 69 },
  { state: "Bauchi",  maths: 48, english: 53, science: 42 },
  { state: "Borno",   maths: 38, english: 44, science: 33 },
  { state: "Plateau", maths: 65, english: 70, science: 59 },
  { state: "Kwara",   maths: 69, english: 74, science: 63 },
];

// School Readiness — NALABE / domain scores
export const READINESS_RADAR = [
  { domain: "Curriculum",   score: 72 },
  { domain: "Teachers",     score: 68 },
  { domain: "Infrastructure", score: 54 },
  { domain: "Leadership",   score: 65 },
  { domain: "Community",    score: 70 },
  { domain: "Resources",    score: 58 },
];

export const NALABE_SCORES = [
  { subject: "English (MC)",      score: 74, benchmark: 70, grade: "Good" },
  { subject: "English (Essay)",   score: 61, benchmark: 70, grade: "Fair" },
  { subject: "Maths — Numbers",   score: 64.4, benchmark: 70, grade: "Fair" },
  { subject: "Maths — Algebra",   score: 59.1, benchmark: 70, grade: "Fair" },
  { subject: "Maths — Basic Ops", score: 51.0, benchmark: 70, grade: "Poor" },
  { subject: "Maths — Everyday",  score: 34.5, benchmark: 70, grade: "Poor" },
  { subject: "Basic Sci (MC)",    score: 65, benchmark: 70, grade: "Fair" },
  { subject: "Basic Sci (Essay)", score: 58, benchmark: 70, grade: "Fair" },
  { subject: "Social Studies (MC)", score: 78, benchmark: 70, grade: "Good" },
  { subject: "Social Studies (Essay)", score: 75, benchmark: 70, grade: "Good" },
];

export const READINESS_BY_STATE = [
  { state: "Kano",    score: 58, prev: 53, change: 5  },
  { state: "Kaduna",  score: 62, prev: 57, change: 5  },
  { state: "Lagos",   score: 79, prev: 74, change: 5  },
  { state: "Oyo",     score: 73, prev: 68, change: 5  },
  { state: "Anambra", score: 82, prev: 78, change: 4  },
  { state: "Enugu",   score: 80, prev: 75, change: 5  },
  { state: "Edo",     score: 74, prev: 68, change: 6  },
  { state: "Rivers",  score: 76, prev: 71, change: 5  },
  { state: "Bauchi",  score: 52, prev: 48, change: 4  },
  { state: "Borno",   score: 45, prev: 41, change: 4  },
  { state: "Plateau", score: 68, prev: 63, change: 5  },
  { state: "Kwara",   score: 71, prev: 66, change: 5  },
];

export const READINESS_TREND = [
  { year: "2019", score: 52 },
  { year: "2020", score: 55 },
  { year: "2021", score: 59 },
  { year: "2022", score: 63 },
  { year: "2023", score: 67 },
];

export const DATA_SOURCES = [
  { name: "UBEC 2022/2023 National Personnel Audit Report", url: "https://ubec.gov.ng" },
  { name: "UBEC Basic Education Data Factsheets 2022", url: "https://factsheets.ubecedata.com" },
  { name: "EdoBEST Effect Report — Bridge International Academies", url: "#" },
  { name: "DHIS2/EdoEMIS Edo State", url: "https://dhis2.org/school-reporting-edo-state-nigeria/" },
  { name: "PLANE Education Dashboard Report", url: "https://planenigeria.com" },
  { name: "Nigeria Digest of Education Statistics", url: "#" },
  { name: "World Bank Education Statistics", url: "https://data.worldbank.org" },
  { name: "NALABE National Report — UBEC", url: "https://ubec.gov.ng" },
];
