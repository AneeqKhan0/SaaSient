# SaaSient Dashboard — Session Notes

## Project Overview
Multi-tenant SaaS dashboard — "Lead & Conversation Hub" for managing WhatsApp/Voice agent leads, conversations, appointments, and usage analytics.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (PostgreSQL + Auth + Realtime), FullCalendar, Tailwind CSS 4

**Run:** `cd SaaSient && npm run dev` → http://localhost:3000
**Mobile access:** http://192.168.18.242:3000 (same WiFi required, firewall rule added)

---

## Environment (.env.local)
```
NEXT_PUBLIC_COMPANY_ID=d83662ef-04f3-4608-bdda-1ee9a5df0f39
NEXT_PUBLIC_SUPABASE_URL=https://tbspnkniqtylgjinxdym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...f-pvumfIVXEwUdESLNPQs9-ypjH-Vx019P_ipvGfyvg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...Ja7sVr8oHHHfvbXUr_J94Q_xYc010mDkUtBJC6kLsLI
```
> Note: Both JWT keys may be truncated — if "Invalid API key" error appears, re-paste from Supabase Dashboard → Project Settings → API

---

## Two Separate Dashboards

### 1. Client Dashboard (`/dashboard`)
- Login: `/login` — Supabase Auth, validates against `company_members` table for `NEXT_PUBLIC_COMPANY_ID`
- Pages: Overview, Qualified Leads, WhatsApp Conversations, Appointments, Plan Usage, Settings

### 2. Admin Portal (`/admin/dashboard`)
- Login: `/admin/login` — custom `admin_users` table (plain text password in `password_hash` column)
- Admin credentials: `aneeq.paradise@gmail.com` / `Aneeq123`
- Pages: Platform Dashboard, Companies, Audit Logs

---

## All Changes Made This Session

### Qualified Leads Page (`/dashboard/leads`)
1. **Hot/Warm/Cold filter tabs** — Added below the WhatsApp/Voice Agent toggle. Filters `lead_category` field client-side. Default = "All". Resets when switching agent tabs.
2. **WhatsApp Agent icon** — Real WhatsApp SVG logo on the tab button
3. **Voice Agent icon** — Robot/AI SVG icon on the tab button
4. **In-detail search** — Search bar inside the lead detail panel (right side). Filters and highlights matching key-value fields in yellow. Toggle button in detail panel header.

**Files changed:**
- `app/dashboard/leads/page.tsx`
- `app/components/dashboard/DataTable.tsx` — added `categoryTabs`, `icon` support on tabs
- `app/components/dashboard/DetailPanel.tsx` — added `searchable` prop, render function children
- `app/components/dashboard/KeyValueGrid.tsx` — added `searchQuery` prop, filtering + highlighting

---

### WhatsApp Conversations Page (`/dashboard/whatsapp`)
1. **Category filter tabs** — All / Buyer / Seller / Voice Agent Follow Up. Filters by `label` field on conversations. Sits below the search bar in left panel.
2. **In-chat search** — "🔍 Search in chat" button in right panel between header and messages. Filters messages and highlights matches in yellow. Full-width when expanded.

**Files changed:**
- `app/components/dashboard/ChatInterface.tsx` — added category tabs, chat search, `renderMessages` now receives `chatSearch` param
- `app/components/dashboard/ChatMessage.tsx` — added `highlight` prop for yellow text highlighting
- `app/dashboard/whatsapp/page.tsx` — updated `renderMessages` to pass `chatSearch`, filter + highlight messages

---

### Admin Portal — Mobile Responsiveness
1. **Hamburger menu** — New `AdminMobileMenu` component. Sticky top bar with logo + Admin badge + hamburger. Slides in drawer with nav links, user info, sign out.
2. **Horizontal overflow fixed** — `shell` overflow changed, `main` got `minWidth: 0`, search input `minWidth` removed, metrics grid `minmax` reduced to 140px
3. **Content cut off at bottom fixed** — `content` changed from `overflow: hidden` to `overflow: auto`, `maxHeight` removed on mobile, `marginBottom` added to table sections
4. **Filters stack on mobile** — All filter rows stack vertically on ≤768px screens
5. **Audit Logs date inputs** — Added visible "START DATE" / "END DATE" labels above date inputs (iOS Safari doesn't show placeholder on date inputs)
6. **MobileMenu border fix** — `borderColor` → `border` shorthand in `navItemActive` to fix React styling warning

**Files changed:**
- `app/admin/dashboard/layout.tsx` — added `AdminMobileMenu`, mobile CSS
- `app/components/admin/AdminMobileMenu.tsx` — new file
- `app/components/admin/styles/adminDashboardLayout.ts` — overflow, minWidth fixes
- `app/components/admin/styles/adminDashboardHome.ts` — metrics grid, search input, table section fixes
- `app/admin/dashboard/page.tsx` — filter classNames, mobile CSS
- `app/admin/dashboard/companies/page.tsx` — filter classNames, mobile CSS
- `app/admin/dashboard/audit-logs/page.tsx` — date input labels, filter classNames, mobile CSS
- `app/components/admin/AdminDataTable.tsx` — touch scroll, mobile font size
- `app/components/dashboard/MobileMenu.tsx` — border shorthand fix

---

## Known Issues / TODO

### Not Fixed Yet
- **WhatsApp mobile — opens chat directly instead of list** — The `useEffect` that sets `showChat=true` when `activeConversation` changes causes this on mobile. Multiple fix attempts made but reverted as they broke other things. Needs a different approach — likely passing `initialShowChat=false` from the page and only setting it on explicit user tap.
- **Admin login on mobile network** — Works on localhost. Mobile access requires same WiFi + firewall rule. Router AP Isolation may be blocking phone↔PC communication. Workaround: use PC hotspot.

### Pending Features (not started)
- Nothing explicitly requested but not done

---

## Key Database Tables
| Table | Purpose |
|-------|---------|
| `companies` | SaaS customers (plan, max_leads, status) |
| `company_members` | User-company relationships + roles |
| `lead_store` | Lead data (phone, email, Lead Category, Source, appointment_time) |
| `whatsapp_conversations` | WhatsApp threads (label field = Buyer/Seller/Voice agent Follow up) |
| `Conversations` | Message history |
| `admin_users` | Platform admins (email, password_hash plain text, is_active bool) |
| `audit_logs` | Admin action tracking |

## Lead Source Values (exact, case-sensitive)
- WhatsApp Agent tab: `Source = 'WhatsApp agent'` (lowercase 'a')
- Voice Agent tab: `Source = 'Voice Agent'`

## Lead Category Values
- `HOT`, `WARM`, `COLD` (uppercase in DB)

## WhatsApp Conversation Label Values
- `Buyer`, `Seller`, `Voice agent Follow up` (mixed case in DB)
- Filter matching is case-insensitive, whitespace-stripped

---

## Dev Server Notes
- `package.json` dev script: `next dev -H 0.0.0.0` (binds all interfaces for mobile access)
- Port 3000 firewall rule added on Windows
- `.next` cache can be cleared with: `Remove-Item -Recurse -Force SaaSient\.next`
