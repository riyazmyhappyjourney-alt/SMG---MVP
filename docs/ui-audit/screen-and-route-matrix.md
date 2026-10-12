# SellMyGhar.in - Complete Screen and Route Inventory Matrix

**Audit Date:** October 2026  
**Auditor:** Senior Product Architect, React/TypeScript Engineer & UX Specialist  
**Verification Method:** Direct AST & line-by-line inspection of React components, hooks, router mappings, and server handlers.

---

## Screen Inventory Index

| Screen ID | Screen Name | Route / URL Path | Permitted Roles | Module / Context | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **SCR-01** | Public Homepage & Resale Discovery | `/` or `#/` (`HOME`) | Public (All) | Consumer Discovery | Verified |
| **SCR-02** | Verified Property Detail Page | `/property/:id` or `#/property/:id` (`PROPERTY_DETAIL`) | Public (All) | Consumer Property View | Verified |
| **SCR-03** | Programmatic Locality SEO Landing Pages | `/sell-flat-in-:slug-bangalore` or `#/sell-flat-in-:slug-bangalore` (`LOCALITY_DETAIL`) | Public (All) | Micro-Market SEO | Verified |
| **SCR-04** | Seller Assisted Multi-Step Funnel | `/seller-assisted`, `/post-property`, `#/seller-assisted` (`SELLER_ASSISTED`) | Public / Registered Seller | Property Intake Wizard | Verified |
| **SCR-05** | Customer Auth & Registration Portal | `/login`, `/register`, `#/login` (`LOGIN`) | Public (Unauthenticated) | Consumer Authentication | Verified |
| **SCR-06** | OAuth Authorization Callback Handler | `/auth/callback`, `#/auth/callback` (`AUTH_CALLBACK`) | Public (In-Flight OAuth) | Identity Exchange | Verified |
| **SCR-07** | Authenticated Seller Management Dashboard | `/dashboard`, `/seller-dashboard`, `#/dashboard` (`DASHBOARD`) | Authenticated `OWNER` / `BUYER` | Homeowner Management | Verified |
| **SCR-08** | Advisory Desk & Contact Us Page | `/contact`, `#/contact` (`CONTACT`) | Public (All) | Inquiry & Office Desk | Verified |
| **SCR-09** | DPDP Statutory Consent Portal | `/consent`, `#/consent` (`CONSENT`) | Public / Consumer | Statutory Compliance | Verified |
| **SCR-10** | Staff Operations Portal Login | `/crm` or `#/crm` (Unauthenticated) | Staff Credentials Only | Internal Gatekeeper | Verified |
| **SCR-11** | Staff CRM: Overview & KPI Dashboard | `/crm` (`OVERVIEW` Tab) | Staff (`OVERVIEW` Module) | Executive Operations | Verified |
| **SCR-12** | Staff CRM: Inbound Leads Pipeline | `/crm` (`LEADS` Tab) | Staff (`LEADS` Module) | Lead Management | Verified |
| **SCR-13** | Staff CRM: Property Inventory & Editor | `/crm` (`PROPERTIES` Tab) | Staff (`PROPERTIES` Module) | Listing Merchandising | Verified |
| **SCR-14** | Staff CRM: Accompanied Site Visits Desk | `/crm` (`VISITS` Tab) | Staff (`VISITS` Module) | Field Inspections | Verified |
| **SCR-15** | Staff CRM: Buyer Purchase Offers Desk | `/crm` (`OFFERS` Tab) | Staff (`OFFERS` Module) | Deal Negotiation | Verified |
| **SCR-16** | Staff CRM: Follow-up Tasks Kanban & Table | `/crm` (`TASKS` Tab) | Staff (`TASKS` Module) | Daily Task Workflow | Verified |
| **SCR-17** | Staff CRM: Master Operations Calendar | `/crm` (`CALENDAR` Tab) | Staff (`CALENDAR` Module) | Operational Schedule | Verified |
| **SCR-18** | Staff CRM: Staff Directory & RBAC Desk | `/crm` (`TEAM` Tab) | Super Admin (`TEAM` Module) | Administration | Verified |
| **SCR-19** | Staff CRM: Business Reports & CSV Export | `/crm` (`REPORTS` Tab) | Staff (`REPORTS` Module) | Analytics & Export | Verified |
| **SCR-20** | Staff CRM: Immutable Security Audit Logs | `/crm` (`AUDIT_LOGS` Tab) | Staff (`AUDIT_LOGS` Module) | Compliance & Audit | Verified |
| **SCR-21** | Staff CRM: Settings & Admin Control Panel | `/crm` (`SETTINGS` Tab) | Super Admin / Listing Manager | CMS & Security Queue | Verified |
| **SCR-22** | Standalone: Deep Document Verification Desk | Component: `DocumentVerificationDesk.tsx` | Staff Verifier / Super Admin | Legal Title Vault | Standalone |
| **SCR-23** | Standalone: Curated Buyer Discovery View | Component: `BuyerDiscovery.tsx` | Public / Buyer | Alternative Discovery | Standalone |

---

## Detailed Screen Specifications

---

### SCR-01: Public Homepage & Resale Discovery

1. **Screen Name and Purpose:**  
   Public Homepage for SellMyGhar.in. Serves as the primary public entry point, communicates the core commercial value proposition ("Sell your flat in 45 days"), displays verified builder channel partner credentials, provides an interactive holding cost calculator, showcases curated verified resale apartments, and routes users into seller onboarding or property inspection journeys.
2. **Route or URL Path:**  
   Path: `/` | Hash: `#/` or empty | Identifier: `HOME`.
3. **User Role Permitted:**  
   Public (Unauthenticated and Authenticated users).
4. **Layout and Navigation Structure:**  
   - Sticky Top Header (`Header.tsx`) with brand logo, desktop navigation tabs (For Owners, For Buyers, About, Contact), "Post property FREE" CTA button, and authentication status toggle (Login/Register or My Dashboard).
   - Main content scroll stack:
     1. Hero section with background photographic carousel, 45-day USP copy, rolling locality demand indicator, and 99acres-inspired quick marketplace intake card.
     2. Trusted Builder Partners Marquee (`TrustedPartnersMarquee.tsx`).
     3. Financial Holding Cost Calculator (`HoldingCostCalculator.tsx`).
     4. Verified Resale Inventory Grid (`ListedProperties.tsx` under `#listings`).
     5. 11-Micro-Market Locality Grid (`BengaluruLocalitiesSection.tsx`).
     6. High-contrast Seller Conversion Banner (`SellerConversionCard.tsx`).
   - Sticky DPDP-compliant Footer (`Footer.tsx`) with Bengaluru cityscape watermark, FAQ accordion modal, office details, and legal compliance links.
5. **Existing Components and Shared Dependencies:**  
   - [`src/components/home/HomePage.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/HomePage.tsx)
   - [`src/components/home/Header.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/Header.tsx)
   - [`src/components/home/Hero.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/Hero.tsx)
   - [`src/components/home/TrustedPartnersMarquee.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/TrustedPartnersMarquee.tsx)
   - [`src/components/home/HoldingCostCalculator.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/HoldingCostCalculator.tsx)
   - [`src/components/home/ListedProperties.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/ListedProperties.tsx)
   - [`src/components/home/BengaluruLocalitiesSection.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/BengaluruLocalitiesSection.tsx)
   - [`src/components/home/SellerConversionCard.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/SellerConversionCard.tsx)
   - [`src/components/home/Footer.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/Footer.tsx)
   - Dependencies: `lucide-react`, `bengaluruData.ts`, `localitySeoData.ts`, `formatters.ts`, `analytics.ts`.
6. **Data Displayed and Its Source:**  
   - Dynamic Hero Slides: Fetched from `GET /api/cms/hero-slides` (with fallback to `DEFAULT_HERO_SLIDES`).
   - Active Locality Rolling Ticker: 11 micro-markets from `LOCALITIES` array.
   - Society Autocomplete Suggestions: 100+ societies from `bengaluruData.ts`.
   - Partner Logos & Section Settings: Fetched from `GET /api/cms/partner-logos` and `GET /api/cms/partner-section`.
   - Verified Property Listings: Fetched from `GET /api/listings`.
   - Calculator Baseline Inputs: Default property value ₹1.08 Cr, 1,461 sq.ft, ₹5/sq.ft/mo maintenance, ₹40k rent, 12 months holding, 2% brokerage.
7. **Forms, Actions, Buttons and Interactions:**  
   - **Hero Quick Action Card:** Tab switcher (Sell Flat / Buy Resale / Rent), BHK configuration dropdown (1 to 4 BHK+), Society search autocomplete with highlighted selections, "Get 45-Day Plan" primary submit button.
   - **Hero Slide Controls:** Next/Prev chevron buttons, slide indicator pills, pause-on-hover carousel advancement (6s timer), keyboard navigation (ArrowLeft / ArrowRight).
   - **Locality Capsule:** Vertical rolling animation advancing every 2.4s through 11 micro-markets.
   - **Calculator Controls:** Expected Asking Price number input, Area sq.ft input, Maintenance rate input, Occupancy status toggle (Vacant vs Tenanted), Monthly Rent input, Holding Period selector (6, 9, 12, 18 Months), "Explore Selling Options" CTA button.
   - **Listing Filters:** BHK filter chips (All, 1BHK, 2BHK, 2.5BHK, 3BHK, 3.5BHK, 4BHK+), Locality quick selectors (Whitefield, Panathur, Sarjapur, Hosur).
   - **Listing Card Actions:** "View Property" primary link (opens `/property/:id` in new tab), "Quick Enquiry" button (opens contact modal/route).
   - **Header Actions:** Nav tabs click, Post property FREE button, Login/Register button, My Dashboard button, Mobile hamburger menu toggle.
   - **Footer Actions:** FAQ modal trigger, Privacy Policy (DPDP) modal, Terms modal, Grievance Officer modal, Consent Portal direct link.
8. **API Endpoints and Backend Handlers Used:**  
   - `GET /api/cms/hero-slides` -> `src/server/cms/hero-service.ts`
   - `GET /api/cms/partner-logos` -> `src/server/cms/partner-service.ts`
   - `GET /api/cms/partner-section` -> `src/server/cms/partner-service.ts`
   - `GET /api/listings` -> `server.ts:1372`
   - `GET /api/auth/me` -> `server.ts:1320`
9. **Loading, Empty, Error and Success States:**  
   - Hero slides fallback cleanly to static assets if CMS is offline.
   - Listings show 3 animated skeleton pulses (`animate-pulse`) while fetching.
   - Empty listings state: Displays building icon, "No properties found with this filter", and a "Reset Filters" action button.
   - Error states gracefully fall back to default assets without crashing the page.
10. **Mobile and Desktop Layout Requirements:**  
    - Desktop: Multi-column hero, horizontal partner marquee, 2-column calculator (inputs left, summary right), 3-column property cards grid, 5-column footer.
    - Mobile: Single-column stack, collapsible drawer menu in header, horizontally scrollable filter chips, vertically stacked calculator, full-width property cards with touch-friendly tap targets (minimum 44x44px).
11. **Features That Must Remain Unchanged:**  
    - The core USP headline "Sell your flat in 45 days."
    - Real calculation formulas in the Holding Cost Calculator (Maintenance + Foregone Rent + Brokerage).
    - Rosette verified badge on listings.
    - DPDP-compliant footer legal modals.
12. **Related Screens and Navigation Paths:**  
    - Navigates to `SELLER_ASSISTED` via "Sell Flat", "Post property FREE", or "Start Assisted Selling".
    - Navigates to `PROPERTY_DETAIL` via `/property/:id`.
    - Navigates to `LOCALITY_DETAIL` via `/sell-flat-in-:slug-bangalore`.
    - Navigates to `CONTACT` via "Contact" or "Quick Enquiry".
    - Navigates to `LOGIN` via "Login / Register".
    - Navigates to `DASHBOARD` via "My Dashboard".

---

### SCR-02: Verified Property Detail Page

1. **Screen Name and Purpose:**  
   Dedicated public property detail page. Presents deep legal due diligence findings (A-Khata, EC, Title deed verification), high-resolution photo gallery, detailed property attributes, society amenities, builder RERA credentials, relationship manager desk contact, and an interactive accompanied visit booking form.
2. **Route or URL Path:**  
   Path: `/property/:id` | Hash: `#/property/:id` | Identifier: `PROPERTY_DETAIL`.
3. **User Role Permitted:**  
   Public (All users).
4. **Layout and Navigation Structure:**  
   - Minimal top header with "Back to Listings" link and brand logo.
   - 2-Column Responsive Layout:
     - Left Column (8 cols): Photo gallery carousel with thumbnail strip, Title and Asking Price header, Key attributes bar (BHK, SBUA, Carpet Area, Floor, Facing, Bathrooms, Balconies, Car parks), Verified Due Diligence Box, Public description, Amenities list, Developer & RERA profile, Nearby landmarks / connectivity.
     - Right Sticky Column (4 cols): Dedicated Relationship Manager card, Accompanied Site Visit booking form with funding source & DPDP consent, Direct WhatsApp button, Direct Phone Call button.
   - Bottom Section: Similar verified properties carousel.
5. **Existing Components and Shared Dependencies:**  
   - [`src/components/property/PropertyDetailPage.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/property/PropertyDetailPage.tsx)
   - Dependencies: `Logo.tsx`, `lucide-react`, `formatters.ts`.
6. **Data Displayed and Its Source:**  
   - Fetched from `GET /api/listings/:id`.
   - Data structure: `PublicPropertyDetail` containing `projectName`, `localityName`, `bhkType`, `superBuiltUpSqft`, `carpetAreaSqft`, `askingPriceInr`, `pricePerSqft`, `monthlyMaintenanceInr`, `verification` object (Tier, Khata, EC, Title deed, Tax receipt, Field inspection), `photos` array, `developer` details, `landmarks` array, `relationshipManager` object, `similarProperties` array.
7. **Forms, Actions, Buttons and Interactions:**  
   - **Photo Gallery:** Next/Prev arrows, thumbnail selector, fullscreen lightbox view, share link button (uses Web Share API with clipboard fallback).
   - **Accompanied Visit Form:** Full name input, 10-digit mobile number input, Preferred viewing slot dropdown, Funding mode radio (Pre-Approved Loan, Self-Funded, Applying for Loan), Statutory DPDP consent checkbox, "Schedule Accompanied Visit" submit button.
   - **Direct Contact Buttons:** "Chat on WhatsApp" (prefills property reference message to RM desk), "Call Advisory Desk" (+91 82178 73708).
8. **API Endpoints and Backend Handlers Used:**  
   - `GET /api/listings/:id` -> `server.ts:1455`
   - `POST /api/leads` -> `server.ts:1342` (Submits visit request as a buyer enquiry)
9. **Loading, Empty, Error and Success States:**  
   - Loading: Full-screen branded loading spinner with text "Loading Verified Property Details... Inspecting statutory title and RERA compliance data".
   - Error / 404: Branded error screen with icon, "Property Not Available: This property is no longer active on the public discovery portal", and "Explore Active Bengaluru Homes" recovery button.
   - Form Success: Replaces form with green confirmation card displaying booking reference ID (`SMG-XXXX`) and next steps.
10. **Mobile and Desktop Layout Requirements:**  
    - Desktop: Sticky right sidebar for viewing form and RM contact; left column scrollable.
    - Mobile: Full-width stacked layout; viewing booking form appears below property details; sticky bottom bar with "Schedule Visit" and "WhatsApp" quick-action buttons.
11. **Features That Must Remain Unchanged:**  
    - All 6 legal verification indicators (Tier, Khata, Encumbrance Certificate, Title Deed, Tax Receipt, Physical Inspection).
    - Relationship manager contact channel protection (never displays private owner phone number to public buyers).
12. **Related Screens and Navigation Paths:**  
    - Returns to `HOME` via "Back to Listings".
    - Links to other properties via "Similar Properties" cards.

---

### SCR-03: Programmatic Locality SEO Landing Pages

1. **Screen Name and Purpose:**  
   Dedicated SEO landing pages for each of the 11 key Bengaluru apartment resale micro-markets (Hebbal, Whitefield, Thanisandra, Yelahanka, Jakkur, Hennur, Sarjapur Road, Bellandur, HSR Layout, JP Nagar, Indiranagar). Designed for organic search capture ("Sell Flat in Hebbal Bangalore"), provides Sub-Registrar / Kaveri 2.0 guidance, and converts local homeowners.
2. **Route or URL Path:**  
   Path: `/sell-flat-in-:slug-bangalore` or `/locality/:slug` | Hash: `#/sell-flat-in-:slug-bangalore` | Identifier: `LOCALITY_DETAIL`.
3. **User Role Permitted:**  
   Public (All users).
4. **Layout and Navigation Structure:**  
   - Header with breadcrumbs (`Home / Bengaluru Resale / Sell Flat in :locality`) and "List My Flat" CTA.
   - Hero banner with micro-market zone badge, corridor highlights, tailored headline, and primary CTAs.
   - 4 Micro-Market Resale Intelligence Metrics Cards.
   - Market Overview narrative section.
   - Popular Gated Societies grid with instant pre-fill selling buttons.
   - Mandatory Documents Checklist required to sell in this micro-market.
   - Kaveri 2.0 Sub-Registrar Office Guidance & Stamp Duty breakdown.
   - Micro-Market specific FAQ Accordion.
   - Related Bengaluru Localities navigation bar.
5. **Existing Components and Shared Dependencies:**  
   - [`src/components/locality/LocalityDetailPage.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/locality/LocalityDetailPage.tsx)
   - Dependencies: `localitySeoData.ts`, `bengaluruData.ts`, `lucide-react`, `analytics.ts`.
6. **Data Displayed and Its Source:**  
   - Programmatically derived from `BANGALORE_LOCALITIES_SEO` in [`src/data/localitySeoData.ts`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/data/localitySeoData.ts).
   - Displays `indicativePriceBand`, `indicativeRatePerSqft`, `popularSocieties`, `subRegistrarOffice`, `stampDutyGuidance`, `faqs`, and `zone`.
7. **Forms, Actions, Buttons and Interactions:**  
   - Primary CTA: "Start Selling My Flat in {Locality}" (routes to `SELLER_ASSISTED` with locality pre-filled).
   - Secondary CTA: "Speak to {Locality} Desk" (routes to `CONTACT`).
   - Gated society pills: "List in {Society}" quick links.
   - FAQ Accordion: Single-expanded item toggle with chevron animation.
   - Related locality pills: Switches active locality view.
8. **API Endpoints and Backend Handlers Used:**  
   - Static client-side dataset (`localitySeoData.ts`); routes to `POST /api/leads` if inquiry submitted via contact modal.
9. **Loading, Empty, Error and Success States:**  
   - If slug is invalid or unknown, falls back gracefully to Hebbal profile (`BANGALORE_LOCALITIES_SEO[0]`).
10. **Mobile and Desktop Layout Requirements:**  
    - Desktop: 4-metric grid, 2-column documents and registration guide, clean 3-column society pills.
    - Mobile: 2x2 metric grid, stacked guidance sections, touch-optimized accordion tap targets.
11. **Features That Must Remain Unchanged:**  
    - Programmatic title tag: `Sell Flat in ${profile.name}, Bangalore | Resale Assistance & Buyers | SellMyGhar`.
    - Exact Kaveri 2.0 fee breakdown (5% stamp duty + 1% cess + 2% surcharge + 1% registration fee).
12. **Related Screens and Navigation Paths:**  
    - Routes to `SELLER_ASSISTED` with pre-filled locality parameter.
    - Routes to `CONTACT` for telephone advisory.
    - Routes to `HOME` via breadcrumbs.

---

### SCR-04: Seller Assisted Multi-Step Listing Funnel

1. **Screen Name and Purpose:**  
   6-Step Assisted Property Onboarding Wizard. Allows apartment owners to digitize their property details, upload photos, specify asking prices, complete lawful ownership declarations, verify phone via OTP, and submit the listing into the CRM.
2. **Route or URL Path:**  
   Path: `/seller-assisted`, `/post-property` | Hash: `#/seller-assisted` | Identifier: `SELLER_ASSISTED`.
3. **User Role Permitted:**  
   Public / Prospective Seller / Authenticated User.
4. **Layout and Navigation Structure:**  
   - Top Header with Back to Home button, progress bar, and 6-step horizontal indicator.
   - Centered Card Container (max-w-4xl) with step-by-step forms and Next/Previous navigation buttons.
   - Step 1: Basic Details (Listing Intent: SELL or RENT, Property Subtype).
   - Step 2: Location (Locality autocomplete, Society autocomplete, Wing/Tower, Unit number).
   - Step 3: Unit Specifications (BHK, Bathrooms, Balconies, Super built-up sq.ft, Carpet area auto-calculated at 78%, Floor number, Total floors, Facing, Furnishing, Property Age, Covered parking).
   - Step 4: Photos and Video (Drag-and-drop photo upload, preview grid, featured image toggle, video URL).
   - Step 5: Pricing & Owner (Expected price with dynamic Indian words formatter e.g. "₹ 1.25 Crore", Booking amount, Maintenance charges, Owner Name, 10-digit Phone, Description).
   - Step 6: Review & Submit (Summary card, Lawful ownership declaration, DPDP contact consent, Trigger OTP verification).
   - Post-Submission: Success Screen with prominent Listing Reference ID (`SMG-YYYY-XXXX`).
5. **Existing Components and Shared Dependencies:**  
   - [`src/components/seller/SellerFunnel.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/seller/SellerFunnel.tsx)
   - Dependencies: `bengaluruData.ts`, `lucide-react`, `formatters.ts`.
6. **Data Displayed and Its Source:**  
   - Localities list (`BENGALURU_LOCALITIES`) and Societies list (`BENGALURU_SOCIETIES`).
   - Dynamic carpet area estimation (~78% of SBUA unless manually edited).
   - Live Rupee words calculation (`formatINRWords`).
7. **Forms, Actions, Buttons and Interactions:**  
   - Autocomplete dropdowns with keyboard navigation (ArrowDown, ArrowUp, Enter).
   - File drag-and-drop zone with MIME-type and size checks.
   - Featured photo toggle (Star icon).
   - Checkbox declarations for ownership and DPDP consent.
   - OTP Modal with 6-digit input boxes and 60-second resend countdown.
   - Next Step / Previous Step action buttons with per-step validation barriers.
8. **API Endpoints and Backend Handlers Used:**  
   - `POST /api/auth/otp/request` -> `server.ts:1212`
   - `POST /api/auth/otp/verify` -> `server.ts:1245`
   - `POST /api/properties` -> `server.ts:1680`
   - `POST /api/storage/upload-photo` -> `server.ts:2410`
9. **Loading, Empty, Error and Success States:**  
   - Validation errors display in prominent alert banners above buttons.
   - Uploading images shows loading spinner with upload progress.
   - OTP verification shows loading spinner on submission button.
   - Success View: Displays green checkmark, Listing Reference ID, "View in Dashboard" and "Return to Home" buttons.
10. **Mobile and Desktop Layout Requirements:**  
    - Desktop: Horizontal step progression rail with icons; 2-column input grids.
    - Mobile: Compact step counter (e.g. "Step 3 of 6"), single-column inputs, sticky bottom Next/Back bar.
11. **Features That Must Remain Unchanged:**  
    - Auto-calculation of carpet area (~78% ratio) while allowing manual override.
    - Automatic currency-in-words display (e.g. "₹ 1.45 Crore").
    - Lawful ownership declaration and DPDP consent checkboxes.
    - Phone OTP verification requirement before final property creation.
12. **Related Screens and Navigation Paths:**  
    - Routes to `DASHBOARD` upon successful submission.
    - Returns to `HOME` via top left back button.

---

### SCR-05: Customer Auth & Registration Portal

1. **Screen Name and Purpose:**  
   Dedicated Customer Authentication Page. Supports sign-in and account creation for buyers and property owners via Phone OTP (primary) and Google OAuth (via Supabase). Rejects customer password login to eliminate credential-stuffing vulnerabilities.
2. **Route or URL Path:**  
   Path: `/login`, `/register` | Hash: `#/login` | Identifier: `LOGIN`.
3. **User Role Permitted:**  
   Public (Unauthenticated users).
4. **Layout and Navigation Structure:**  
   - 2-Column Desktop Card:
     - Left Column: Dark navy brand panel with SellMyGhar logo, trust pillars (Zero Broker Spam, Kaveri 2.0 Diligence, Verified Buyers), and RERA registration stamp.
     - Right Column: Authentication mode switcher (Sign In / Register), Tab selector (Mobile OTP vs Email/Password vs Google OAuth), interactive inputs, and action buttons.
   - Mobile: Single-column centered white card with subtle top branding.
5. **Existing Components and Shared Dependencies:**  
   - [`src/components/auth/AuthPage.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/auth/AuthPage.tsx)
   - Dependencies: `lib/supabase.ts`, `safeApi.ts`, `lucide-react`.
6. **Data Displayed and Its Source:**  
   - User inputs: Phone number, 6-digit OTP code, Display Name (optional).
   - Configuration: Supabase OAuth provider URLs.
7. **Forms, Actions, Buttons and Interactions:**  
   - **Phone OTP Flow:** Phone input with +91 prefix, "Send OTP" button, 6-digit OTP input, "Verify & Continue" button, 60-second cooldown timer.
   - **Google OAuth Button:** "Continue with Google" button (calls `supabase.auth.signInWithOAuth`).
   - **Email/Password Form:** Displays informative notice explaining that customer password login is disabled for security and redirects user to Mobile OTP.
8. **API Endpoints and Backend Handlers Used:**  
   - `POST /api/auth/otp/request` -> `server.ts:1212`
   - `POST /api/auth/otp/verify` -> `server.ts:1245`
   - `POST /api/auth/customer-login` -> `server.ts:1278` (fails closed)
9. **Loading, Empty, Error and Success States:**  
   - Loading: Spinners on "Send OTP", "Verify Code", and "Google Sign-In".
   - Error: Red alert box for invalid phone format or incorrect OTP.
   - Success: Transitions user to `DASHBOARD` and updates header session state.
10. **Mobile and Desktop Layout Requirements:**  
    - Desktop: 2-column split card (branding left, form right).
    - Mobile: Clean single-column layout, large numeric touch keyboard for phone and OTP entry.
11. **Features That Must Remain Unchanged:**  
    - Customer authentication must rely on OTP or Google OAuth (no passwords for customers).
    - Authoritative session cookie must remain `HttpOnly`.
12. **Related Screens and Navigation Paths:**  
    - Successful login routes to `DASHBOARD`.
    - Returns to `HOME` via "Back to Homepage" link.

---

### SCR-06: OAuth Authorization Callback Handler

1. **Screen Name and Purpose:**  
   Dedicated OAuth PKCE authorization exchange handler. Receives redirect from Google/Supabase, exchanges authorization code for user session, creates server session cookie, and routes to Dashboard.
2. **Route or URL Path:**  
   Path: `/auth/callback` | Hash: `#/auth/callback` | Identifier: `AUTH_CALLBACK`.
3. **User Role Permitted:**  
   In-flight OAuth redirect.
4. **Layout and Navigation Structure:**  
   Centered status card with loading spinner, success checkmark, or error recovery actions.
5. **Existing Components and Shared Dependencies:**  
   - [`src/components/auth/AuthCallback.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/auth/AuthCallback.tsx)
   - Dependencies: `lib/supabase.ts`, `safeApi.ts`, `lucide-react`.
6. **Data Displayed and Its Source:**  
   - Query parameters from URL (`code`, `error`, `error_description`).
   - Retrieved Supabase session access token.
7. **Forms, Actions, Buttons and Interactions:**  
   - Automatically executes authorization exchange on mount with in-flight deduplication (React 18/19 Strict Mode safe).
   - "Return to Sign In" fallback button if authorization fails.
8. **API Endpoints and Backend Handlers Used:**  
   - `POST /api/auth/google/session` -> `server.ts:1290`
9. **Loading, Empty, Error and Success States:**  
   - Loading: "Securing your SellMyGhar session... Exchanging credentials with Google identity service."
   - Success: "Successfully Authenticated! Redirecting to your dashboard..."
   - Error: "Authentication Declined or Failed" with retry button.
10. **Mobile and Desktop Layout Requirements:**  
    - Centered modal card across all viewports.
11. **Features That Must Remain Unchanged:**  
    - Deduplication logic preventing double-exchange in Strict Mode.
    - URL cleanup (`history.replaceState`) after session establishment.
12. **Related Screens and Navigation Paths:**  
    - Transitions to `DASHBOARD` on success; returns to `LOGIN` on failure.

---

### SCR-07: Authenticated Seller Management Dashboard

1. **Screen Name and Purpose:**  
   Homeowner Management Portal (matching 99acres-style management interface). Allows verified property owners to monitor property progress across 6 CRM milestones, inspect diligence statuses, view chronological timeline events, and review scheduled buyer site visits.
2. **Route or URL Path:**  
   Path: `/dashboard`, `/seller-dashboard` | Hash: `#/dashboard` | Identifier: `DASHBOARD`.
3. **User Role Permitted:**  
   Authenticated `OWNER` or `BUYER`.
4. **Layout and Navigation Structure:**  
   - Top Header with brand logo, user profile badge, "Post property FREE" CTA button, and Logout button.
   - Portal Navigation Tabs:
     - Tab 1: **My Listings** (`LISTINGS`): Active property cards with 6-milestone progress rail.
     - Tab 2: **Property Timeline** (`TIMELINE`): Chronological activity log.
     - Tab 3: **Site Visits** (`VISITS`): Scheduled buyer inspections.
   - Property Details Slide-Over Drawer / Modal for deep inspection.
5. **Existing Components and Shared Dependencies:**  
   - [`src/components/seller/SellerDashboard.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/seller/SellerDashboard.tsx)
   - Dependencies: `PropertyProgressTracker`, `CRM_MILESTONES`, `formatters.ts`, `lucide-react`.
6. **Data Displayed and Its Source:**  
   - Fetched from `GET /api/properties` or `GET /api/seller/properties`.
   - Data structure: `SellerPropertyItem` containing `title`, `projectName`, `localityName`, `bhkType`, `askingPriceInr`, `superBuiltUpSqft`, `status`, `activityTimeline`, `siteVisits`, `verificationDocuments`.
   - **6 CRM Milestones:**
     1. `NEW` (Uploaded & Digitized)
     2. `CONTACTED` (RM Assigned)
     3. `FOLLOW_UP` (Due Diligence in Progress)
     4. `SITE_VISIT` (Buyer Accompanied Visits)
     5. `NEGOTIATION` (Offer & Pricing)
     6. `CONVERTED` (Sale Completed)
7. **Forms, Actions, Buttons and Interactions:**  
   - Tab switching (Listings / Timeline / Visits).
   - "View Public Listing" button.
   - "Post Another Property" button.
   - Search and filter properties by society or locality.
   - Expandable milestone details displaying real timestamps and RM notes.
   - Logout action (calls `POST /api/auth/logout`).
8. **API Endpoints and Backend Handlers Used:**  
   - `GET /api/properties` -> `server.ts:1870`
   - `POST /api/auth/logout` -> `server.ts:1330`
9. **Loading, Empty, Error and Success States:**  
   - Loading: Animated skeleton cards.
   - Empty Listings: Branded empty state with illustration, "No properties listed yet", and "Post Your First Property" CTA.
   - Empty Visits: "No site visits scheduled yet. Our relationship team will notify you when a buyer is booked."
10. **Mobile and Desktop Layout Requirements:**  
    - Desktop: Horizontal milestone tracker dots with connected progress line; multi-column property cards.
    - Mobile: Horizontally scrollable milestone dots; compact cards with stacked attributes.
11. **Features That Must Remain Unchanged:**  
    - Exact 6 CRM milestones and labels (`NEW`, `CONTACTED`, `FOLLOW_UP`, `SITE_VISIT`, `NEGOTIATION`, `CONVERTED`).
    - Milestone timestamps must display real recorded event dates or "Pending" (never fabricate fake dates).
12. **Related Screens and Navigation Paths:**  
    - Routes to `SELLER_ASSISTED` via "Post property".
    - Routes to `HOME` on logout.

---

### SCR-08: Advisory Desk & Contact Us Page

1. **Screen Name and Purpose:**  
   Dedicated Contact Us & Verification Helpline Page. Provides official Bengaluru operations office coordinates, telephone helpline, direct WhatsApp desk, and an embedded lead capture form for general inquiries and callbacks.
2. **Route or URL Path:**  
   Path: `/contact` | Hash: `#/contact` | Identifier: `CONTACT`.
3. **User Role Permitted:**  
   Public (All users).
4. **Layout and Navigation Structure:**  
   - Sticky Top Header (`Header.tsx`).
   - Dark navy banner: "Get in Touch with SellMyGhar - Dedicated Bengaluru Advisory Desk".
   - 2-Column Grid:
     - Left Column (5 cols): Office Details Card (Indiranagar 100ft Rd address, Helpline `+91 80 4719 3300`, WhatsApp `+91 98765 43210`, Operating Hours Mon-Sat 9:30 AM - 7:00 PM, RERA Stamp `PRM/KA/RERA/1251`), "Ready to List Directly?" banner.
     - Right Column (7 cols): Direct Enquiry & Callback Form (`LeadCapture.tsx`).
   - Standard Footer (`Footer.tsx`).
5. **Existing Components and Shared Dependencies:**  
   - [`src/components/contact/ContactPage.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/contact/ContactPage.tsx)
   - [`src/components/home/LeadCapture.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/home/LeadCapture.tsx)
   - Dependencies: `Header.tsx`, `Footer.tsx`, `lucide-react`.
6. **Data Displayed and Its Source:**  
   - Office contact coordinates, phone numbers, hours, RERA certificate number.
7. **Forms, Actions, Buttons and Interactions:**  
   - Dual-intent lead capture form (Sell / Buy toggle, Name, Phone, Society, Locality, BHK selector, Built-up area).
   - "Submit Request" button with 4.5s timeout guard and fallback reference generator.
   - Click-to-call helpline link and click-to-chat WhatsApp link.
8. **API Endpoints and Backend Handlers Used:**  
   - `POST /api/leads` -> `server.ts:1342`
9. **Loading, Empty, Error and Success States:**  
   - Loading: Spinner on submit button.
   - Validation Error: Red alert box for invalid phone or missing name.
   - Success: Confirmation card displaying Reference ID (`SMG-YYYY-XXXX`), WhatsApp button, and summary.
10. **Mobile and Desktop Layout Requirements:**  
    - Desktop: 2-column layout.
    - Mobile: Office details collapse above or below the primary inquiry form.
11. **Features That Must Remain Unchanged:**  
    - Official contact numbers and RERA registration stamp.
12. **Related Screens and Navigation Paths:**  
    - Routes to `SELLER_ASSISTED` via "Start Assisted Selling".
    - Returns to `HOME` via top header.

---

### SCR-09: DPDP Statutory Consent Portal

1. **Screen Name and Purpose:**  
   Digital Personal Data Protection Act (DPDP Act 2023) Statutory Consent Management Portal. Enables customers to view active statutory consents, inspect notice versions, withdraw consent for specific purposes, and initiate Section 12 Right to Erasure requests.
2. **Route or URL Path:**  
   Path: `/consent` | Hash: `#/consent` | Identifier: `CONSENT`.
3. **User Role Permitted:**  
   Public / Consumer.
4. **Layout and Navigation Structure:**  
   - Top security bar: "DPDP Statutory Consent Management" with Back to Homepage button.
   - 3-Phase State Machine:
     - Phase 1: Phone input (`PHONE`).
     - Phase 2: OTP verification (`OTP`).
     - Phase 3: Active Consents Dashboard (`DASHBOARD`).
5. **Existing Components and Shared Dependencies:**  
   - [`src/components/compliance/ConsentPortal.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/compliance/ConsentPortal.tsx)
   - Dependencies: `lucide-react`.
6. **Data Displayed and Its Source:**  
   - Fetched from `POST /api/compliance/withdraw-consent` or demo ledger.
   - Displays 3 statutory purposes:
     1. `SELLER_ONBOARDING`: Seller Onboarding & Verification (`dpdp-notice-2026-v1`)
     2. `MARKETING_OPT_IN`: Market Reports & Price Advisory Updates (`dpdp-notice-2026-v1`)
     3. `VISIT_COORDINATION`: Buyer Physical Visit Coordination (`dpdp-notice-2026-v1`)
   - Notice version, timestamp granted, timestamp withdrawn, confirmation reference ID.
7. **Forms, Actions, Buttons and Interactions:**  
   - Phone input and OTP entry.
   - "Withdraw Consent" red button per purpose.
   - Success acknowledgement displaying withdrawal confirmation reference (`wth-xxxx-xxxx`).
   - Logout / Exit button.
8. **API Endpoints and Backend Handlers Used:**  
   - `POST /api/compliance/withdraw-consent` -> `server.ts:2850`
9. **Loading, Empty, Error and Success States:**  
   - Loading indicator on withdrawal submission.
   - Success notice: "Statutory consent successfully withdrawn. All active outreach terminated immediately."
10. **Mobile and Desktop Layout Requirements:**  
    - Centered card layout responsive across all viewports.
11. **Features That Must Remain Unchanged:**  
    - Statutory disclaimer: "Upon withdrawal of consent, SellMyGhar ceases processing data within statutory timelines, except where retention is required by law."
12. **Related Screens and Navigation Paths:**  
    - Returns to `HOME` via "Back to Homepage".

---

### SCR-10: Staff Operations Portal Login

1. **Screen Name and Purpose:**  
   Restricted Gatekeeper for the Staff Operations Portal. Authenticates internal staff, verification officers, listing managers, and super administrators using email and password credentials.
2. **Route or URL Path:**  
   Path: `/crm` or `#/crm` (when unauthenticated) | Identifier: `CRM`.
3. **User Role Permitted:**  
   Staff Credentials Only (`STAFF_*`).
4. **Layout and Navigation Structure:**  
   Centered security card with lock icon, title "Staff Operations Portal", dev-testing credentials quick-fill banner, email/password form, and Return to Public Homepage button.
5. **Existing Components and Shared Dependencies:**  
   - [`src/components/auth/StaffLogin.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/auth/StaffLogin.tsx)
   - Dependencies: `lucide-react`.
6. **Data Displayed and Its Source:**  
   - Staff email, password.
   - Quick-fill dev buttons for Staff (`staff@sellmyghar.in`) and Admin (`admin@sellmyghar.in`).
7. **Forms, Actions, Buttons and Interactions:**  
   - Email input, password input, "Authenticate Session" submit button, "Return to Public Homepage" button.
8. **API Endpoints and Backend Handlers Used:**  
   - `POST /api/auth/login` -> `server.ts:1175`
9. **Loading, Empty, Error and Success States:**  
   - Loading: Spinner on button.
   - Error: Red alert box for invalid credentials or locked account.
   - Success: Transitions immediately to CRM Dashboard (`SCR-11`).
10. **Mobile and Desktop Layout Requirements:**  
    - Centered card layout.
11. **Features That Must Remain Unchanged:**  
    - Zero public clues or entry points on the main consumer website.
    - Rate-limiting protection on login endpoint.
12. **Related Screens and Navigation Paths:**  
    - Transitions to `SCR-11` (CRM Dashboard) upon valid login.

---

### SCR-11 to SCR-21: Staff CRM Operations Suite

#### SCR-11: Staff CRM Overview & Executive KPI Dashboard
- **Route:** `/crm` with `activeSection === 'OVERVIEW'`.
- **Purpose:** Executive command center. Displays real-time metrics: Total Inbound Leads, Active Resale Listings, Scheduled Buyer Visits, Pending Legal Diligence, Conversion Rate, and 30-day velocity chart.
- **Components:** Metric KPI cards, Stage breakdown bar chart, Quick Action buttons (Create Listing, Add Lead, Schedule Visit), Recent Activity Feed.
- **Endpoints:** `GET /api/crm/overview-metrics`.

#### SCR-12: Staff CRM Inbound Leads Pipeline Desk
- **Route:** `/crm` with `activeSection === 'LEADS'`.
- **Purpose:** Manages all top-of-funnel inquiries (Seller property intakes and Buyer inquiries).
- **Features:** 7-stage pipeline filter chips (`NEW`, `CONTACTED`, `FOLLOW_UP`, `SITE_VISIT`, `NEGOTIATION`, `CONVERTED`, `LOST`), search bar, assigned staff filter, lead type filter (Seller vs Buyer), follow-up urgency filter (Overdue, Today, Upcoming).
- **Interactions:** Slide-over Lead Detail Drawer: change status, assign staff, schedule follow-up date/time, add internal notes, convert lead to property listing.
- **Endpoints:** `GET /api/crm/leads`, `GET /api/crm/leads/:id/details`, `POST /api/crm/leads/:id/status`, `POST /api/crm/leads/:id/assign`, `POST /api/crm/leads/:id/follow-up`, `POST /api/crm/leads/:id/notes`.

#### SCR-13: Staff CRM Property Inventory & Lifecycle Editor
- **Route:** `/crm` with `activeSection === 'PROPERTIES'`.
- **Purpose:** Curates, edits, verifies, and publishes resale apartment listings.
- **Features:** Status filter chips (`ALL`, `DRAFT`, `PUBLISHED`, `PAUSED`, `SOLD`, `ARCHIVED`), BHK filter, search bar, property table with thumbnail, title, locality, pricing, floor, verification badge, and status pill.
- **PropertyEditor Modal (`PropertyEditor.tsx`):**
  - Tab 1 `BASIC`: Title, project name, locality, property type, BHK, SBUA, carpet area, floor band, facing, public address.
  - Tab 2 `PRICING`: Asking price INR, monthly maintenance, reserve bottom-line price.
  - Tab 3 `CONTENT`: Description, amenities tags multi-select, developer name, landmarks list, highlights list.
  - Tab 4 `IMAGES`: Upload photos, gallery grid, set featured thumbnail, delete image, reorder images.
  - Tab 5 `ACTIVITY`: Audit change log.
  - Status transitions: DRAFT -> PUBLISHED (requires >= 3 images, description, pricing, title validation), Pause, Mark Sold, Archive.
- **Endpoints:** `GET /api/crm/properties`, `GET /api/crm/properties/:id/details`, `POST /api/crm/properties`, `PUT /api/crm/properties/:id`, `POST /api/crm/properties/:id/publish`, `POST /api/crm/properties/:id/pause`, `POST /api/crm/properties/:id/sold`, `POST /api/crm/properties/:id/archive`, `POST /api/crm/properties/:id/images`, `DELETE /api/crm/properties/:id/images/:imageId`, `POST .../primary`, `POST .../reorder`.

#### SCR-14: Staff CRM Accompanied Site Visits Desk
- **Route:** `/crm` with `activeSection === 'VISITS'`.
- **Purpose:** Coordinates physical buyer inspections accompanied by SellMyGhar closers.
- **Features:** Table of visits: Client name, phone, property name, visit date, visit time, status (`SCHEDULED`, `COMPLETED`, `CANCELLED`), assigned closer.
- **Actions:** Schedule new visit modal (with `DateTimePicker`), update visit status, send automated WhatsApp reminder with meeting details.
- **Endpoints:** `GET /api/crm/visits`, `POST /api/crm/visits`, `PATCH /api/crm/visits/:id/status`, `POST /api/crm/visits/:id/whatsapp-reminder`.

#### SCR-15: Staff CRM Buyer Purchase Offers Desk
- **Route:** `/crm` with `activeSection === 'OFFERS'`.
- **Purpose:** Manages formal buyer price offers and owner counter-offers.
- **Features:** Table of offers: Property name, buyer name, buyer phone, offer amount INR, status (`PENDING_REVIEW`, `ACCEPTED`, `COUNTER_OFFERED`, `REJECTED`), counter-offer amount, notes.
- **Actions:** Record new offer modal, Accept offer, Submit counter-offer, Reject offer.
- **Endpoints:** `GET /api/crm/offers`, `POST /api/crm/offers`, `PATCH /api/crm/offers/:id/status`.

#### SCR-16: Staff CRM Follow-up Tasks Kanban & Table Desk
- **Route:** `/crm` with `activeSection === 'TASKS'`.
- **Purpose:** Daily operational workflow desk for staff.
- **Features:** Table view vs Kanban board switcher. 4 columns: Overdue Follow-ups, Due Today, Upcoming / Scheduled, Completed / Cleared.
- **Interactions:** Drag-and-drop cards between columns with optimistic UI updates; One-click "Mark Contacted"; "Reschedule Follow-up" with `DateTimePicker`; "Open Lead Details".
- **Endpoints:** `GET /api/crm/tasks`, `POST /api/crm/leads/:id/follow-up`.

#### SCR-17: Staff CRM Master Operations Calendar
- **Route:** `/crm` with `activeSection === 'CALENDAR'`.
- **Purpose:** Visual operational calendar consolidating physical site visits and scheduled phone follow-ups.
- **Features:** Month, Week, Day, and Agenda view modes; staff member filter; clickable calendar event cards displaying client info, property details, and quick WhatsApp action.
- **Components:** [`src/components/crm/CalendarModule.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/crm/CalendarModule.tsx).
- **Endpoints:** `GET /api/crm/visits`, `GET /api/crm/tasks`.

#### SCR-18: Staff CRM Staff Directory & RBAC Desk
- **Route:** `/crm` with `activeSection === 'TEAM'`.
- **Purpose:** User management and role-based permissions management.
- **Features:** Staff directory table with name, email, phone, active roles, and assigned modules.
- **Actions:** Invite new staff modal, edit roles (`STAFF_INTAKE_AGENT`, `STAFF_VERIFICATION_AGENT`, `STAFF_LISTING_MANAGER`, `STAFF_DEAL_CLOSER`, `STAFF_SUPER_ADMIN`), edit explicit module permissions.
- **Endpoints:** `GET /api/crm/staff`, `POST /api/crm/users`, `PATCH /api/crm/users/:id`, `PATCH /api/crm/users/:id/role`.

#### SCR-19: Staff CRM Business Reports & CSV Export Desk
- **Route:** `/crm` with `activeSection === 'REPORTS'`.
- **Purpose:** Analytics reporting and statutory business data export.
- **Features:** Metric cards for monthly sales volume, average days to close (45-day SLA tracker), lead conversion funnel, export properties CSV button, export leads CSV button.
- **Endpoints:** `GET /api/crm/reports`, `GET /api/crm/reports/export-csv`.

#### SCR-20: Staff CRM Immutable Security Audit Logs Desk
- **Route:** `/crm` with `activeSection === 'AUDIT'`.
- **Purpose:** Regulatory and security audit compliance trail.
- **Features:** Searchable table of audit events: Timestamp, Actor email, Actor role, Action (`STAFF_LOGIN_SUCCESS`, `LEAD_STATUS_UPDATED`, `PROPERTY_PUBLISHED`, `IMAGE_REMOVED`, `DELETE_USER_DATA`, etc.), Target Entity, Target Entity ID, Client IP, and expandable JSON diff summary.
- **Endpoints:** `GET /api/crm/audit-logs`.

#### SCR-21: Staff CRM Settings & Admin Control Panel
- **Route:** `/crm` with `activeSection === 'SETTINGS'`.
- **Purpose:** Operational administrative controls with 4 dedicated sub-tabs:
  1. **Security & DPDP Erasure Queue (`SECURITY`):** Renders [`AdminErasureQueue.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/crm/AdminErasureQueue.tsx). Reviews DPDP Section 12 erasure requests, verifies statutory holds, and executes irreversible data anonymization.
  2. **Hero Carousel CMS (`HERO_CMS`):** Renders [`HeroCmsManager.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/crm/HeroCmsManager.tsx). Creates, edits, reorders, and activates homepage hero banner slides (1920x800).
  3. **Builder Partner Logos CMS (`PARTNER_CMS`):** Renders [`PartnerLogosManager.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/crm/PartnerLogosManager.tsx). Manages builder channel partner logos, section heading, scroll speed, and pause-on-hover.
  4. **Email Notification Templates (`EMAIL_TEMPLATE`):** Renders [`PublicationEmailManager.tsx`](file:///Users/apple/.gemini/antigravity/scratch/SMG---MVP/src/components/crm/PublicationEmailManager.tsx). Edits transactional HTML email templates, tests email dispatches, and checks provider configuration status.

---

### SCR-22 & SCR-23: Standalone / Unrouted Components

#### SCR-22: Deep Document Verification Desk (`DocumentVerificationDesk.tsx`)
- **Status:** Standalone component in `src/components/crm/`.
- **Purpose:** Dedicated due diligence vault inspecting uploaded sale deeds, encumbrance certificates, and tax receipts. Displays SHA-256 checksums, magic bytes validation (`VALID_PDF`), and ClamAV antivirus scan statuses (`CLEAN` / `INFECTED`).
- **Integration Note:** In the current `CrmDashboard.tsx`, document review is embedded directly within the Lead and Property detail slide-over drawers via `PUT /api/crm/documents/:id/status`. This standalone component represents a full-screen desk design that can be activated as a dedicated CRM module.

#### SCR-23: Curated Buyer Discovery Prototype (`BuyerDiscovery.tsx`)
- **Status:** Standalone component in `src/components/buyer/`.
- **Purpose:** Early prototype of curated buyer discovery with advanced filtering by BHK, price range, and amenities.
- **Integration Note:** Public property discovery is currently fulfilled by `ListedProperties.tsx` on the Homepage (`SCR-01`) and `PropertyDetailPage.tsx` (`SCR-02`).
