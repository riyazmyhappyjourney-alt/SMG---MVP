# Google Stitch Design Handoff — Phase 1: Foundation, Navigation & Homepage

> **STRICT DIRECTIVE FOR GOOGLE STITCH:**  
> You are designing **Phase 1** for the existing, verified web application **SellMyGhar.in** (Bengaluru Assisted Apartment Resale Platform).  
> **SCOPE LIMITATION:** Design **ONLY** the following three items in this phase:  
> 1. **SellMyGhar.in Design System Foundation** (Colors, Typography, Spacing, Borders, Shadows, Buttons, Inputs, Tables, Modals, Navigation, Responsive Rules).  
> 2. **Shared Header, Global Navigation, and DPDP-Compliant Footer** (Desktop & Mobile).  
> 3. **Desktop & Mobile Homepage (`HOME`)** with all verified functional sections.  
>  
> **DESIGN-ONLY MANDATE:** This is a UI visual design specification. **DO NOT** generate application code, modify existing component props/interfaces, alter API contracts, invent database fields, or change user journeys.

---

## 1. Product Context & Design Vision

* **Platform Purpose:** SellMyGhar.in provides high-touch, assisted apartment resale representation for homeowners in Bengaluru, Karnataka, India. It eliminates open-portal broker spam through Kaveri 2.0 registered title diligence, accompanied buyer site visits, and confidential contact shielding.
* **Aesthetic Standard:** Premium, authoritative, institutional, high-trust Indian real estate platform (comparable to curated institutional property desks).
* **Anti-Patterns to Avoid:**
  * ❌ No generic AI-generated templates with purple/neon saturated gradients.
  * ❌ No cartoonish 3D emoji icons or decorative floating blobs.
  * ❌ No excessive pill/bubble corner radii on content containers.
  * ❌ No distracting auto-playing animations that interfere with conversion.
* **Key Visual Priorities:** High contrast, crisp typography, clean data density, clear financial breakdowns, and effortless mobile usability.

---

## 2. SellMyGhar Design System Foundation

### 2.1 Color Palette & Token Roles

| Token Name | Hex Value | Primary Application |
| :--- | :--- | :--- |
| **Trust Blue (Primary)** | `#244B8F` | Primary buttons, active nav indicators, brand headings, primary icons, focus rings |
| **Trust Blue Dark** | `#1B396E` | Button hover states, top banners, dark interactive accents |
| **Trust Blue Light** | `#3264BA` | Focus outlines, subtle badge borders, secondary chips |
| **Ink (Deep Navy)** | `#172033` | Primary headings, body copy, table headers, dark UI cards, footer background |
| **Canvas (Background)** | `#F4F6F9` | Global off-white background, input background fill, secondary card backs |
| **Gold Accent (Restrained)**| `#B68A4A` | Eyebrow badges, Rosette accents, premium township highlights, footer headings |
| **Success Emerald** | `#059669` | "FREE" property posting badges, verified diligence seals, active status pills |
| **Alert / Danger Rose** | `#E11D48` | Error alerts, destructive actions, statutory hold notices |
| **Warning Amber** | `#F59E0B` | In-review notices, counter-offer tags, inspection notes |
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
* **Iconography:** Clean line icons from `lucide-react`, 1.5px to 2px stroke width. Consistent 16x16px or 20x20px container sizing.

### 2.3 Spacing, Radii & Surface Elevation

* **Grid & Spacing:** Strict 4px base grid (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`, `80px`). Max container width: `1280px` (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`).
* **Corner Radii:**
  * Content Cards: `rounded-xl` (12px) or `rounded-2xl` (16px).
  * Buttons & Form Inputs: `rounded-lg` (8px) or `rounded-xl` (10px–12px).
  * Status Pills & Tags: `rounded-full` (only for small status badges, never large cards).
* **Surface Elevation & Borders:**
  * Light Surfaces: White (`#FFFFFF`) with subtle border (`border border-slate-200/90`) and diffused elevation (`shadow-xs` / `shadow-sm`).
  * Elevated Cards: `shadow-md` on hover; avoid harsh black drop shadows.
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
  * Container: Centered white card, `rounded-2xl`, max-width `xl` (576px), max-height `85vh` with inner scrollbar. Accessible close button (`X`) top-right.
* **Responsive Breakpoints:**
  * Mobile: `< 768px` (single column, minimum 44x44px touch targets).
  * Tablet: `768px` to `1023px`.
  * Desktop: `>= 1024px`.

---

## 3. Shared Header & Global Navigation Specification

**Existing Component Reference:** [`src/components/home/Header.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/Header.tsx)

```typescript
// Verified Interface Contract:
interface HeaderProps {
  user?: UserAuthProfile | null;
  onPostPropertyClick: () => void;
  onLoginClick: () => void;
  onDashboardClick?: () => void;
  onTabClick: (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => void;
}
```

### 3.1 Desktop Header Layout (>= 1024px)
* **Bar Dimensions:** Sticky top, height 72px, `bg-white/98`, `backdrop-blur-md`, `border-b border-slate-200`, `z-50`.
* **Left Brand Identity:**
  * Official brand logo ([`Logo.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/brand/Logo.tsx), height 40px) linking to `#`.
* **Center Navigation Links (Montserrat 600, 13px):**
  * `For Owners`: Highlighted link with small blue badge ("Sell Flat") -> triggers `onTabClick('SELL')`.
  * `For Buyers`: Standard link -> triggers `onTabClick('BUY')` (scrolls to `#listings`).
  * `About`: Standard link -> triggers `onTabClick('ABOUT')` (scrolls to `#calculator`).
  * `Contact`: Standard link -> triggers `onTabClick('CONTACT')`.
* **Right Action Group:**
  * `Post property [FREE]`: High-visibility CTA button with embedded vibrant emerald `FREE` pill -> triggers `onPostPropertyClick`.
  * `User Session CTA`:
    * *Unauthenticated:* "Login / Register" with User icon -> triggers `onLoginClick`.
    * *Authenticated:* "My Dashboard" with LayoutDashboard icon in blue pill -> triggers `onDashboardClick`.

### 3.2 Mobile & Tablet Header Layout (< 1024px)
* **Bar Dimensions:** Height 64px, sticky top.
* **Left:** Brand logo (height 34px).
* **Right:**
  * Compact "Post FREE" button (height 36px).
  * Optional Dashboard icon button (if logged in).
  * Hamburger menu button (`Menu` / `X` icon, 44x44px tap target).
* **Mobile Drawer Menu (Slide-down overlay):**
  * Full-width white drawer with subtle border and shadow.
  * Prominent owner card: "For Owners (Sell Flat)" with `FREE LISTING` badge.
  * Navigation links: "For Buyers", "About", "Contact" (each >= 48px tap height).
  * Session action: "Login / Register" or "My Seller Dashboard" at bottom with top separator.

---

## 4. Shared DPDP-Compliant Footer Specification

**Existing Component Reference:** [`src/components/home/Footer.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/Footer.tsx)

```typescript
// Verified Interface Contract:
interface FooterProps {
  onNavClick: (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => void;
  onConsentPortalOpen?: () => void;
}
```

### 4.1 Visual Architecture & Layout
* **Background & Elevation:** Deep Ink `#172033` surface with subtle top border `border-slate-800`.
* **Bengaluru Cityscape Watermark:** Background graphic `bengaluru-cityscape-footer.svg` positioned at the bottom at 18% opacity behind text, layered with a dark gradient overlay ensuring 100% WCAG AAA contrast for all text.
* **5-Column Grid Structure (Desktop) / Stacked 1-Column (Mobile):**
  1. **Column 1 & 2 (Brand Authority):**
     * Logo in white rounded container (`height: 40px`).
     * Brand mission copy: "SellMyGhar is Bengaluru’s dedicated apartment resale platform. We eliminate broker spam, provide certified title due diligence, and connect verified sellers directly with serious home buyers."
     * Regulatory badge: Rosette icon + `[Karnataka RERA Registration Number / PRM/KA/RERA/XXXX]` placeholder.
  2. **Column 3 (Quick Navigation):**
     * Header: `QUICK NAVIGATION` (Gold `#B68A4A`, Montserrat Bold, 11px).
     * Links: "Buy Resale Homes", "Sell My Apartment", "About SellMyGhar", "Contact Advisory Desk", and "Frequently Asked Questions" (with `HelpCircle` icon, triggers FAQ modal).
  3. **Column 4 (Legal & Privacy):**
     * Header: `LEGAL & PRIVACY` (Gold `#B68A4A`, Montserrat Bold, 11px).
     * Links: "Privacy Policy (DPDP)", "Terms of Use", "Grievance Officer" (each triggers corresponding modal).
  4. **Column 5 (Bengaluru Advisory Desk):**
     * Header: `BENGALURU OFFICE` (Gold `#B68A4A`, Montserrat Bold, 11px).
     * Coordinates:
       * Address: `[Operations Centre / Registered Office Address, Bengaluru]` with `MapPin` icon.
       * Phone: `+91 80 [Verification Helpline]` with `Phone` icon.
       * Email: `support@sellmyghar.in` with `Mail` icon.
* **Bottom Bar:**
  * Horizontal rule `border-slate-800`.
  * Left: `© {Year} SellMyGhar Technologies Private Limited. All rights reserved.`
  * Right: `Karnataka RERA Approved Real Estate Resale Facilitator. Transparent legal due diligence & certified document verification.`

### 4.2 Legal & Informational Modals
Design the modal containers and typography for the 4 verified modal states:
1. **FAQ Modal:** Accordion layout with 5 expandable items addressing pricing, 0 upfront fees, Kaveri 2.0 valuation, existing bank loans/LOD, and accompanied site visits.
2. **Grievance Modal:** Statutory notice under DPDP Act 2023, Data Protection Officer placeholder coordinates, 24h acknowledgement / 48h resolution SLA, and link to self-serve Consent Portal.
3. **Privacy Policy Modal:** Purpose-specific processing disclosures, contact shielding guarantees, and DPDP Section 12 erasure rights.
4. **Terms of Service Modal:** Real estate representation terms and diligence tier explanations.

---

## 5. Homepage (`HOME`) Section-by-Section Design Specification

**Existing Component Reference:** [`src/components/home/HomePage.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/HomePage.tsx)

```typescript
// Verified Interface Contract:
interface HomePageProps {
  activeUser?: UserAuthProfile | null;
  onNavigateToSellerAssisted?: (localityPrefill?: string) => void;
  onNavigateToContact?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToDashboard?: () => void;
  onConsentPortalOpen?: () => void;
  onNavigateToLocality?: (slug: string) => void;
}
```

The homepage consists of 6 sequential sections from top to bottom:

---

### Section 1: Hero & Quick Intake Wizard (`Hero.tsx`)

* **Background:** High-resolution residential township backdrop with dark gradient overlay (`from-slate-950/90 via-slate-950/70 to-slate-950/40`). Slide navigation chevrons and indicator dots (auto-advancing every 6s, pauses on hover).
* **Desktop Split Layout (Height ~640px):**
  * **Left Column (Headline & Proposition):**
    * Eyebrow: Trust Blue capsule `BENGALURU RESIDENTIAL RESALE`.
    * H1 Headline: **"Sell your flat in 45 days."** (Extra-Bold Montserrat, 52px–56px, White).
    * Subhead: "A structured resale process with Kaveri 2.0 deed benchmarking, legal title diligence, and pre-screened buyers across Bengaluru apartment corridors."
    * Action CTAs:
      * Primary: "Sell My Flat" (Trust Blue `#244B8F`, arrow icon).
      * Secondary: "Browse Verified Flats" (Glassmorphic white/10, border white/20).
    * Demand Ticker Capsule: Vertical rolling ticker displaying `"Active buyer demand in:"` cycling smoothly through 11 Bengaluru localities (Hebbal, Whitefield, HSR Layout, Sarjapur Road, etc.).
  * **Right Column (Marketplace Intake Card):**
    * Elevated white card (`rounded-2xl`, max-width `480px`, crisp shadow, `p-6`).
    * Tab Bar: `Sell Flat` (Active with blue underline), `Buy Resale`, `Rent` + green `Post Property FREE` tag.
    * Controls:
      1. BHK Dropdown: Select options (`1 BHK`, `2 BHK`, `2.5 BHK`, `3 BHK`, `3.5 BHK`, `4 BHK+ Penthouse`).
      2. Society Autocomplete Search: Input with search icon `Search society (e.g. Prestige Shantiniketan, Sobha Dream Acres...)`. Displays floating suggestion dropdown (top 6 results) with society name and locality.
      3. Primary Action Button: Trust Blue button **"Get 45-Day Plan"** with arrow icon.
    * Quick Society Pills: Clickable pills for popular societies (`Prestige Shantiniketan`, `Sobha Dream Acres`, `Brigade Gateway`, `Godrej Woodsman`).
    * Secondary Link: `"Looking to buy instead? Browse verified homes"`.
* **Mobile Hero Adaptations (< 768px):**
  * Stacked vertical flow.
  * H1 scales to 32px.
  * Marketplace card becomes full-width, clean form with touch-friendly selectors.

---

### Section 2: Trusted Builder Channel Partners Marquee (`TrustedPartnersMarquee.tsx`)

* **Container:** Full-width white section, height ~80px–90px, border-y `border-slate-200`.
* **Heading:** `"TRUSTED CHANNEL PARTNERS OF"` (Uppercase, slate-500, Montserrat Bold 11px, letter-spaced).
* **Marquee Ribbon:**
  * Continuous horizontal marquee with edge gradient fade masks (`from-white to-transparent`).
  * Builder partner logo cards: Godrej Properties, Brigade Group, Sobha Realty, Prestige Group.
  * Logos rendered in uniform cards (`h-12`, `min-w-[160px]`, `object-contain`).
  * Hover pauses the marquee. Complies with `prefers-reduced-motion` (switches to static horizontal grid).

---

### Section 3: Financial Cost of an Unsold Flat Calculator (`HoldingCostCalculator.tsx`)

* **Section Purpose:** Demonstrates carrying costs (maintenance, foregone rent, brokerage) to motivate homeowners toward realistic pricing and assisted selling.
* **Container:** Off-white canvas `#F4F6F9`, py-14, max-w-5xl card container.
* **Section Header:**
  * Eyebrow: `COST OF AN UNSOLD FLAT` (Gold `#B68A4A`).
  * H2: **"Calculate the Real Cost of Holding an Unsold Apartment"**
  * Description: "Every month a property sits unsold in Bengaluru carries compounding holding costs."
* **Desktop 2-Column Calculator Card:**
  * **Left Column (Inputs, 7 cols):**
    * Expected Asking Price input (Displays live formatted currency: `₹[Asking Price]`).
    * 2-column row: Super Built-up Area (`sq.ft`) + Society Maintenance Rate (`₹/sq.ft/mo`).
    * Occupancy Selector: Segmented control (`Vacant` vs `Tenanted`). If Vacant, displays `Monthly Expected Rent` input.
    * Holding Period Selector: 4-button group (`6 Months`, `9 Months`, `12 Months`, `18 Months`).
  * **Right Column (Results Summary Card, 5 cols):**
    * Card surface: Deep Navy `#172033` with crisp border.
    * Itemized breakdown:
      * Maintenance Cost: `₹[Maintenance Total]`
      * Foregone Rent: `₹[Rent Total]`
      * Assumed Brokerage at 2%: `₹[Brokerage Total]`
    * Grand Total Block: Prominent bold figure `₹[Total Carrying Cost]` + caption `"Based on [X] months of holding before closing a sale."`
    * Information note with `Info` icon explaining Kaveri 2.0 deed benchmarking.
    * Action CTA: "Explore Selling Options" (Trust Blue button).

---

### Section 4: Verified Resale Inventory Grid (`ListedProperties.tsx`)

* **Anchor ID:** `#listings`
* **Section Header:**
  * Eyebrow: Rosette icon + `VERIFIED RESALE INVENTORY`
  * H2: **"Featured Apartments for Sale"**
  * Subhead: "Every listed apartment undergoes Sub-Registrar deed checking, physical inspection, and direct owner verification."
* **Filters Bar:**
  * BHK Filter Chips: Horizontal scrollable chips (`All BHKs`, `1 BHK`, `2 BHK`, `2.5 BHK`, `3 BHK`, `3.5 BHK`, `4 BHK+`).
  * Locality Filter Dropdown: Quick filter across micro-markets.
* **3-Column Property Card Grid (Desktop) / 1-Column (Mobile):**
  * **Card Specification:**
    * Surface: White card, `rounded-xl`, border `border-slate-200`, subtle hover lift (`shadow-md`).
    * Media Box (16:10 ratio):
      * High-resolution photo with subtle zoom on hover.
      * Top-left: Glassmorphic Rosette badge with emerald text: `"Verified"`.
      * Top-right: Dark pill with BHK type (e.g. `"3 BHK"`).
      * Bottom Asking Price Overlay: Solid dark navy bar (`#172033/95`) showing asking price `₹[Asking Price in Lakhs/Crores]` and rate `₹[Rate]/sq.ft`.
    * Card Body:
      * Project Name (Montserrat Bold, 16px).
      * Locality with MapPin icon (`text-slate-500`, 12px).
      * 3-Attribute Metric Strip:
        * SBUA Area (`sq.ft`) with `Maximize` icon.
        * Facing (e.g. `East`, `North-East`) with `Compass` icon.
        * Floor Band (e.g. `Mid Floor`, `High Floor`) with `BedDouble` icon.
      * Dual Action Buttons:
        * Primary: "View Property" (`#244B8F`, arrow icon) -> opens detail view.
        * Secondary: "Quick Enquiry" (slate-100 button with phone icon) -> opens contact modal.
* **Loading State:** 3 skeleton cards with pulsing gray image containers, text placeholders, and button rectangles.
* **Empty State:** Clean centered card when 0 properties match filters: "No apartments match your selected filters" with a "Reset Filters" action button.

---

### Section 5: Bengaluru Locality Micro-Markets Grid (`BengaluruLocalitiesSection.tsx`)

* **Section Header:**
  * Eyebrow: Compass icon + `BENGALURU RESIDENTIAL RESALE MICRO-MARKETS`
  * H2: **"Key Bengaluru Resale Hubs We Specialize In"**
  * Copy: "Direct homeowner representation across 11 high-liquidity apartment corridors. Clear documentation diligence, realistic Kaveri 2.0 valuation benchmarks, and pre-screened buyers."
* **Zone Filter Tabs:**
  * Tabs: `All`, `North Bengaluru`, `East Bengaluru`, `South Bengaluru`, `Central Bengaluru`.
* **Locality Card Grid (3-4 columns desktop, 1 column mobile):**
  * 11 Micro-Markets: *Hebbal, Thanisandra, Yelahanka, Jakkur, Hennur, Whitefield, Sarjapur Road, Bellandur, HSR Layout, JP Nagar, Indiranagar*.
  * Card Details:
    * Locality Name & Zone.
    * Indicative Price Band: `₹[Band Low] - ₹[Band High] Cr`.
    * Benchmark Rate: `₹[Rate]/sq.ft`.
    * Key Gated Societies list (e.g. Prestige, Sobha, Brigade).
    * Link: `"Explore Resale in [Locality]"` with arrow icon.

---

### Section 6: High-Contrast Seller Conversion Callout (`SellerConversionCard.tsx`)

* **Container:** Max-w-7xl, py-14 sm:py-20.
* **Banner Surface:** Deep Navy gradient banner (`#172033` via `#1E2E4B` to `#244B8F`), `rounded-3xl`, p-8 sm:p-14, subtle ambient radial highlight.
* **Content:**
  * Eyebrow: `ShieldCheck` icon + `Transparent Bengaluru Residential Resale` (Gold/Amber pill).
  * Headline (H2): **"Your Bengaluru Flat Deserves a Clear Selling Plan."**
  * Supporting Copy: "Avoid endless broker phone spam, speculative low-ball offers, and document confusion. SellMyGhar pairs dedicated homeowner representation with verified Kaveri 2.0 title diligence and qualified direct buyers across Bengaluru’s key apartment corridors."
  * 3 Trust Pillars (Pill cards):
    1. `Zero Upfront Listing Fee` (CheckCircle2 icon).
    2. `Confidential Phone Protection` (Lock icon).
    3. `Screened Apartment Buyers` (Building icon).
  * Dual Action CTAs:
    * Primary: **"Start Selling My Flat"** (White button, dark text, with emerald `FREE ONBOARDING` pill).
    * Secondary: **"Speak to Our Team"** (Glassmorphic outlined button).

---

## 6. Interaction, State & Accessibility Requirements

### 6.1 State Matrix Required for Stitch Designs

| Element | Default State | Hover / Focus State | Active / Loading State | Error / Disabled State |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Buttons** | `#244B8F`, text white | `#1B396E`, slight shadow | Scale 0.98; spinner when loading | 50% opacity, cursor not-allowed |
| **Society Search** | Slate-300 border, placeholder | `#244B8F` border + 2px focus ring | Dropdown list visible | Red border + helper text on error |
| **Property Card** | White, border-slate-200 | Border-slate-300, shadow-md, image zoom 1.03 | Focus-visible outline on CTAs | Skeleton card during initial fetch |
| **Calculator Inputs** | White/Canvas, slate-300 border | `#244B8F` border, active value | Instant recalculation on keystroke | Clamped to non-negative numbers |
| **Footer Modals** | Closed / Hidden | Trigger button hover underline | Backdrop blur, modal fade-in | Escape key or X button closes |

### 6.2 Accessibility & Mobile Standards
1. **Touch Targets:** All interactive elements, tabs, filters, and buttons must measure at least **44x44px** on mobile viewports.
2. **Color Contrast:** All body text must maintain a minimum contrast ratio of **4.5:1** against backgrounds; large headings must maintain at least **3:1** (WCAG AA).
3. **Focus Indicators:** Visible focus rings (`focus-visible:ring-2 focus-visible:ring-[#3264BA]`) on all interactive controls.
4. **Reduced Motion:** Respect `prefers-reduced-motion` by replacing infinite marquee translations with static horizontally scrollable grids.

---

## 7. Dynamic Data & Neutral Placeholder Rules

To prevent unverified assumptions from becoming embedded in visual designs:
* **Property Prices:** Render as `₹[Asking Price in Lakhs/Crores]` or use explicit prototype flags (e.g. `₹ 1.25 Cr* (Illustrative)`).
* **Rates per Sq.ft:** Render as `₹[Benchmark Rate]/sq.ft`.
* **Phone Numbers:** Use `+91 80 [Verification Helpline]` or `+91 [Desk Number]`. Never expose private numbers.
* **Office Address:** Render as `[Operations Centre / Registered Office Address, Bengaluru]`.
* **RERA Marks:** Render as `[Karnataka RERA Registration Number / PRM/KA/RERA/XXXX]`.
* **45-Day Statement:** Position as the platform's target marketing proposition, not an operational or legal guarantee.

---

## 8. Decisions Requiring User Approval Before Phase 2

Before proceeding to Phase 2 (Property Details, Locality SEO Pages, Seller Multi-Step Funnel, and CRM Suite), the following design decisions must be approved by the project owner:

1. **Hero Background Visual Style:** Does the owner prefer a multi-slide photography carousel of real Bengaluru townships, or a singular, static hero image with dark contrast overlay?
2. **Marketplace Card Placement on Mobile:** Should the quick intake card appear directly beneath the hero headline on mobile, or collapse into a bottom sticky bar / drawer?
3. **Calculator Placement:** Is the current placement (Section 3, between Builder Marquee and Property Listings) optimal for conversion, or should it move lower, closer to the Seller Conversion Card?
4. **Locality Micro-Markets Display:** Should all 11 Bangalore localities be visible on the homepage as a filterable grid (as specified in Section 5), or should they be presented as a compact carousel linking to dedicated pages?
5. **Mobile Navigation Drawer Style:** Fullscreen dark drawer vs compact slide-down white menu?

---

*Handoff document prepared from reviewed codebase audit. Zero application code or database schemas modified.*
