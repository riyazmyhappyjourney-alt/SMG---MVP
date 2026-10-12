# SellMyGhar.in - UI Migration & Regression Checklist

**Audit Date:** October 2026  
**Auditor:** Senior Product Architect, React/TypeScript Engineer & QA Lead  
**Scope:** Screen-by-screen migration matrix, classification of functional vs visual changes, regression risk assessment, and pre-implementation test checklist.

---

## 1. Screen Migration Matrix

| Existing Screen | Existing Components | Proposed Redesign (Stitch) | Functional Dependencies | Regression Risks & Mitigation Strategies |
| :--- | :--- | :--- | :--- | :--- |
| **SCR-01: Public Homepage** (`HOME`) | `HomePage.tsx`, `Header.tsx`, `Hero.tsx`, `TrustedPartnersMarquee.tsx`, `HoldingCostCalculator.tsx`, `ListedProperties.tsx`, `BengaluruLocalitiesSection.tsx`, `SellerConversionCard.tsx`, `Footer.tsx` | Clean, premium homepage with Trust Blue (`#244B8F`) accents, Montserrat display typography, refined 99acres-inspired quick intake card, seamless partner logo marquee, and high-contrast dark footer with Bengaluru cityscape watermark. | - `GET /api/cms/hero-slides`<br>- `GET /api/cms/partner-logos`<br>- `GET /api/cms/partner-section`<br>- `GET /api/listings`<br>- `GET /api/auth/me`<br>- `bengaluruData.ts` autocomplete | **Risk:** Removing or altering mathematical formula in Holding Cost Calculator.<br>**Mitigation:** Keep exact parameters (₹1.08 Cr, 1461 sqft, ₹5 maint, ₹40k rent, 2% brokerage, ₹7,83,660 combined).<br>**Risk:** Breaking society search autocomplete.<br>**Mitigation:** Retain existing `searchSocieties` hook and keydown bindings. |
| **SCR-02: Property Detail Page** (`PROPERTY_DETAIL`) | `PropertyDetailPage.tsx`, `Logo.tsx` | Editorial 2-column detail page with full-width responsive gallery, verified due diligence 6-pillar trust card, relationship manager profile, sticky visit scheduling form, and similar listings carousel. | - `GET /api/listings/:id`<br>- `POST /api/leads` (Enquiry submission)<br>- WhatsApp direct launch | **Risk:** Exposing private homeowner phone numbers to public buyers.<br>**Mitigation:** Ensure public view strictly displays assigned relationship manager desk phone and WhatsApp links.<br>**Risk:** Dropping statutory DPDP consent checkbox.<br>**Mitigation:** Keep consent checkbox mandatory before visit submission. |
| **SCR-03: Locality SEO Landing Pages** (`LOCALITY_DETAIL`) | `LocalityDetailPage.tsx` | Programmatic micro-market authority pages with breadcrumb trail, pricing intelligence cards, gated society list, Kaveri 2.0 Sub-Registrar guidance, and micro-market FAQs. | - `localitySeoData.ts`<br>- `BANGALORE_LOCALITIES_SEO` profiles<br>- Navigation parameters | **Risk:** Losing SEO canonical URLs or micro-market content.<br>**Mitigation:** Retain route patterns `/sell-flat-in-:slug-bangalore` and page `<title>` generation.<br>**Risk:** Inaccurate stamp duty fees.<br>**Mitigation:** Preserve exact 5% + 1% + 2% + 1% Kaveri 2.0 fee breakdown. |
| **SCR-04: Seller Assisted Funnel** (`SELLER_ASSISTED`) | `SellerFunnel.tsx` | 6-Step guided wizard with horizontal step indicator, clean multi-column form cards, drag-and-drop photo upload with thumbnail reordering, live Indian currency words formatter, and modal phone OTP verification. | - `POST /api/auth/otp/request`<br>- `POST /api/auth/otp/verify`<br>- `POST /api/storage/upload-photo`<br>- `POST /api/properties` | **Risk:** Premature property creation before OTP verification.<br>**Mitigation:** Preserve state machine gate: `POST /api/properties` executes strictly after successful OTP verification.<br>**Risk:** Breaking carpet area auto-calculation.<br>**Mitigation:** Maintain ~78% ratio helper with manual override capability. |
| **SCR-05: Customer Auth Portal** (`LOGIN`) | `AuthPage.tsx` | High-trust split-panel authentication modal (Dark brand panel on left, interactive form on right) supporting Phone OTP with 60-second cooldown and Google OAuth. | - `POST /api/auth/otp/request`<br>- `POST /api/auth/otp/verify`<br>- Supabase OAuth Client<br>- `POST /api/auth/google/session` | **Risk:** Reintroducing customer password login fields.<br>**Mitigation:** Keep customer password auth disabled; display informative redirection notice.<br>**Risk:** Exposing raw JWT tokens in browser storage.<br>**Mitigation:** Ensure session is held exclusively via HTTP-only cookie. |
| **SCR-06: OAuth Callback** (`AUTH_CALLBACK`) | `AuthCallback.tsx` | Minimal, high-trust status screen with branded loading spinner, success checkmark, or clear error recovery button. | - Supabase PKCE exchange<br>- `POST /api/auth/google/session` | **Risk:** Double authorization code exchange in React Strict Mode.<br>**Mitigation:** Retain `inFlightExchange` singleton deduplication logic in `AuthCallback.tsx`. |
| **SCR-07: Seller Dashboard** (`DASHBOARD`) | `SellerDashboard.tsx` | Homeowner portal featuring 3 sub-tabs (My Listings, Timeline, Site Visits), horizontal 6-milestone progress rail with real recorded timestamps, and document verification checklist. | - `GET /api/properties`<br>- `POST /api/auth/logout`<br>- Real event timestamps | **Risk:** Fabricating fake or hardcoded milestone dates.<br>**Mitigation:** Preserve `getMilestoneEventTimestamp` logic returning real timestamps or "Pending".<br>**Risk:** Altering the 6 milestone names.<br>**Mitigation:** Keep canonical names: `NEW`, `CONTACTED`, `FOLLOW_UP`, `SITE_VISIT`, `NEGOTIATION`, `CONVERTED`. |
| **SCR-08: Advisory Desk / Contact** (`CONTACT`) | `ContactPage.tsx`, `LeadCapture.tsx` | Authoritative office contact page with Indiranagar address, direct helpline, verified WhatsApp desk, RERA stamp, and embedded lead capture card. | - `POST /api/leads`<br>- Fallback reference generator | **Risk:** Losing official helpline or RERA registration number.<br>**Mitigation:** Retain `+91 80 4719 3300`, `+91 98765 43210`, and `PRM/KA/RERA/1251`. |
| **SCR-09: DPDP Consent Portal** (`CONSENT`) | `ConsentPortal.tsx` | Clean compliance ledger displaying active consents across 3 statutory purposes, notice versions, and instant withdrawal buttons. | - `POST /api/compliance/withdraw-consent`<br>- `POST /api/compliance/erasure-request` | **Risk:** Removing statutory purpose notices or withdrawal reference IDs.<br>**Mitigation:** Preserve `dpdp-notice-2026-v1` tracking and withdrawal reference code generation. |
| **SCR-10: Staff Portal Login** (`CRM` Gatekeeper) | `StaffLogin.tsx` | Restricted, minimal card with lock icon, email/password form, rate-limiting notice, and return to public homepage link. | - `POST /api/auth/login`<br>- `sessionStorage` profile store | **Risk:** Exposing staff login link on public consumer pages.<br>**Mitigation:** Keep CRM route accessible strictly via direct `#crm` URL or custom host. |
| **SCR-11 to SCR-21: Staff CRM Suite** (`CRM`) | `CrmDashboard.tsx`, `PropertyEditor.tsx`, `TasksKanbanModule.tsx`, `CalendarModule.tsx`, `AdminErasureQueue.tsx`, `HeroCmsManager.tsx`, `PartnerLogosManager.tsx`, `PublicationEmailManager.tsx` | Professional operations workstation with top command bar, 11 primary module tabs, dense readable data tables, slide-over lead/property drawers, interactive task kanban, operations calendar, and admin settings. | - 35+ Staff REST endpoints (`/api/crm/*`)<br>- Explicit module RBAC<br>- Transactional email dispatches<br>- Cloud storage file operations | **Risk:** Breaking property publishing validation barrier.<br>**Mitigation:** Retain `validatePropertyForPublish` requiring >= 3 images, description, pricing, and title.<br>**Risk:** Bypassing statutory hold during user erasure.<br>**Mitigation:** Preserve 2,920-day statutory deal hold check in `AdminErasureQueue.tsx`. |

---

## 2. Classification of Changes

### A. Existing Functionality That MUST Be Preserved
1. **6-Milestone CRM Lifecycle:** `NEW` -> `CONTACTED` -> `FOLLOW_UP` -> `SITE_VISIT` -> `NEGOTIATION` -> `CONVERTED`.
2. **Kaveri 2.0 Due Diligence Indicators:** Legal tier, BBMP A-Khata, 15-year NIL EC, Registered Mother Deed, Property Tax Receipt, Physical Inspection.
3. **Phone OTP Verification:** 10-digit validation, 60s cooldown timer, 6-digit code entry, authoritative HTTP-only session cookie.
4. **Calculated Carpet Area:** Auto-estimation at ~78% of SBUA with manual override.
5. **Holding Cost Calculator Math:** Maintenance (`Area * Rate * Months`) + Foregone Rent (`Rent * Months`) + Brokerage (`Value * 2%`).
6. **Property Publish Validation Barrier:** Requires >= 3 images, description, pricing, locality, title, and featured image.
7. **DPDP Compliance Safeguards:** Notice versions, withdrawal confirmation IDs, Section 12 erasure queue with statutory hold checks.
8. **Contact Shielding:** Never displaying seller private phone numbers to public buyers; routing all communications through assigned relationship managers.

### B. Visual Elements That CAN Be Redesigned
1. **Color Scheme Modernization:** Standardizing on Trust Blue (`#244B8F`), Dark Blue (`#1B396E`), Deep Ink (`#172033`), Canvas (`#F4F6F9`), and Restrained Gold (`#B68A4A`).
2. **Typography Standardization:** Applying Montserrat for all headings and Poppins for body, controls, and numbers.
3. **Card Styling & Elevation:** Replacing heavy dark drop shadows with subtle, clean borders (`border-slate-200`) and soft shadows (`shadow-xs` / `shadow-sm`).
4. **Form Field Styling:** Elevating text inputs with crisp border-slate-300, focus ring in Trust Blue, and permanent +91 prefix badges on phone fields.
5. **Table Typography & Density:** Optimizing CRM tables with tabular figures, distinct column widths, sticky headers, and clear hover highlights.
6. **Footer Layout & Watermark:** Refining the Bengaluru cityscape footer watermark to ensure full contrast and clean column spacing.

### C. Potential Usability Improvements (Zero Backend Changes Required)
1. **Enhanced Loading Skeletons:** Replacing generic pulse blocks with structured card skeletons that mimic the exact property card layout.
2. **Improved Toast Feedback:** Replacing browser alerts with consistent slide-in toast notifications (success, error, info) with auto-dismiss.
3. **Sticky Booking Bar on Mobile:** Adding a sticky bottom bar on mobile property detail pages with "Schedule Visit" and "WhatsApp" quick actions.
4. **Micro-Interactions & Hover States:** Adding subtle arrow transitions on buttons (`group-hover:translate-x-1`) and card hover elevations.
5. **Keyboard Accessibility:** Ensuring all dropdowns, autocompletes, and modals support Escape to close and Arrow keys for selection.

### D. Missing Information & Items Requiring Staging Verification
1. **Supabase Staging Project Region:** Must verify the exact host and cloud region in the Supabase Dashboard before configuring production `DATABASE_URL` (avoid assuming `asia-south1`).
2. **Resend / SMTP API Credentials:** Email dispatches are currently in simulated mode; production keys must be provisioned before live dispatches.
3. **Custom Domain SSL Configuration:** Production Cloud Run domain mapping for `sellmyghar.in` and `crm.sellmyghar.in`.

---

## 3. Pre-Implementation Acceptance Checklist

Before any Stitch-generated UI code is merged into the SellMyGhar.in repository, verify each item:

- [ ] **Zero API Contract Modifications:** Ensure no request payload property names, response structures, or endpoint paths were renamed.
- [ ] **All 19 Database Tables Intact:** No database columns or relationships altered.
- [ ] **Dual Authentication Tracks Intact:** Customer Phone OTP & Google OAuth operational; Staff password portal operational.
- [ ] **6 CRM Milestones Intact:** `NEW`, `CONTACTED`, `FOLLOW_UP`, `SITE_VISIT`, `NEGOTIATION`, `CONVERTED` render correctly in dashboard.
- [ ] **Holding Cost Calculator Precision:** Input of ₹1.08 Cr, 1461 sqft, ₹5 maint, ₹40k rent, 12 months holding results in exactly ₹7,83,660.
- [ ] **Rosette Verified Stamp Rendered:** Appears on verified property cards and public detail pages.
- [ ] **Mobile Responsiveness Verified:** All screens tested on 375px (mobile), 768px (tablet), 1280px (desktop), and 1920px (ultrawide).
- [ ] **DPDP Modals & Portals Accessible:** Privacy Policy, Terms, Grievance Officer, and Consent Portal links fully functional.
- [ ] **Full Automated Test Suite Passes:** All 272 unit, integration, and security tests pass (`npm test`: 272/272 passed).
- [ ] **Vite Production Build Clean:** `npm run build` completes with zero TypeScript or asset bundling errors.
