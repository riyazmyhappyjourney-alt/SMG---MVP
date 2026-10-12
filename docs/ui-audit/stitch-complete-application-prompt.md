# Google Stitch Master Design Prompt: Complete SellMyGhar.in Application Redesign

> **CRITICAL DIRECTIVE FOR GOOGLE STITCH:**  
> You are generating the **complete, end-to-end user interface redesign** for the verified real estate application **SellMyGhar.in** in a single project workspace.  
> **DO NOT INVENT A REPLACEMENT APPLICATION.**  
> **DO NOT OMIT, RENAME, OR MERGE ANY VERIFIED ROUTE, SCREEN, CRM MODULE, FORM FIELD, OR LIFECYCLE STATE.**  
> This master prompt provides the complete design blueprint for **all 23 verified application screens/modules**, their desktop and mobile viewports, the unified design system, shared navigation, modals, and slide-over drawers.  
> If your generation context or canvas limit prevents rendering all screens in a single turn, execute **Execution Set 1** first, followed immediately by the explicit **Continuation Prompts** provided at the end of this document. **Zero screens may be omitted.**

---

## 1. Approved Project Directives & Homepage Specifications

The following five homepage architectural decisions have been verified and approved by the product owner and must be strictly implemented:

1. **Single Photographic Hero with Dark Contrast Overlay:**  
   Replace multi-slide carousel transitions with a single, high-resolution Bengaluru residential apartment exterior backdrop (`/images/sample-hero-banner-1920x800.png` or equivalent high-contrast residential community). Apply a deep gradient overlay (`from-slate-950/90 via-slate-950/70 to-slate-950/40`) ensuring crisp WCAG AAA legibility for the white headline and gold eyebrow badges.
2. **Mobile Intake Form Directly Beneath Hero Headline:**  
   On mobile viewports (< 768px), stack the 99acres-inspired quick intake card directly beneath the H1 headline and subhead within the hero section, presenting a clean, compact touch form.
3. **Holding Cost Calculator Positioned Below Verified Resale Inventory:**  
   The homepage scroll order is strictly sequenced as follows:  
   `1. Hero & Intake` → `2. Builder Channel Marquee` → `3. Verified Resale Inventory Grid (#listings)` → `4. Financial Holding Cost Calculator (#calculator)` → `5. Locality Carousel` → `6. Seller Conversion Card` → `7. DPDP Footer`.
4. **Compact Horizontal Locality Carousel Linking to All 11 Locality Pages:**  
   Replace the expansive multi-column grid with a compact, horizontally scrollable micro-market carousel. Cards feature locality name, indicative price band, benchmark rate/sqft, and direct links to all 11 programmatic SEO pages (`/sell-flat-in-:slug-bangalore`).
5. **Compact White Slide-Down Mobile Navigation:**  
   The shared header on mobile displays a clean white slide-down drawer with clear touch targets (>= 48px), highlighted "For Owners (Sell Flat)" card with a `FREE LISTING` badge, secondary navigation links, and session actions.

---

## 2. SellMyGhar Unified Design System Specification

### 2.1 Brand Color Palette & Tokens

| Token Name | Hex Code | Purpose & Application |
| :--- | :--- | :--- |
| **Trust Blue (Primary)** | `#244B8F` | Primary action buttons, active navigation indicators, key brand headings, primary icons, focus rings |
| **Trust Blue Dark** | `#1B396E` | Primary button hover states, top banners, dark interactive accents |
| **Trust Blue Light** | `#3264BA` | Focus outlines, subtle badge borders, active chips, icon highlight backdrops |
| **Ink (Deep Navy)** | `#172033` | Primary headings, body copy, table headers, dark UI cards, footer background |
| **Canvas (Global Background)**| `#F4F6F9` | Global off-white background across all public and CRM pages, input fill, secondary card backs |
| **Gold Accent (Restrained)** | `#B68A4A` | Eyebrow badges, Rosette accents, premium township highlights, footer category headers |
| **Success Emerald** | `#059669` | "FREE" property posting badges, verified diligence checkmarks, active status pills |
| **Alert / Danger Rose** | `#E11D48` | Overdue follow-up tags, statutory erasure warnings, form error banners, destructive action buttons |
| **Warning Amber** | `#F59E0B` | In-review badges, counter-offer tags, scheduled visit indicators, pending inspection notes |
| **Slate Borders** | `#E2E8F0` / `#CBD5E1` | Crisp card borders (`border-slate-200` / `border-slate-300`) |

### 2.2 Typography Hierarchy

* **Heading Font Family:** **Montserrat** (`'Montserrat', -apple-system, sans-serif`)  
  * Tracking: `-0.025em`
  * Scale:
    * `H1 Display / Hero`: `36px` to `56px` (desktop), `30px` to `36px` (mobile), Weight: **800 (Extra-Bold)**, Line-height: `1.15`
    * `H2 Section Title`: `24px` to `30px`, Weight: **700 (Bold)**, Line-height: `1.25`
    * `H3 Card Title`: `16px` to `18px`, Weight: **700 (Bold)**, Line-height: `1.35`
    * `Eyebrow / Category`: `11px` to `12px`, Weight: **700 (Bold)**, Uppercase, Tracking: `+0.05em`
* **Body & UI Font Family:** **Poppins** (`'Poppins', -apple-system, sans-serif`)  
  * Scale:
    * `Body Regular`: `14px` (desktop), `13px`–`14px` (mobile), Weight: **400 (Regular)** / **500 (Medium)**, Line-height: `1.6`
    * `Body Small / Captions`: `11px` to `12px`, Weight: **400** / **500**, Line-height: `1.5`
    * `Buttons & Controls`: `12px` to `14px`, Weight: **600 (Semi-Bold)** / **700 (Bold)**
    * `Financial & Numerical Data`: Tabular numbers (`font-variant-numeric: tabular-nums`), formatted using Indian currency conventions (₹ Lakhs / Crores).
* **Iconography:** Clean line icons from `lucide-react`, 1.5px to 2px stroke width. Consistent 16x16px or 20x20px container sizing. No cartoonish emoji or 3D graphics.

### 2.3 Spacing, Radii & Surface Elevation

* **Grid & Spacing:** Strict 4px base grid (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`, `80px`). Max container width: `1280px` (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`).
* **Corner Radii:**
  * Content Cards: `rounded-xl` (12px) or `rounded-2xl` (16px).
  * Buttons & Form Inputs: `rounded-lg` (8px) or `rounded-xl` (10px–12px).
  * Status Pills & Tags: `rounded-full` (reserved strictly for small status badges, never full cards).
* **Surface Elevation & Borders:**
  * Light Surfaces: Pure White (`#FFFFFF`) with crisp border (`border border-slate-200/90`) and diffused elevation (`shadow-xs` / `shadow-sm`).
  * Hover Elevation: `shadow-md` on interactive cards with subtle 2px border accent.
  * Dark Surfaces: Deep Ink (`#172033`) with subtle border (`border-slate-800`).

### 2.4 Atomic UI Control Specifications

* **Buttons:**
  * *Primary Button:* Background `#244B8F`, text white, Montserrat 700. States: Default, Hover (`#1B396E`), Active (`scale(0.98)`), Focus (2px ring `#3264BA`, 2px offset), Disabled (opacity 50%, not-allowed), Loading (spinner + disabled).
  * *Secondary / Outlined Button:* Background white, border `border-slate-300`, text `#172033`. Hover: `bg-slate-50 border-slate-400`.
  * *Post Property [FREE] Button:* White surface, crisp border `border-slate-300`, text `#172033` with adjacent emerald `#059669` "FREE" pill.
* **Form Inputs & Selects:**
  * Height: 44px (desktop) / 46px (mobile for touch accessibility).
  * Background: White or Canvas `#F4F6F9`, border `border-slate-300`, text `#172033`.
  * States: Default, Focus (border `#244B8F` + 2px focus ring `#3264BA`), Error (border `#E11D48` + red helper text), Disabled (`bg-slate-100 text-slate-400`).
* **Modals & Overlays:**
  * Backdrop: `bg-[#172033]/70 backdrop-blur-xs`.
  * Container: Centered white card, `rounded-2xl`, max-width `xl` (576px) or `2xl` (672px), max-height `85vh` with inner scrollbar. Accessible close button (`X`) top-right.
* **Tables / Data Lists:**
  * Sticky column headers with subtle background (`bg-slate-50`).
  * Row height: 48px to 56px with subtle divider (`border-b border-slate-100`).
  * Hover row highlight (`bg-slate-50/80`).

---

## 3. Master Screen & Module Architecture (23 Screens / Desks)

| Screen ID | Canonical Name | Route / Context | Viewports Required |
| :---: | :--- | :--- | :---: |
| **SCR-01** | Public Homepage & Resale Discovery | `/` (`HOME`) | Desktop & Mobile |
| **SCR-02** | Verified Property Detail Page | `/property/:id` (`PROPERTY_DETAIL`) | Desktop & Mobile |
| **SCR-03** | Programmatic Locality SEO Landing Pages | `/sell-flat-in-:slug-bangalore` (`LOCALITY_DETAIL`) | Desktop & Mobile |
| **SCR-04** | Seller Assisted Multi-Step Funnel | `/seller-assisted` (`SELLER_ASSISTED`) | Desktop & Mobile |
| **SCR-05** | Customer Auth & Registration Portal | `/login` (`LOGIN`) | Desktop & Mobile |
| **SCR-06** | OAuth Authorization Callback Handler | `/auth/callback` (`AUTH_CALLBACK`) | Desktop & Mobile |
| **SCR-07** | Authenticated Seller Management Dashboard | `/dashboard` (`DASHBOARD`) | Desktop & Mobile |
| **SCR-08** | Advisory Desk & Contact Us Page | `/contact` (`CONTACT`) | Desktop & Mobile |
| **SCR-09** | DPDP Statutory Consent Portal | `/consent` (`CONSENT`) | Desktop & Mobile |
| **SCR-10** | Staff Operations Portal Login | `/crm` (Unauthenticated) | Desktop & Mobile |
| **SCR-11** | Staff CRM: Overview & KPI Dashboard | `/crm` (`OVERVIEW` Tab) | Desktop & Tablet |
| **SCR-12** | Staff CRM: Inbound Leads Pipeline Desk | `/crm` (`LEADS` Tab) + Lead Drawer | Desktop & Tablet |
| **SCR-13** | Staff CRM: Property Inventory & Lifecycle Editor | `/crm` (`PROPERTIES` Tab) + PropertyEditor Modal | Desktop & Tablet |
| **SCR-14** | Staff CRM: Accompanied Site Visits Desk | `/crm` (`VISITS` Tab) | Desktop & Tablet |
| **SCR-15** | Staff CRM: Buyer Purchase Offers Desk | `/crm` (`OFFERS` Tab) | Desktop & Tablet |
| **SCR-16** | Staff CRM: Follow-up Tasks Kanban & Table | `/crm` (`TASKS` Tab) | Desktop & Tablet |
| **SCR-17** | Staff CRM: Master Operations Calendar | `/crm` (`CALENDAR` Tab) | Desktop & Tablet |
| **SCR-18** | Staff CRM: Staff Directory & RBAC Desk | `/crm` (`TEAM` Tab) | Desktop & Tablet |
| **SCR-19** | Staff CRM: Business Reports & CSV Export | `/crm` (`REPORTS` Tab) | Desktop & Tablet |
| **SCR-20** | Staff CRM: Immutable Security Audit Logs | `/crm` (`AUDIT` Tab) | Desktop & Tablet |
| **SCR-21** | Staff CRM: Settings & Admin Control Panel | `/crm` (`SETTINGS` Tab - 4 Sub-Tabs) | Desktop & Tablet |
| **SCR-22** | Standalone: Deep Document Verification Desk | `DocumentVerificationDesk.tsx` | Desktop & Tablet |
| **SCR-23** | Standalone: Curated Buyer Discovery View | `BuyerDiscovery.tsx` | Desktop & Mobile |

---

## 4. Execution Set 1: Core Consumer Platform & Design System

*(Generate these screens in the initial turn)*

### Screen 1: Public Homepage & Resale Discovery (`SCR-01`)
* **Header (Sticky 72px Desktop / 64px Mobile):** Brand logo (height 40px), Nav tabs ("For Owners" with blue "Sell Flat" indicator, "For Buyers", "About", "Contact"), "Post property [FREE]" button, User toggle ("Login / Register" or "My Dashboard"). Mobile features compact white slide-down drawer with >= 48px tap heights.
* **Section 1: Hero & Intake Wizard:**
  * Background: Single photographic residential township backdrop with dark overlay gradient (`from-slate-950/90 via-slate-950/70 to-slate-950/40`).
  * Headline block: Blue pill `BENGALURU RESIDENTIAL RESALE`, H1 **"Sell your flat in 45 days."** (56px desktop, 32px mobile), subhead, CTAs ("Sell My Flat" + "Browse Verified Flats"), vertical rolling ticker cycling through 11 Bengaluru micro-markets every 2.4s.
  * 99acres-Inspired Intake Card: White card (`rounded-2xl`, p-6). Tab bar ("Sell Flat" active, "Buy Resale", "Rent", green "Post Property FREE" pill). 3-col controls: BHK selector (1 BHK to 4 BHK+), Society search autocomplete with dropdown list, Trust Blue button **"Get 45-Day Plan"**. Popular society pills (`Prestige Shantiniketan`, `Sobha Dream Acres`, `Brigade Gateway`, `Godrej Woodsman`).
  * Mobile: Intake card stacks cleanly directly beneath hero headline.
* **Section 2: Trusted Builder Channel Partners Marquee:** Continuous horizontal marquee with edge fade masks (Godrej, Brigade, Sobha, Prestige logos in white cards, pause on hover, static grid fallback for reduced motion).
* **Section 3: Verified Resale Inventory Grid (`#listings`):**
  * Header: Rosette icon + `VERIFIED RESALE INVENTORY`, H2 "Featured Apartments for Sale".
  * Filters: BHK chips (All, 1BHK, 2BHK, 2.5BHK, 3BHK, 3.5BHK, 4BHK+) + Locality selector.
  * 3-Column Card Grid (Desktop) / 1-Column (Mobile): 16:10 property photo with hover zoom; glassmorphic Rosette "Verified" badge; dark BHK pill; dark asking price bar (`#172033/95`) with price `₹[Asking Price]` and `₹[Rate]/sq.ft`; project title; locality with map pin; 3-box attribute strip (SBUA, facing, floor); "View Property" primary button + "Quick Enquiry" secondary button.
  * Loading state (3 skeleton cards) & Empty state ("No apartments match your selected filters" + Reset button).
* **Section 4: Financial Cost of an Unsold Flat Calculator (`#calculator`):**
  * Positioned below inventory. 2-column card (Desktop) / Stacked card (Mobile).
  * Left Inputs: Asking Price (`₹[Asking Price]`), SBUA (sq.ft), Maintenance Rate (₹/sq.ft/mo), Occupancy toggle (Vacant vs Tenanted), Monthly Rent input, Holding Period buttons (`6 Mo`, `9 Mo`, `12 Mo`, `18 Mo`).
  * Right Summary Card (Deep Navy `#172033`): Breakdown (Maintenance, Foregone Rent, Brokerage at 2%), prominent bold Total Holding Cost figure + caption, Kaveri 2.0 benchmarking info note, "Explore Selling Options" CTA button.
* **Section 5: Compact 11-Locality Micro-Markets Carousel:** Horizontally scrollable carousel ribbon featuring all 11 Bangalore localities (Hebbal, Thanisandra, Yelahanka, Jakkur, Hennur, Whitefield, Sarjapur Road, Bellandur, HSR Layout, JP Nagar, Indiranagar). Cards display benchmark rate/sq.ft, price band, and link to dedicated page.
* **Section 6: High-Contrast Seller Conversion Callout:** Deep Navy gradient banner (`#172033` to `#244B8F`), H2 "Your Bengaluru Flat Deserves a Clear Selling Plan", 3 trust pillars (Zero Upfront Listing Fee, Confidential Phone Protection, Screened Apartment Buyers), dual CTAs ("Start Selling My Flat" with `FREE ONBOARDING` pill + "Speak to Our Team").
* **Section 7: Shared DPDP-Compliant Footer:** Deep Navy `#172033` with Bengaluru cityscape watermark (`bengaluru-cityscape-footer.svg` at 18% opacity); 5 columns (Brand/RERA badge, Quick Nav, Legal/Privacy, Office Coordinates, Copyright & Sub-Registrar notice); triggers 4 legal modals (FAQ accordion, Grievance Officer SLA, DPDP Privacy Notice, Terms of Use).

### Screen 2: Verified Property Detail Page (`SCR-02`)
* **Layout:** Top minimal bar with "Back to Listings" and logo. 2-column workspace (8 cols content, 4 cols sticky sidebar).
* **Left Column:** Photo gallery carousel with thumbnail strip, fullscreen lightbox trigger, and Web Share button; Title and Asking Price header; Key attributes bar (BHK, SBUA, Carpet Area, Floor Band, Facing, Bathrooms, Balconies, Car parks).
* **Verified Due Diligence Box (High Trust Visual):** 6 verified green checkmark cards:
  1. *Legal Tier:* TIER-1 LEGAL VERIFIED
  2. *Khata Status:* BBMP A-Khata Verified
  3. *Encumbrance:* 15-Year NIL Encumbrance Certificate
  4. *Title Deed:* Clear Registered Mother Deed Verified
  5. *Property Tax:* Current Year Paid Receipt Verified
  6. *Physical Inspection:* Structural & Unit Inspection Completed
* **Description & Amenities:** Full narrative, amenities icon grid, Developer & RERA profile, nearby landmarks.
* **Right Sticky Sidebar:** Dedicated Relationship Manager card with photo, name, and "Assigned Bengaluru Resale Desk Lead"; Accompanied Visit Booking Form (Full name, 10-digit mobile, preferred slot, funding source radio, DPDP consent checkbox, "Schedule Accompanied Visit" button); Direct WhatsApp button; Call Advisory Desk button.
* **Mobile View:** Single column with sticky bottom mobile action bar ("Schedule Visit" + "WhatsApp").

### Screen 3: Programmatic Locality SEO Landing Pages (`SCR-03`)
* **Breadcrumbs:** `Home / Bengaluru Resale / Sell Flat in :locality`.
* **Hero Banner:** Zone eyebrow (e.g. `NORTH BENGALURU • AIRPORT CORRIDOR`), H1 "Sell Your Flat in {Locality}, Bengaluru With a Clear Plan", Kaveri 2.0 benchmarking copy, primary CTA ("Start Selling My Flat in {Locality}"), secondary CTA ("Speak to {Locality} Desk").
* **4-Metric Intelligence Grid:** Indicative Resale Band, Corridor Benchmark Rate, Typical Society Maintenance, Key Connectivity Hubs.
* **Content Blocks:** Popular Gated Societies grid with instant pre-fill selling buttons, Mandatory Documents Required checklist (Title deed, Mother deed, 15-yr EC, Khata certificate & extract, tax receipt, society NOC), Kaveri 2.0 Sub-Registrar Guidance & statutory fee breakdown schedule, Micro-market FAQ accordion.

### Screen 4: Seller Assisted Multi-Step Funnel (`SCR-04`)
* **Layout:** 6-Step Horizontal Progress Rail with icons and step counter (Desktop) / Compact stepper (Mobile).
* **Step 1 (Basic Details):** Listing intent segmented control (`SELL` vs `RENT`), property subtype cards.
* **Step 2 (Location):** Locality autocomplete, society autocomplete (100+ Bangalore societies), Wing/Tower input, Unit number.
* **Step 3 (Property Profile):** BHK selector chips, bathroom/balcony steppers, SBUA input (sq.ft), Carpet area input auto-calculated at ~78% of SBUA with manual override note, floor number/total floors, facing dropdown, furnishing chips, property age, covered parking toggle.
* **Step 4 (Photos & Video):** Drag-and-drop file upload zone, photo thumbnail grid with delete and "Set as Featured" star button, Video walkthrough URL input.
* **Step 5 (Pricing & Owner):** Asking price input with live Rupee words display (e.g. `₹ 1,35,00,000` -> **₹ 1.35 Crore**), maintenance charges, owner name, 10-digit mobile, public description.
* **Step 6 (Review & Submit):** Specification summary card, Lawful ownership declaration checkbox, DPDP contact consent checkbox, "Verify & Submit Property" button.
* **OTP Modal:** Triggered on submit; 6 numeric input boxes, 60-second cooldown timer, "Confirm OTP & Publish Listing".
* **Success View:** Centered card with green checkmark, prominent **Listing Reference ID: SMG-YYYY-XXXX** with copy button, review timeline guidance (within 2 business hours), and "View My Listing in Dashboard" action.

### Screen 5: Customer Auth & Registration Portal (`SCR-05`)
* **Desktop:** Centered 2-column split card. Left: Deep Navy `#172033` brand panel with SellMyGhar logo, 3 trust pillars (Zero Broker Spam, Kaveri 2.0 Diligence, Verified Buyers), and RERA seal. Right: Mode switcher (Sign In vs Create Account), 3 tabs:
  1. *Mobile OTP (Primary):* Phone input (+91 prefix), "Send OTP" button, 6-digit OTP code input, 60s cooldown timer, "Verify & Access Dashboard" button.
  2. *Google Sign-In:* Official branded "Continue with Google" button.
  3. *Email/Password:* Informative notice explaining that customer password authentication is disabled to prevent credential stuffing; instructs user to authenticate via Mobile OTP.
* **Mobile:** Single column white card with top brand logo.

### Screen 6: OAuth Authorization Callback Handler (`SCR-06`)
* **Layout:** Centered status card with loading spinner ("Securing your SellMyGhar session..."), success checkmark, or error recovery action ("Authentication Failed - Return to Sign In").

### Screen 7: Authenticated Seller Management Dashboard (`SCR-07`)
* **Header:** Sticky navbar with SellMyGhar logo, user name/phone badge, "Post property [FREE]" CTA, and Logout button.
* **Sub-Navbar (3 Tabs):** `My Listings`, `Property Timeline`, `Site Visits`.
* **Tab 1 (My Listings):** Property cards with project name, locality, BHK, price, and **6-Milestone Progress Tracker**:
  * Horizontal rail connecting 6 milestone dots: `NEW` → `CONTACTED` → `FOLLOW_UP` → `SITE_VISIT` → `NEGOTIATION` → `CONVERTED`.
  * Visual states: Completed (emerald checkmark), Current active (pulsating blue ping dot), Upcoming (gray dot).
  * Timestamps displayed under each dot (e.g. `[Date] • [Time]`) or `Pending`.
  * Document Diligence mini checklist (Title Deed, EC, Khata, Tax Receipt statuses).
  * Actions: "View Public Listing", "Edit Details", "Share Link".
* **Tab 2 (Property Timeline):** Vertical chronological activity log of RM calls, document reviews, and price updates.
* **Tab 3 (Site Visits):** Scheduled buyer visits table (buyer name, masked phone, date, slot, assigned closer, status, feedback notes).

### Screen 8: Advisory Desk & Contact Us Page (`SCR-08`)
* **Layout:** Sticky header, dark navy banner ("Dedicated Bengaluru Advisory Desk").
* **2-Column Grid:**
  * Left: Office Details card (`[Operations Centre / Registered Office Address, Bengaluru]`, Helpline `+91 80 [Verification Helpline]`, WhatsApp `+91 [WhatsApp Desk Number]`, Hours Mon-Sat 9:30 AM - 7:00 PM, RERA badge placeholder `PRM/KA/RERA/XXXX`).
  * Right: Inbound callback form (`LeadCapture.tsx`) with Sell/Buy toggle, name, phone, society, BHK, and submit button.

### Screen 9: DPDP Statutory Consent Portal (`SCR-09`)
* **Security Bar:** Shield icon + "DPDP Statutory Consent Management".
* **3-Phase Workflow:** Phone input → OTP verification → Active Consents Ledger table.
* **Ledger Table:** Lists 3 statutory purposes (`SELLER_ONBOARDING`, `MARKETING_OPT_IN`, `VISIT_COORDINATION`), notice version (`dpdp-notice-2026-v1`), granted timestamp, status pill, and "Withdraw Consent" red action button.
* **Withdrawal Confirmation:** Displays confirmation code (`wth-xxxx-xxxx`) and immediate cessation notice. Section 12 erasure link.

---

## 5. Execution Set 2: Internal Staff Operations & CRM Suite

*(Continuation prompt for Stitch to execute immediately following Set 1)*

### Screen 10: Staff Operations Portal Login (`SCR-10`)
* **Layout:** Centered security card (`max-w-md`, border-slate-200, shadow-xl). Lock icon inside blue badge.
* **Title:** "Staff Operations Portal - Restricted Authentication for Bengaluru Verification & CRM Desk".
* **Form:** Staff email (`staff@[domain]`), password input, "Access Operational Desk" primary button, "Return to Public Homepage" link.

### Screen 11: Staff CRM: Overview & Executive KPI Dashboard (`SCR-11`)
* **Command Bar (Height 64px, White border-b):** Staff logo, active module title, global search input (`Search leads, properties, phones, or IDs...`), role switcher dropdown (`STAFF_SUPER_ADMIN`, `STAFF_LISTING_MANAGER`, etc.), active staff profile pill with email/role, Logout button.
* **11 Primary Navigation Tabs:** `Overview`, `Leads`, `Properties`, `Visits`, `Offers`, `Tasks`, `Calendar`, `Team`, `Reports`, `Audit`, `Settings`.
* **Overview Content:** Executive KPI cards (Total Inbound Leads, Active Resale Listings, Scheduled Buyer Visits, Pending Legal Diligence, Conversion Rate), 30-day velocity metric chart, Quick Action buttons (Create Listing, Add Lead, Schedule Visit), Recent Activity feed.

### Screen 12: Staff CRM: Inbound Leads Pipeline Desk (`SCR-12`)
* **Filters:** 7-stage pipeline filter chips (`NEW`, `CONTACTED`, `FOLLOW_UP`, `SITE_VISIT`, `NEGOTIATION`, `CONVERTED`, `LOST`), search bar, assigned staff filter, lead type filter (Seller vs Buyer), urgency filter (Overdue, Today, Upcoming).
* **Data Table:** Dense rows with checkbox, lead name, phone, society, locality, BHK, expected price, stage pill, assigned staff, next follow-up date.
* **Lead Detail Slide-Over Drawer:** Clicking a row opens a right-side drawer: lead profile, stage transition selector, assigned staff dropdown, follow-up date picker, internal notes thread, and "Convert Lead to Listing" action button.

### Screen 13: Staff CRM: Property Inventory & Lifecycle Editor (`SCR-13`)
* **Filters:** Status chips (`ALL`, `DRAFT`, `PUBLISHED`, `PAUSED`, `SOLD`, `ARCHIVED`), BHK filter, search bar.
* **Inventory Table:** Thumbnail, title, locality, pricing, floor, verification badge, and status pill. Action buttons ("Edit Property", "Publish", "Pause", "Mark Sold", "Archive").
* **PropertyEditor Modal (`PropertyEditor.tsx` - 5 Tabs):**
  * Tab 1 `BASIC`: Title, project name, locality, property type, BHK, SBUA, carpet area, floor band, facing, address.
  * Tab 2 `PRICING`: Asking price INR, monthly maintenance, reserve bottom-line price.
  * Tab 3 `CONTENT`: Description, amenities tags multi-select, developer name, landmarks list.
  * Tab 4 `IMAGES`: Upload photos, gallery grid, set featured thumbnail, delete image, reorder images.
  * Tab 5 `ACTIVITY`: Audit change log.
  * "Publish Property" action executes validation check requiring >= 3 images, description, pricing, and title.

### Screen 14: Staff CRM: Accompanied Site Visits Desk (`SCR-14`)
* **Visit Schedule Table:** Client name, phone, property reference, assigned closer, visit date, time slot, status (`SCHEDULED`, `COMPLETED`, `CANCELLED`), and closer notes.
* **Actions:** "Schedule New Visit" modal (with `DateTimePicker`), update visit status, "Send WhatsApp Reminder" button.

### Screen 15: Staff CRM: Buyer Purchase Offers Desk (`SCR-15`)
* **Offers Table:** Property reference, buyer name, buyer phone, offer amount INR, status (`PENDING_REVIEW`, `ACCEPTED`, `COUNTER_OFFERED`, `REJECTED`), counter-offer amount, negotiation notes.
* **Actions:** Record new offer modal, Accept offer button, Counter-offer input & submit, Reject offer.

### Screen 16: Staff CRM: Follow-up Tasks Kanban & Table Desk (`SCR-16`)
* **View Switcher:** Table view vs Kanban board toggle.
* **Kanban Board:** 4 columns: Overdue Follow-ups, Due Today, Upcoming / Scheduled, Completed / Cleared.
* **Card Features:** Lead name, society, scheduled time, assigned closer, one-click "Mark Contacted", "Reschedule" opening `DateTimePicker`, drag-and-drop between columns.

### Screen 17: Staff CRM: Master Operations Calendar (`SCR-17`)
* **View Switcher:** Month, Week, Day, and Agenda view modes.
* **Calendar Grid:** Displays scheduled site visits (blue cards) and client callbacks (amber cards) with client name, property reference, and quick WhatsApp action. Staff member filter dropdown.

### Screen 18: Staff CRM: Staff Directory & RBAC Desk (`SCR-18`)
* **Staff Directory Table:** Name, email, phone, active roles (`STAFF_INTAKE_AGENT`, `STAFF_VERIFICATION_AGENT`, `STAFF_LISTING_MANAGER`, `STAFF_DEAL_CLOSER`, `STAFF_SUPER_ADMIN`), and module permission pills.
* **Actions:** Invite new staff modal, edit roles modal, module permission checkboxes.

### Screen 19: Staff CRM: Business Reports & CSV Export Desk (`SCR-19`)
* **Analytics Metrics:** Monthly sales volume, average days to close (45-day SLA tracker), lead conversion funnel.
* **Export Actions:** "Export Properties CSV" and "Export Leads CSV" buttons.

### Screen 20: Staff CRM: Immutable Security Audit Logs Desk (`SCR-20`)
* **Audit Trail Table:** Timestamp, actor email, actor role, action (`STAFF_LOGIN_SUCCESS`, `LEAD_STATUS_UPDATED`, `PROPERTY_PUBLISHED`, `DELETE_USER_DATA`, etc.), target entity, target ID, client IP, and expandable JSON diff modal.

### Screen 21: Staff CRM: Settings & Admin Control Panel (`SCR-21`)
* **4 Sub-Tabs:**
  1. `Security & DPDP Erasure Queue` (`AdminErasureQueue.tsx`): Section 12 erasure requests table, statutory retention hold checks, and irreversible anonymization buttons.
  2. `Hero Banner CMS` (`HeroCmsManager.tsx`): 1920x800 banner slide manager (create, upload, reorder, toggle active).
  3. `Partner Logos CMS` (`PartnerLogosManager.tsx`): Builder channel partner logos manager (upload SVG/PNG, reorder, section heading, scroll speed).
  4. `Email Notification Templates` (`PublicationEmailManager.tsx`): Transactional HTML email template editor with desktop/mobile preview and test send tool.

---

## 6. Execution Set 3: Specialist Desks & Standalone Views

*(Continuation prompt for Stitch to complete the remaining standalone desks)*

### Screen 22: Deep Document Verification Desk (`SCR-22`)
* **Component Reference:** `DocumentVerificationDesk.tsx`
* **Purpose:** Dedicated due diligence vault inspecting uploaded sale deeds, encumbrance certificates, and tax receipts.
* **Layout:** Full-screen split layout. Left: Document hierarchy tree (Title Deed, Mother Deed, 15-Year EC, BBMP Khata, Tax Receipt). Right: Document preview viewer with SHA-256 checksum card, magic bytes validator (`VALID_PDF`), ClamAV antivirus scan badge (`CLEAN` / `INFECTED`), verification status selector (`VERIFIED`, `REJECTED`, `IN_REVIEW`), and reviewer notes textarea.

### Screen 23: Curated Buyer Discovery View (`SCR-23`)
* **Component Reference:** `BuyerDiscovery.tsx`
* **Purpose:** Faceted search and buyer property discovery desk.
* **Layout:** Left sidebar filters (BHK, Budget Slider in Crores, Possession Status, Amenities checklist). Right property listing grid with map view toggle.

---

## 7. Dynamic Data & Neutral Placeholder Rules

To maintain production data integrity, all illustrative figures must be styled as dynamic placeholders:
* **Property Prices:** Render as `₹[Asking Price in Lakhs/Crores]` (e.g. `₹ 1.25 Cr* (Illustrative)`).
* **Rates per Sq.ft:** Render as `₹[Benchmark Rate]/sq.ft`.
* **Phone Numbers:** Render as `+91 80 [Verification Helpline]` or `+91 [Desk Number]`.
* **Office Address:** Render as `[Operations Centre / Registered Office Address, Bengaluru]`.
* **RERA Marks:** Render as `[Karnataka RERA Registration Number / PRM/KA/RERA/XXXX]`.
* **45-Day Resale Turnaround:** Position as the platform's target marketing proposition, not an operational or legal warranty.

---

## 8. Explicit Continuation Prompts for Google Stitch

If Google Stitch prompts for continuation or reaches its generation limit, copy and paste the corresponding block below:

### Continuation Prompt for Execution Set 2 (Staff Operations & CRM Suite):
```text
Continue designing the SellMyGhar.in application project. Now generate Execution Set 2 covering the complete Staff Operations & CRM Suite:
1. Screen 10 (SCR-10): Staff Operations Portal Login Card.
2. Screen 11 (SCR-11): Staff CRM Overview & Executive KPI Dashboard with Command Bar and 11 navigation tabs.
3. Screen 12 (SCR-12): Staff CRM Inbound Leads Pipeline Desk with 7-stage filter chips and the Lead Detail Slide-Over Drawer.
4. Screen 13 (SCR-13): Staff CRM Property Inventory Desk and the 5-Tab PropertyEditor Modal (Basic, Pricing, Content, Images, Activity).
5. Screen 14 (SCR-14): Staff CRM Accompanied Site Visits Desk with DateTimePicker modal.
6. Screen 15 (SCR-15): Staff CRM Buyer Purchase Offers Desk with counter-offer inputs.
7. Screen 16 (SCR-16): Staff CRM Follow-up Tasks Kanban Board (4 columns) & Table Switcher.
8. Screen 17 (SCR-17): Staff CRM Master Operations Calendar (Month/Week/Day/Agenda views).
9. Screen 18 (SCR-18): Staff CRM Staff Directory & RBAC Desk.
10. Screen 19 (SCR-19): Staff CRM Business Reports & CSV Export Desk.
11. Screen 20 (SCR-20): Staff CRM Immutable Security Audit Logs Desk with JSON diff modal.
12. Screen 21 (SCR-21): Staff CRM Settings & Admin Control Panel with all 4 Sub-Tabs (Security Erasure Queue, Hero CMS, Partner CMS, Email Templates).
Strictly apply the SellMyGhar design system: #244B8F, #172033, #F4F6F9, #B68A4A, Montserrat headings, Poppins body text, and tabular figures.
```

### Continuation Prompt for Execution Set 3 (Specialist Desks & Edge States):
```text
Continue designing the SellMyGhar.in application project. Now generate Execution Set 3 covering the specialist desks and global edge states:
1. Screen 22 (SCR-22): Deep Document Verification Desk (DocumentVerificationDesk.tsx) with SHA-256 checksum card, PDF validator, ClamAV antivirus badge, and document review viewer.
2. Screen 23 (SCR-23): Curated Buyer Discovery View (BuyerDiscovery.tsx) with faceted sidebar filters and map toggle.
3. Global UI States: Listing skeleton cards, empty search states, form error banners, button loading spinners, and network retry toasts.
Strictly maintain brand tokens and verified component relationships.
```

---

*Handoff document generated from verified codebase audit. Zero application code or database schemas modified.*
