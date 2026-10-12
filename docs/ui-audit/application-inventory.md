# SellMyGhar.in - Application Architecture & UI Topology Inventory

**Audit Date:** October 2026  
**Auditor:** Senior Product Architect & UI Design Systems Specialist  
**Target Platform:** SellMyGhar.in (Bengaluru Residential Resale Platform)  
**Scope:** Complete repository audit of existing frontend, client routes, component hierarchy, authentication, backend integrations, and data dependencies.

---

## 1. Executive Summary & Platform Overview

SellMyGhar.in is a specialised, high-trust residential apartment resale platform built exclusively for Bengaluru micro-markets. Unlike general classifieds portals (e.g. 99acres, MagicBricks, Housing.com) that act as open lead-distribution marketplaces, SellMyGhar operates a direct homeowner-assisted model with:
- **Kaveri 2.0 Title Diligence:** Pre-screening of registered mother deeds, encumbrance certificates (EC), BBMP A-Khata extracts, and tax receipts.
- **Dedicated Relationship Management:** Dedicated staff deal closers and accompanied buyer physical inspections.
- **Zero Broker Spam:** Client phone numbers are shielded; inquiries flow through an internal CRM rather than public broker lists.
- **DPDP Act (2023) Statutory Compliance:** Built-in consent management ledgers, withdrawal workflows, and Section 12 Right to Erasure with statutory limitation retention holds.

---

## 2. Technology Stack Breakdown

| Layer | Technologies & Versions | Purpose |
| :--- | :--- | :--- |
| **Runtime & Language** | Node.js (v20+), TypeScript 7.0.2, ES Modules (`"type": "module"`) | Strong typing across frontend, shared contracts, and server runtime. |
| **Frontend Framework** | React 19.0.1, React DOM 19.0.1 | Modern concurrent React component architecture with hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`, `useId`). |
| **Styling & Design Engine**| Tailwind CSS v4.3.3 (`@tailwindcss/vite`), Custom `@theme` tokens in `src/index.css` | Utility-first responsive CSS, design tokens, typography, CSS animations (`partnerMarquee`, `locationTicker`, `verticalLocalityRoll`). |
| **Iconography** | `lucide-react` (v0.546.0) | Consistent iconography across navigation, badges, property attributes, actions, and CRM controls. |
| **Animation Library** | `motion` (v12.23.24 / Motion for React) | Fluid transitions and layout animations. |
| **Validation** | `zod` (v4.6.5) | Runtime schema validation for data intake, DTOs, and API responses. |
| **Bundler & Build Tool**| Vite 8.3.0 (`@vitejs/plugin-react`) | Rapid HMR in development, optimized tree-shaken static production build (`dist/`). |
| **Backend Web Server** | Express 4.21.2 (`server.ts`) | Unified backend handling customer and CRM REST endpoints, session cookies, rate-limiting, and static serving. |
| **Database Engine** | PostgreSQL 16+ via `pg` (v8.23.0 Connection Pool) + `dev-sandbox-store.ts` in-memory fallback | Canonical SQL database with 19 tables, indexes, constraints, and audit logging. |
| **Authentication Engine**| `jose` (v6.2.12), Supabase Auth (`@supabase/supabase-js` v2.117.2) | Dual auth tracks: Customer Phone OTP / Google OAuth via Supabase, Staff Password via server bcrypt/JWT with HTTP-only cookies. |
| **Storage Engine** | Supabase Storage (`@supabase/supabase-js`) & Google Cloud Storage (`@google-cloud/storage` v8.2.0) | Public bucket `property-media` for listing photos; private bucket `property-documents` for confidential title deeds. |
| **Email Service** | Custom `email-service.ts` with Resend API / SMTP configuration & simulation | Transactional email workflows, RFC 5545 `.ics` calendar generation, idempotency tracking. |

---

## 3. Architecture & Directory Structure

```
SMG---MVP/
├── index.html                           # Root HTML shell, fonts (Plus Jakarta Sans, Poppins), preloaded hero assets
├── package.json                         # Dependencies, build & test scripts
├── server.ts                            # Express application entrypoint (6,811 lines), API routes & middleware
├── vite.config.ts                       # Vite bundler configuration with React & Tailwind plugins
├── public/                              # Static public assets (images, logos, robots.txt, sitemap.xml)
│   ├── favicon.png
│   ├── logo.png                         # SellMyGhar brand logo
│   ├── robots.txt                       # SEO crawler rules (disallows /crm, references sitemap.xml)
│   ├── sitemap.xml                      # Canonical sitemap including all 11 Bengaluru locality landing pages
│   └── images/
│       ├── verified-rosette-badge.svg   # Official Rosette verification stamp
│       ├── luxury-apartment-township-sunset.webp
│       ├── brigade-granada-clubhouse.webp
│       ├── bengaluru-night-apartments.webp
│       ├── bengaluru-cityscape-footer.svg # Watermark illustration in footer
│       └── partners/                    # Builder channel partner SVG/PNG logos (Godrej, Brigade, Sobha, Prestige)
└── src/
    ├── main.tsx                         # React entrypoint (`ReactDOM.createRoot`)
    ├── App.tsx                          # Top-level client-side router, state container & auth session bootstrap
    ├── index.css                        # Tailwind v4 import, theme CSS variables, keyframe animations
    ├── core/                            # Core domain contracts, schemas, permissions & sanitization
    │   ├── types/
    │   │   ├── auth.ts                  # StaffRole, CustomerRole, CrmModule, Permission definitions
    │   │   └── entities.ts              # PublicListingProjection, LeadStatus, DocumentType, UserPrivateRecord
    │   ├── schemas/validation.ts        # Zod validation schemas
    │   └── utils/sanitization.ts        # Input sanitization and formatting helpers
    ├── data/                            # Static datasets & SEO profiles
    │   ├── bengaluruData.ts             # 11 Localities, 100+ Gated Societies, Builder benchmarks
    │   └── localitySeoData.ts           # Rich SEO profiles for 11 micro-markets (Hebbal, Whitefield, etc.)
    ├── lib/
    │   └── supabase.ts                  # Browser Supabase client singleton (`getBrowserSupabase`)
    ├── types/                           # Component-level TypeScript models
    │   ├── user.ts                      # UserAuthProfile
    │   ├── seller.ts                    # SellerPropertyItem, PropertyStageEnum, StatutoryDocument
    │   └── ownerProperty.ts             # Owner property models
    ├── utils/                           # Shared utility libraries
    │   ├── analytics.ts                 # Safe analytics tracking (`trackEvent`)
    │   ├── formatters.ts                # Indian currency (Lakhs/Crores), dates, phones, numbers
    │   └── safeApi.ts                   # Fault-tolerant JSON fetch helper (`safeFetchJson`)
    ├── server/                          # Backend business logic, database, storage & compliance
    │   ├── auth/                        # JWT tokens, password hashing, OTP service, RBAC & ownership middleware
    │   ├── cms/                         # Hero slides service, Builder partner logos service
    │   ├── compliance/                  # DPDP consent ledger, erasure service, statutory retention config
    │   ├── config/                      # Environment variables validation (`env.ts`)
    │   ├── db/                          # Pool, staging-schema.sql, core-tables.sql, dev-sandbox-store.ts
    │   ├── notifications/               # Email service (Resend/SMTP), SMS provider, outreach service
    │   ├── ratelimit/                   # In-memory sliding window rate limiter
    │   ├── storage/                     # Supabase & GCS storage upload/verification clients
    │   └── workflow/                    # Buyer, seller, and inventory manager services
    └── components/                      # Frontend UI Component Library
        ├── brand/
        │   └── Logo.tsx                 # Brand logo component
        ├── common/
        │   └── DateTimePicker.tsx       # Custom calendar & time picker modal with quick presets
        ├── auth/
        │   ├── AuthPage.tsx             # Dual-mode (Phone OTP + Google OAuth) user sign-in/up
        │   ├── StaffLogin.tsx           # Restricted staff email/password login portal
        │   └── AuthCallback.tsx         # OAuth PKCE callback exchange handler
        ├── home/
        │   ├── HomePage.tsx             # Public landing page container
        │   ├── Header.tsx               # Sticky header with Post Property FREE & user navigation
        │   ├── Hero.tsx                 # 45-day USP hero with background carousel & 99acres intake card
        │   ├── TrustedPartnersMarquee.tsx # Infinite marquee of verified builder partners
        │   ├── HoldingCostCalculator.tsx  # Unsold flat financial holding cost calculator
        │   ├── ListedProperties.tsx     # Filterable verified inventory grid
        │   ├── BengaluruLocalitiesSection.tsx # 11-locality micro-market grid with zone filters
        │   ├── SellerConversionCard.tsx # High-contrast bottom seller conversion card
        │   ├── LeadCapture.tsx          # Dual-intent (Sell/Buy) lead capture form with confirmation
        │   └── Footer.tsx               # Footer with cityscape watermark, FAQs, DPDP privacy modals
        ├── property/
        │   └── PropertyDetailPage.tsx   # Comprehensive public property view with due diligence report
        ├── locality/
        │   └── LocalityDetailPage.tsx   # Dedicated programmatic SEO landing page per micro-market
        ├── seller/
        │   ├── SellerFunnel.tsx         # 6-step assisted property onboarding wizard
        │   └── SellerDashboard.tsx      # Authenticated seller portal (6-milestone progress, timeline, visits)
        ├── compliance/
        │   └── ConsentPortal.tsx        # DPDP Section 6 notice & consent management ledger
        ├── buyer/
        │   └── BuyerDiscovery.tsx       # Standalone curated buyer search prototype (unrouted)
        └── crm/                         # Operations & Staff CRM Suite
            ├── CrmDashboard.tsx         # Core operations container (Overview, Leads, Properties, Visits, etc.)
            ├── PropertyEditor.tsx       # Full property lifecycle modal (Basic, Pricing, Content, Images, History)
            ├── DocumentVerificationDesk.tsx # Title diligence desk with checksums & ClamAV status
            ├── TasksKanbanModule.tsx    # Drag-and-drop follow-up tasks Kanban & table
            ├── CalendarModule.tsx       # Month, Week, Day, Agenda operations calendar
            ├── AdminErasureQueue.tsx    # DPDP Section 12 erasure review queue
            ├── HeroCmsManager.tsx       # Live hero banner slides manager
            ├── PartnerLogosManager.tsx  # Builder partner logos & settings manager
            └── PublicationEmailManager.tsx # Transactional email template manager & live preview
```

---

## 4. Routing Paradigm & Navigation Topology

SellMyGhar.in implements a hybrid URL resolution strategy in [`src/App.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/App.tsx) that seamlessly supports both HTML5 Path-based URLs and Hash-based deep links, ensuring full compatibility with static hosting, single-page application (SPA) routing, and direct deep-linking.

### Routing Table & Precedence

```mermaid
flowchart TD
    Req[Incoming URL: path + hash + host] --> CrmCheck{host.startsWith('crm.') OR hash == '#/crm' OR path == '/crm'?}
    CrmCheck -- Yes --> R_CRM[Route: CRM]
    CrmCheck -- No --> DashCheck{hash/path == '/dashboard' OR '/seller-dashboard'?}
    DashCheck -- Yes --> R_DASH[Route: DASHBOARD]
    DashCheck -- No --> AuthCheck{hash/path == '/login' OR '/register'?}
    AuthCheck -- Yes --> R_LOGIN[Route: LOGIN]
    AuthCheck -- No --> ConsentCheck{hash/path == '/consent'?}
    ConsentCheck -- Yes --> R_CONSENT[Route: CONSENT]
    ConsentCheck -- No --> FunnelCheck{hash/path == '/seller-assisted' OR '/post-property'?}
    FunnelCheck -- Yes --> R_FUNNEL[Route: SELLER_ASSISTED]
    FunnelCheck -- No --> PropCheck{path/hash starts with '/property/:id'?}
    PropCheck -- Yes --> R_PROP[Route: PROPERTY_DETAIL]
    PropCheck -- No --> CallbackCheck{path/hash starts with '/auth/callback'?}
    CallbackCheck -- Yes --> R_CALLBACK[Route: AUTH_CALLBACK]
    CallbackCheck -- No --> ContactCheck{hash/path == '/contact'?}
    ContactCheck -- Yes --> R_CONTACT[Route: CONTACT]
    ContactCheck -- No --> LocCheck{Matches /sell-flat-in-:slug-bangalore OR /locality/:slug?}
    LocCheck -- Yes --> R_LOC[Route: LOCALITY_DETAIL]
    LocCheck -- No --> R_HOME[Route: HOME]
```

### Route Definitions (`AppRoute`)

1. `HOME`: Default public landing page (`/` or empty hash).
2. `PROPERTY_DETAIL`: Dedicated public property detail page (`/property/:id` or `#/property/:id`).
3. `LOCALITY_DETAIL`: Dedicated programmatic SEO landing page (`/sell-flat-in-:slug-bangalore` or `#/sell-flat-in-:slug-bangalore`).
4. `SELLER_ASSISTED`: 6-step property listing wizard (`/seller-assisted`, `/post-property`, `#/seller-assisted`).
5. `LOGIN`: Dedicated customer authentication portal (`/login`, `/register`, `#/login`).
6. `DASHBOARD`: Dedicated authenticated homeowner management portal (`/dashboard`, `/seller-dashboard`, `#/dashboard`).
7. `CONTACT`: Dedicated advisory desk & office contact page (`/contact`, `#/contact`).
8. `CONSENT`: DPDP Act Section 6 Statutory Consent & Withdrawal Portal (`/consent`, `#/consent`).
9. `CRM`: Hidden Staff Operations Portal (`/crm`, `#/crm`, or `crm.*` subdomain). Requires staff credentials.
10. `AUTH_CALLBACK`: Supabase Google OAuth PKCE token exchange endpoint (`/auth/callback`).

---

## 5. Role-Based Access Control (RBAC) Architecture

The application enforces a multi-tier permission matrix defined in [`src/core/types/auth.ts`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/core/types/auth.ts) and executed via server middleware in [`src/server/auth/middleware.ts`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/server/auth/middleware.ts).

### Roles

1. **Customer Roles:**
   - `BUYER`: Default role for all public consumers and Google OAuth users. Can submit inquiries, schedule visits, make offers, and browse inventory.
   - `OWNER`: Property owner role. Can post properties, manage active listings, upload documents, and track milestone progression.

2. **Staff Operational Roles:**
   - `STAFF_INTAKE_AGENT`: First-response lead intake, telephone qualification, initial data verification.
   - `STAFF_VERIFICATION_AGENT`: Legal due diligence officer. Reviews uploaded title deeds, encumbrance certificates, verifies Khata, and sets document review statuses.
   - `STAFF_LISTING_MANAGER`: Content & merchandising manager. Edits property descriptions, uploads/reorders gallery photos, manages featured flags, manages CMS banners and builder logos.
   - `STAFF_DEAL_CLOSER`: Transaction facilitator. Accompanies physical buyer visits, negotiates formal offers, records meeting minutes, and closes transactions.
   - `STAFF_SUPER_ADMIN`: Full administrative clearance. Team user invitation, role assignment, DPDP Section 12 erasure execution, audit log inspection, and executive analytics.

### CRM Modules (`CrmModule`)
Staff permissions are governed either by legacy roles or explicit module assignments:
- `OVERVIEW`: Executive KPI metrics, conversion rates, active listings count.
- `LEADS`: Inbound seller and buyer lead queues, assignment, status pipeline.
- `PROPERTIES`: Property inventory table, detailed property editor, image manager.
- `VISITS`: Scheduled buyer inspections, visit status tracking, WhatsApp notifications.
- `OFFERS`: Inbound buyer purchase offers, counter-offer handling, negotiation notes.
- `TASKS`: Follow-up scheduling, Kanban task board, overdue follow-up queues.
- `CALENDAR`: Integrated operations calendar (Day, Week, Month, Agenda).
- `TEAM`: Staff directory, role modification, explicit module permission assignment.
- `REPORTS`: Transaction velocity, micro-market pricing reports, CSV exports.
- `AUDIT_LOGS`: Immutable security log of all staff actions, logins, status edits, and erasures.
- `SETTINGS`: Security queue (Erasure requests), Hero CMS slides, Partner logos CMS, Transactional email templates.

---

## 6. Authentication & Session Lifecycles

### Track 1: Customer Authentication (Phone OTP & Google OAuth)
1. **Phone OTP (Primary):**
   - User inputs 10-digit Indian mobile number.
   - `POST /api/auth/otp/request` triggers SMS OTP delivery with a 60-second cooldown timer.
   - User submits 6-digit OTP code to `POST /api/auth/otp/verify`.
   - Server validates code, provisions/retrieves `users` record, sets an authoritative `HttpOnly`, `SameSite=Lax`, `Path=/` session cookie signed via `jose` containing `sub: user.id`, `token_version: 1`, `roles: ['BUYER']`.
2. **Google OAuth via Supabase:**
   - User initiates Google OAuth via `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`.
   - Browser redirects to `/auth/callback` where `AuthCallback.tsx` captures PKCE authorization code or session.
   - Client sends token to `POST /api/auth/google/session`.
   - Server validates Google identity against Supabase, matches or links `user_identities` record, creates customer profile if new, and issues the authoritative server session cookie.

### Track 2: Staff Authentication (Restricted Operations Portal)
- Accessible exclusively via `#/crm` or `/crm`. Zero links or entry points exist in the public UI.
- User submits staff email and password to `POST /api/auth/login`.
- Server validates password against `password_hash` via bcrypt/scrypt.
- Fails closed after repeated invalid attempts (`failed_login_attempts`, `locked_until`).
- Returns staff profile with verified roles (`STAFF_*`) and issues the authoritative session cookie.
- Stored temporarily in browser `sessionStorage` (`sellmyghar_staff_session`) for UI navigation state while the HTTP-only cookie secures all API calls.

### Session Validation & Revocation
- On every page load, `App.tsx` calls `GET /api/auth/me`.
- Server inspects the session cookie, decodes JWT, verifies expiration, and checks `token_version` against the database.
- If `token_version` has incremented (e.g. following `POST /api/auth/logout`), the session is rejected with `401 SESSION_REVOKED`.

---

## 7. Audited Inventory Statistics

| Category | Count | Status |
| :--- | :---: | :--- |
| **Documented Client Routes** | 10 | Fully verified in `App.tsx` |
| **Documented CRM Functional Modules** | 11 | Fully verified in `CrmDashboard.tsx` |
| **Documented Top-Level Screens & Portals** | 14 | Fully verified across source code |
| **Reusable UI Component Files** | 31 | Verified in `src/components/` |
| **Documented Server API Endpoints** | 56 | Verified in `server.ts` |
| **Underlying Database Tables** | 19 | Verified in `staging-schema.sql` |
| **Documented Micro-Markets (SEO)** | 11 | Verified in `localitySeoData.ts` |
| **Automated Test Coverage** | 272 | 100% passing (`npm test`) |
