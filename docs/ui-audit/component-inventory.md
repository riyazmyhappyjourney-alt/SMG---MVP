# SellMyGhar.in - Reusable Component Inventory & Design Tokens

**Audit Date:** October 2026  
**Auditor:** Senior React/TypeScript Engineer & UI Design Systems Specialist  
**Repository Scope:** All components in `src/components/`, design tokens in `src/index.css`, utility functions, and static assets.

---

## 1. Design Tokens & Styling Architecture

The existing application styling is built on Tailwind CSS v4 using the `@theme` block defined in [`src/index.css`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/index.css):

### Color Tokens

| Token Name | CSS Variable | Hex Code | Existing Role / Usage | Proposed Redesign Role |
| :--- | :--- | :--- | :--- | :--- |
| **Trust Blue (Primary)** | `--color-trust-blue` | `#244B8F` | Brand primary, action buttons, active tabs, links | **Primary Brand Color**: Primary buttons, links, active states, key headings |
| **Trust Blue Dark** | `--color-trust-blue-dark` | `#1B396E` | Hover states, gradient mid-tones, card borders | Primary button hover, high-contrast dark accents |
| **Trust Blue Light** | `--color-trust-blue-light` | `#3264BA` | Accents, badges, focus outlines | Focus rings, subtle icon badges, secondary chips |
| **Ink (Text Primary)** | `--color-ink` | `#172033` | Deep navy primary text, dark banners, modal headers | **Primary Text Color**: Titles, body text, table headers, dark surfaces |
| **Canvas (Background)** | `--color-canvas` | `#F4F6F9` | Neutral slate background across all public and CRM pages | **Global Background**: Off-white canvas, input background, secondary card backing |
| **Gold Accent (Restrained)**| Custom Utility | `#B68A4A` | Eyebrow badges, luxury highlights, footer headings | **Restrained Accent**: Rosette accents, premium tier badges, VIP milestones |
| **Emerald (Success)** | Tailwind `emerald-600` | `#059669` | "FREE" badges, verified indicators, active statuses | System success, active badges, OTP verified pills |
| **Rose (Danger / Alert)** | Tailwind `rose-600` | `#E11D48` | Overdue follow-up tags, erasure warnings, error banners | Error alerts, rejection actions, statutory hold warnings |
| **Amber (Warning)** | Tailwind `amber-500` | `#F59E0B` | Pending review badges, grievance links, inspection notes | In-review badges, counter-offer notices |

### Typography Tokens

| Token Name | Font Family | Existing Usage | Proposed Redesign Standard |
| :--- | :--- | :--- | :--- |
| **Heading Font** | `var(--font-heading)` / `'Montserrat'` | `h1`, `h2`, `h3`, `h4`, `h5`, `h6` throughout public pages | **Montserrat** (Weights: 600 Semi-Bold, 700 Bold, 800 Extra-Bold). Letter-spacing: `-0.025em`. |
| **Body Font** | `var(--font-body)` / `'Poppins'` | Paragraphs, tables, input fields, badges, footers | **Poppins** (Weights: 400 Regular, 500 Medium, 600 Semi-Bold). Tabular numbers on currencies. |
| **CRM Font** | `var(--font-crm)` / `'Poppins'` | CRM tables, kanban cards, calendar agenda items | **Poppins** (Weights: 400, 500, 600, 700). High legibility for dense data grids. |

### Global Animations & Keyframes (`src/index.css`)
1. `animate-partner-marquee`: Horizontal linear infinite translation (`partnerMarquee` 22s/24s) with hover pause.
2. `animate-location-ticker`: Continuous horizontal translation for micro-markets ticker.
3. `animate-vertical-locality-roll`: Smooth vertical translation across 14 items using `cubic-bezier(0.65, 0, 0.35, 1)`.
4. `prefers-reduced-motion`: Media query that disables all continuous loops and translates for accessibility.

---

## 2. Reusable Component Catalog

---

### Category A: Navigation & Header Components

#### 1. Public Header (`Header.tsx`)
- **File:** [`src/components/home/Header.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/Header.tsx)
- **Purpose:** Sticky top navigation for all public consumer pages. Displays brand logo, audience-segmented navigation tabs, 99acres-style "Post property FREE" CTA button, and dynamic user session state (Login / Register or My Dashboard).
- **Props:**
  ```typescript
  interface HeaderProps {
    user?: UserAuthProfile | null;
    onPostPropertyClick: () => void;
    onLoginClick: () => void;
    onDashboardClick?: () => void;
    onTabClick: (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => void;
  }
  ```
- **State:** `mobileMenuOpen` (boolean).
- **Dependencies:** `Logo.tsx`, `lucide-react` (`Menu`, `X`, `User`, `LayoutDashboard`).
- **Responsive Behavior:**
  - Desktop (>= 1024px): Horizontal nav tabs with active indicators, Post property button, Login/Dashboard button.
  - Tablet (768px - 1023px): Collapses nav tabs; retains Post property button and Login button.
  - Mobile (< 768px): Compact "Post FREE" pill + hamburger toggle button opening a slide-down mobile drawer.

#### 2. CRM Navigation Bar & Sidebar (`CrmDashboard.tsx`)
- **File:** [`src/components/crm/CrmDashboard.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/crm/CrmDashboard.tsx)
- **Purpose:** Operational navigation system for staff. Includes top action bar (Global Search, Role Switcher for dev testing, Active User badge, Logout button) and 11-module primary tab bar.
- **Modules Handled:** `OVERVIEW`, `LEADS`, `PROPERTIES`, `VISITS`, `OFFERS`, `TASKS`, `CALENDAR`, `TEAM`, `REPORTS`, `AUDIT`, `SETTINGS`.

---

### Category B: Footer & Compliance Modals

#### 3. DPDP-Compliant Public Footer (`Footer.tsx`)
- **File:** [`src/components/home/Footer.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/Footer.tsx)
- **Purpose:** Deep-footer anchoring brand authority. Displays Bengaluru cityscape watermark background, 5-column navigation, office coordinates, RERA registration, and triggers 4 legal/informative modals.
- **Props:**
  ```typescript
  interface FooterProps {
    onNavClick: (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => void;
    onConsentPortalOpen?: () => void;
  }
  ```
- **State:** `modalType` (`'PRIVACY' | 'TERMS' | 'GRIEVANCE' | 'FAQ' | null`), `openModalFaqIndex` (`number | null`).
- **Embedded Modals:**
  - `FAQ` Modal: 5 comprehensive expandable questions addressing pricing, fees, loans, visits, and classifieds differences.
  - `PRIVACY` Modal: DPDP Act (2023) Section 6 Notice, lawful processing purposes, and Section 12 erasure rights.
  - `TERMS` Modal: Real estate representation terms of use.
  - `GRIEVANCE` Modal: Data Protection & Grievance Officer coordinates (S. Sundaram, grievance@sellmyghar.in).
- **Watermark Layer:** SVG graphic `bengaluru-cityscape-footer.svg` rendered at 18% opacity behind footer text with an overlay gradient ensuring full WCAG AAA contrast.

---

### Category C: Brand & Verification Assets

#### 4. Brand Logo Component (`Logo.tsx`)
- **File:** [`src/components/brand/Logo.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/brand/Logo.tsx)
- **Purpose:** Renders the official SellMyGhar logo image (`/logo.png`) with customizable height and alt text.
- **Props:** `className?: string; height?: number | string; alt?: string;` (default height: 44px).

#### 5. Rosette Verification Badge
- **Asset:** [`public/images/verified-rosette-badge.svg`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/public/images/verified-rosette-badge.svg)
- **Purpose:** Official visual seal of legal verification. Displayed on listing cards, detail pages, and property headers.

---

### Category D: Hero & Interactive Elements

#### 6. Marketplace Hero Banner (`Hero.tsx`)
- **File:** [`src/components/home/Hero.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/Hero.tsx)
- **Purpose:** The high-conversion centerpiece of the homepage.
- **Features:**
  - Dynamic photographic carousel layer (1920x800) with semi-transparent dark overlay.
  - 45-Day USP Headline: "Sell your flat in 45 days."
  - Controlled vertical locality rolling capsule (advancing every 2.4s through 11 micro-markets).
  - 99acres-inspired quick action card: Tab switcher (Sell Flat / Buy Resale / Rent), BHK configuration dropdown (1 to 4 BHK+), Society search autocomplete with highlighted selections, "Get 45-Day Plan" primary submit button.
  - Popular society quick-select pills (Prestige Shantiniketan, Sobha Dream Acres, Brigade Gateway, Godrej Woodsman).
- **Props:**
  ```typescript
  interface HeroProps {
    onSellClick: () => void;
    onExploreClick: () => void;
    onUnderstandProcessClick?: () => void;
  }
  ```

#### 7. Trusted Builder Partners Marquee (`TrustedPartnersMarquee.tsx`)
- **File:** [`src/components/home/TrustedPartnersMarquee.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/TrustedPartnersMarquee.tsx)
- **Purpose:** Continuous infinite horizontal marquee showcasing channel partner relationships with tier-1 Bengaluru developers (Godrej Properties, Brigade Group, Sobha Realty, Prestige Group).
- **Features:** Edge gradient masks for seamless fade; pause-on-hover; dynamic speed adjustment from CMS settings (`slow`, `normal`, `fast`).

---

### Category E: Financial Calculators & Decision Tools

#### 8. Financial Holding Cost Calculator (`HoldingCostCalculator.tsx`)
- **File:** [`src/components/home/HoldingCostCalculator.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/HoldingCostCalculator.tsx)
- **Purpose:** Interactive educational tool calculating the hidden financial drain of an unsold vacant apartment.
- **Props:**
  ```typescript
  interface HoldingCostCalculatorProps {
    onExploreSellingOptions?: () => void;
  }
  ```
- **Inputs:**
  - Expected Asking Price (Default: ₹1,08,00,000)
  - Super Built-up Area in sq.ft (Default: 1,461 sq.ft)
  - Society Maintenance Rate (Default: ₹5/sq.ft/mo)
  - Occupancy Status (Vacant vs Tenanted toggle)
  - Foregone Monthly Rent if Vacant (Default: ₹40,000)
  - Holding Period Selector (6, 9, 12, 18 Months; Default: 12 Months)
  - Standard Brokerage Rate (2.0%)
- **Calculated Outputs:**
  - Total Maintenance Cost: `Area * Rate * Months` (e.g. ₹87,660)
  - Total Foregone Rent: `Monthly Rent * Months` (e.g. ₹4,80,000)
  - Anticipated Brokerage: `Property Value * 2%` (e.g. ₹2,16,000)
  - Combined Illustrative Cost: ₹7,83,660.
- **Formatting:** Indian numbering format (`formatIndianNumberFull`) with tabular numbers (`tabular-nums`) to prevent layout shift.

---

### Category F: Property Grids & Presentation Cards

#### 9. Verified Resale Inventory Grid (`ListedProperties.tsx`)
- **File:** [`src/components/home/ListedProperties.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/ListedProperties.tsx)
- **Purpose:** Filterable property showcase displaying verified active homes.
- **Card Features:** Rosette verified badge, BHK tag, solid dark bottom asking price bar (no low-contrast gradients), SBUA area, Facing, Floor band, View Property CTA link, Quick Enquiry button.
- **Props:**
  ```typescript
  interface ListedPropertiesProps {
    onSelectProperty: (projectName: string, locality: string, bhkType: any) => void;
  }
  ```

#### 10. Bengaluru Micro-Markets Grid (`BengaluruLocalitiesSection.tsx`)
- **File:** [`src/components/home/BengaluruLocalitiesSection.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/BengaluruLocalitiesSection.tsx)
- **Purpose:** 11-locality responsive grid segmented by zones (North, East, South, Central). Displays indicative price bands, corridor rate/sqft, and top 3 gated communities per hub.

#### 11. High-Contrast Seller Conversion Card (`SellerConversionCard.tsx`)
- **File:** [`src/components/home/SellerConversionCard.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/SellerConversionCard.tsx)
- **Purpose:** High-impact call-to-action section highlighting trust pillars: Zero Upfront Listing Fee, Confidential Phone Protection, Screened Apartment Buyers.

---

### Category G: Forms, Pickers & Autocomplete Controls

#### 12. Dual-Intent Lead Capture Component (`LeadCapture.tsx`)
- **File:** [`src/components/home/LeadCapture.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/LeadCapture.tsx)
- **Purpose:** Primary lead intake component used on both Contact page and Homepage.
- **Inputs:** Intent toggle (Sell vs Buy), Full Name, 10-digit Phone, Society Name, Locality Name, BHK Type selector, Built-up Area.
- **Validation:** 10-digit Indian mobile validation (`/^[6-9]\d{9}$/`), full name minimum length.
- **Confirmation State:** Instant transformation into Reference ID card (`SMG-YYYY-XXXX`) with WhatsApp direct launch.

#### 13. Accessible Date & Time Picker Modal (`DateTimePicker.tsx`)
- **File:** [`src/components/common/DateTimePicker.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/common/DateTimePicker.tsx)
- **Purpose:** Accessible scheduling modal used across CRM site visits and follow-up task rescheduling.
- **Props:**
  ```typescript
  export interface DateTimePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (dateStr: string, timeStr: string, combinedIso: string) => void;
    initialDate?: string; // 'YYYY-MM-DD'
    initialTime?: string; // '11:00 AM'
    title?: string;
    minDate?: string;
    allowPastDates?: boolean;
  }
  ```
- **Features:** Quick time presets (`10:00 AM`, `11:00 AM`, `02:00 PM`, etc.), interactive monthly calendar matrix, hour/minute selectors, past-date disabling.

---

### Category H: Milestone & Lifecycle Trackers

#### 14. 6-Milestone Property Progress Tracker (`SellerDashboard.tsx`)
- **File:** [`src/components/seller/SellerDashboard.tsx#L194-L350`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/seller/SellerDashboard.tsx)
- **Purpose:** Horizontal connected milestone progress rail for sellers.
- **Milestones Enforced:**
  1. `NEW` (Uploaded & Digitized)
  2. `CONTACTED` (RM Assigned)
  3. `FOLLOW_UP` (Due Diligence in Progress)
  4. `SITE_VISIT` (Accompanied Visits)
  5. `NEGOTIATION` (Offer & Pricing)
  6. `CONVERTED` (Sale Completed)
- **Visual Design:**
  - Base connecting horizontal rail in slate-200.
  - Active emerald/blue gradient fill line indicating completed percentage.
  - Circular milestone dots with checkmarks for completed, pulsating ping effect for current milestone, and real recorded event timestamps.

---

### Category I: Operational Drawers, Dialogs & CMS Managers

#### 15. Property Editor Lifecycle Modal (`PropertyEditor.tsx`)
- **File:** [`src/components/crm/PropertyEditor.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/crm/PropertyEditor.tsx)
- **Purpose:** Master modal for creating, updating, and transitioning property listings.
- **Tabs:** `BASIC` (Specifications), `PRICING` (Financials), `CONTENT` (Descriptions & Amenities), `IMAGES` (Gallery upload & reordering), `ACTIVITY` (Audit log).

#### 16. Admin Erasure Review Queue (`AdminErasureQueue.tsx`)
- **File:** [`src/components/crm/AdminErasureQueue.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/crm/AdminErasureQueue.tsx)
- **Purpose:** DPDP Section 12 Right to Erasure review queue with statutory hold checks.

#### 17. Follow-up Tasks Kanban Module (`TasksKanbanModule.tsx`)
- **File:** [`src/components/crm/TasksKanbanModule.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/crm/TasksKanbanModule.tsx)
- **Purpose:** Table and Kanban views for staff follow-ups with drag-and-drop support.

#### 18. Operations Calendar Module (`CalendarModule.tsx`)
- **File:** [`src/components/crm/CalendarModule.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/crm/CalendarModule.tsx)
- **Purpose:** Month, Week, Day, Agenda schedule consolidating site visits and client callbacks.

#### 19. Hero Slides CMS Manager (`HeroCmsManager.tsx`)
- **File:** [`src/components/crm/HeroCmsManager.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/crm/HeroCmsManager.tsx)
- **Purpose:** Uploads, edits, reorders, and activates 1920x800 homepage hero slides.

#### 20. Partner Logos CMS Manager (`PartnerLogosManager.tsx`)
- **File:** [`src/components/crm/PartnerLogosManager.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/crm/PartnerLogosManager.tsx)
- **Purpose:** Manages builder channel partner logos, section heading, and marquee scroll speed.

#### 21. Publication Email Manager (`PublicationEmailManager.tsx`)
- **File:** [`src/components/crm/PublicationEmailManager.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/crm/PublicationEmailManager.tsx)
- **Purpose:** Edits transactional HTML email templates, renders live mobile/desktop previews, and sends test emails.
