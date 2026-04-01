# School Operational Excellence Dashboard — Build Specification

## Brand & Identity
- Product name: "EduTrack Nigeria" — School Operational Excellence Dashboard
- Brand: Harmony Digital Consults Ltd (#01696F teal brand color)
- Target: State Education Boards (SUBEB), School Administrators, Investors/Partners
- Logo: Hexagonal geometric logo with "ET" letterform, inline SVG

## Color Theme (Education/Government Dashboard — NOT generic)
Light mode HSL values (H S% L% format):
- --background: 195 15% 97%
- --foreground: 195 30% 10%
- --card: 0 0% 100%
- --card-foreground: 195 30% 10%
- --primary: 183 98% 22%  (Harmony Digital Consults teal #01696F)
- --primary-foreground: 0 0% 98%
- --secondary: 195 10% 93%
- --secondary-foreground: 195 30% 10%
- --muted: 195 8% 92%
- --muted-foreground: 195 5% 45%
- --accent: 195 12% 90%
- --accent-foreground: 195 30% 10%
- --destructive: 0 72% 50%
- --destructive-foreground: 0 0% 98%
- --border: 195 8% 88%
- --input: 195 8% 80%
- --ring: 183 98% 22%
- --chart-1: 183 98% 22% (teal)
- --chart-2: 20 73% 34% (terra)
- --chart-3: 183 50% 15% (dark teal)
- --chart-4: 43 74% 49% (gold)
- --chart-5: 103 56% 31% (green)
- --sidebar: 183 30% 12%
- --sidebar-foreground: 0 0% 95%
- --sidebar-primary: 183 60% 45%
- --sidebar-primary-foreground: 0 0% 98%
- --sidebar-accent: 183 20% 18%
- --sidebar-accent-foreground: 0 0% 95%
- --sidebar-border: 183 20% 16%

Dark mode:
- --background: 195 15% 7%
- --foreground: 195 5% 90%
- --card: 195 10% 10%
- --card-foreground: 195 5% 90%
- --primary: 183 45% 47%
- --primary-foreground: 0 0% 98%
- --secondary: 195 8% 16%
- --secondary-foreground: 195 5% 90%
- --muted: 195 5% 18%
- --muted-foreground: 195 5% 60%
- --accent: 195 8% 15%
- --accent-foreground: 195 5% 90%
- --destructive: 0 62% 50%
- --destructive-foreground: 0 0% 98%
- --border: 195 5% 18%
- --input: 195 5% 25%
- --ring: 183 45% 47%
- --chart-1: 183 45% 47%
- --chart-2: 20 53% 48%
- --chart-3: 183 35% 35%
- --chart-4: 43 74% 65%
- --chart-5: 97 43% 47%
- --sidebar: 183 25% 8%
- --sidebar-foreground: 0 0% 92%
- --sidebar-primary: 183 50% 50%
- --sidebar-primary-foreground: 0 0% 98%
- --sidebar-accent: 183 15% 14%
- --sidebar-accent-foreground: 0 0% 92%
- --sidebar-border: 183 15% 12%

## Typography
- Font: General Sans from Fontshare (headings bold, body regular)
- Load: `https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500,600,700&display=swap`
- Set --font-sans: 'General Sans', sans-serif in index.css

## Navigation Structure
Sidebar with these pages:
1. **Overview** (/) — Executive summary with KPI cards and key metrics
2. **Attendance** (/attendance) — Daily attendance tracking for students & teachers
3. **School Visits** (/visits) — GPS-enabled school support visit tracking
4. **Teacher Performance** (/teachers) — Teacher punctuality and performance metrics
5. **Student Progress** (/progress) — Student progression rates by grade level
6. **Resources** (/resources) — Resource allocation efficiency
7. **Readiness** (/readiness) — School readiness assessment scores

## REAL DATA TO USE (sourced from official Nigerian education reports)

### National Overview (UBEC 2022/2023 NPA)
- Total schools in Nigeria: 171,027 (Public: 79,775 | Private: 91,252)
- Total enrollment: 47,010,008 (ECCDE: 7,234,695 | Primary: 31,771,916 | JSS: 8,003,397)
- Total teaching staff: 1,686,535 (ECCDE: 354,651 | Primary: 915,593 | JSS: 416,291)
- Primary GER: 91% (Male: 92%, Female: 89%)
- Primary NER: 81% (Male: 82%, Female: 79%)
- JSS NER: 29% (Male: 34%, Female: 37%)
- Primary PTR: 35:1
- JSS PTR: 19:1
- ECCDE PTR: 20:1
- Qualified teachers: ECCDE 62.5%, Primary 72.3%, JSS 74.4%
- Public primary schools attacked in 3 years: 5,262 (8%)
- Primary intake (public): 4,384,153 | (private): 1,839,931

### 6 Focus States Data (use realistic data modeled on these real sources)

State-level data for: Edo, Kano, Kaduna, Jigawa, Anambra, Lagos

| State | Schools | Enrollment | Teachers | PTR | GER | NER |
|-------|---------|-----------|----------|-----|-----|-----|
| Edo | 1,111+ | 31,500+ (pilot) / ~450,000 total | 15,000+ | 25-28:1 | 85% | 72% |
| Kano | 6,200+ | ~3,200,000 | ~85,000 | 38:1 | 78% | 62% |
| Kaduna | 4,800+ | ~2,100,000 | ~52,000 | 40:1 | 82% | 65% |
| Jigawa | 2,900+ | ~1,100,000 | ~28,000 | 39:1 | 65% | 48% |
| Anambra | 2,400+ | ~680,000 | ~22,000 | 31:1 | 95% | 88% |
| Lagos | 5,800+ | ~2,800,000 | ~75,000 | 37:1 | 92% | 82% |

### Attendance Data (from EdoBEST & DHIS2/EdoEMIS)
EdoBEST P3 Teacher Attendance:
- Present morning: EdoBEST 100% vs Status Quo 93.3%
- Present 1:45pm: EdoBEST 100% vs Status Quo 73.3%
- Present 2:30pm: EdoBEST 90% vs Status Quo 13.3%
- Student attendance: EdoBEST 81.9% vs Status Quo 71.8%
- Statewide absenteeism: 6.9 days (44%) of school missed monthly

EdoEMIS (DHIS2):
- 17,000+ students tracked daily across 51 pilot schools
- 350+ teachers tracked
- Reporting timeline: from several weeks to daily updates
- 2-5 minutes input time per day

### School Support Visits (PLANE Dashboard - Kano, Kaduna, Jigawa)
- Before dashboard: 413 visits (21% coverage) in 3 months
- After dashboard: 1,522 visits (77% coverage) in 3 months
- Increase: 3.7x (tripled+)
- Features: GPS tracking, SSO-teacher assignment, visit progress, enrollment monitoring
- Dashboard monitors lesson observations, coaching sessions, head teacher interviews

### Teacher Performance (EdoBEST Data)
- Training attendance: EdoBEST 96.7% vs Status Quo 11.1%
- External feedback received: EdoBEST 80% vs Status Quo 44.4%
- Electronic device usage: EdoBEST 100% vs Status Quo 0%
- Praise usage: EdoBEST 96.7% vs Status Quo 48.1%
- Corporal punishment: EdoBEST 6.7% vs Status Quo 14.8%
- Students focused many/all minutes: EdoBEST 94.4% vs Status Quo 73.3%
- Students working hard: EdoBEST 98.2% vs Status Quo 62.9%

### Learning Outcomes (EdoBEST P3)
- Maths total: EdoBEST 40% vs Status Quo 37.7% (+2.3%)
- Literacy total: EdoBEST 52.2% vs Status Quo 47.1% (+5.1%)
- Girls drove the biggest gains
- Effect size: ~0.24-0.25 standard deviations (maths & literacy)
- EdoBEST impact equivalent to ~2/3 to 3/4 of a year extra instruction

### School Readiness Assessment
- NALABE scores by subject (national averages):
  - English Studies: Multiple Choice (Good), Essay (Fair)
  - Mathematics: Numbers/Numeration 64.4%, Algebraic 59.1%, Basic Ops 51%, Everyday Math 34.5%
  - Basic Science & Tech: Fair in both MC and Essay
  - Social Studies: Good in both MC and Essay

### Resource Data
- ECCDE classrooms: 310,667 (Public 28%, Private 72%)
- Primary classrooms: 777,748 (Public 52%, Private 48%)
- JSS classrooms: 181,692
- Primary schools with fence: 54,744 (Public 18%, Private 82%)
- JSS schools with labs: 17,380 (46%)
- JSS schools with toilets: 85%
- Pupil-Furniture Ratio: 4-5

### Data Sources (cite in dashboard footer)
1. UBEC 2022/2023 National Personnel Audit Report — https://ubec.gov.ng
2. UBEC Basic Education Data Factsheets 2022 — https://factsheets.ubecedata.com
3. EdoBEST Effect Report — Bridge International Academies
4. DHIS2/EdoEMIS Edo State — https://dhis2.org/school-reporting-edo-state-nigeria/
5. PLANE Education Dashboard Report — https://planenigeria.com
6. Nigeria Digest of Education Statistics 2019 — Federal Ministry of Education
7. World Bank Education Statistics — https://data.worldbank.org
8. NALABE National Report — UBEC

## Dashboard Features Required

### Overview Page
- 6 KPI cards: Total Schools (171,027), Total Enrollment (47M), Teachers (1.69M), Avg Attendance Rate, School Visits This Month, Readiness Score
- Bar chart: Enrollment by state (6 states)
- Line chart: Monthly attendance trend (generate 12-month realistic data)
- Donut chart: Schools by type (Public vs Private)

### Attendance Page
- Student attendance rate cards by state
- Teacher attendance comparison (EdoBEST vs Status Quo style)
- Heatmap-style attendance by day of week
- Daily attendance trend line chart

### School Visits Page
- Before/After comparison (413 → 1,522 visits)
- Map placeholder showing GPS visit distribution
- Visit completion rate by state
- SSO performance table

### Teacher Performance Page
- Training completion rates
- Feedback metrics comparison
- Praise/positive practices usage
- Time on task metrics

### Student Progress Page
- Assessment scores by subject (Maths, English, Science, Social Studies)
- Grade-level progression rates
- EdoBEST vs Status Quo learning outcomes comparison
- Gender parity metrics

### Resources Page
- Classroom availability
- Infrastructure metrics (fencing, labs, toilets)
- PTR by state
- Textbook availability

### Readiness Page
- Readiness score radar chart by domain
- State comparison
- Improvement tracking over time

## Technical Requirements
- Use Recharts for all charts
- Responsive layout
- Dark mode support
- Sidebar navigation with lucide-react icons
- Use shadcn/ui components (Card, Badge, Table, Tabs, Select, etc.)
- Font: tabular-nums lining-nums on all numbers
- All data hardcoded in a data file (no API needed for demo)
- Include PerplexityAttribution component
- Footer: "Data Sources: UBEC NPA 2022/23, EdoBEST, PLANE, DHIS2/EdoEMIS, World Bank"
