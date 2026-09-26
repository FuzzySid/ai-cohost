---
name: Host Copilot Craft System
colors:
  surface: '#f9f9f7'
  surface-dim: '#dadad8'
  surface-bright: '#f9f9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f2'
  surface-container: '#eeeeec'
  surface-container-high: '#e8e8e6'
  surface-container-highest: '#e2e3e1'
  on-surface: '#1a1c1b'
  on-surface-variant: '#494734'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#7a7862'
  outline-variant: '#cbc7ae'
  surface-tint: '#656100'
  primary: '#656100'
  on-primary: '#ffffff'
  primary-container: '#fff65b'
  on-primary-container: '#757000'
  inverse-primary: '#d3cb32'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2e1'
  on-secondary-container: '#656464'
  tertiary: '#5d5f5b'
  on-tertiary: '#ffffff'
  tertiary-container: '#f1f1ec'
  on-tertiary-container: '#6c6e6a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f0e74e'
  primary-fixed-dim: '#d3cb32'
  on-primary-fixed: '#1e1c00'
  on-primary-fixed-variant: '#4c4800'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e3e3de'
  tertiary-fixed-dim: '#c6c7c2'
  on-tertiary-fixed: '#1a1c19'
  on-tertiary-fixed-variant: '#464744'
  background: '#f9f9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e1'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  tabular-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  tabular-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system is tailored for an operational AI co-host built for professional vacation rental property managers and boutique hosts. The brand voice balances tactical efficiency with hospitality poise: calm under pressure, rigorously precise, and human-centric. The experience eliminates anxiety around double-bookings, dynamic pricing shifts, and high-frequency guest messaging.

The design movement combines **Scandinavian Functionalism** with **Modern Linear/Stripe Calm Density**. 
- It rejects hyperactive AI tropes: no neon gradients, no synthetic floating spheres, no intrusive conversational sparkle bots.
- The interface feels grounded, reliable, and durable, relying on architectural whitespace, razor-sharp 1px structural boundaries, crisp typography, and intentional tactile points.
- AI features are rendered as trusted ambient utility: proactive drafts, inline diff previews, and verified sync state indicators that wait for human approval rather than fighting for attention.

## Colors

The palette balances warm, hospitable neutrals with a high-visibility, pioneering accent color.

### Palette Architecture
- **Primary Accent (`#FFF65B`)**: Pioneering Yellow. Reserved exclusively for primary actions, active navigation pips, AI-assisted draft indicators, and active sparkline overlays. It is never applied to large canvas backgrounds or full modal sheets. Text rendered directly on `#FFF65B` is strictly `#111111` for guaranteed contrast and legibility.
- **Secondary (`#111111`)**: Deep near-black. Used for primary typography, authoritative states, selected toggle buttons, and crisp edge accents.
- **Tertiary / Structural Stroke (`#E5E5E0`)**: Architectural divider neutral. Used for hairline borders, table dividing lines, and subtle input containers.
- **Canvas / Ground Neutral (`#FAFAF8`)**: Warm off-white foundation that eliminates cold sterile screen glare, anchoring long-session host management.
- **Surface Neutral (`#FFFFFF`)**: Pure crisp white reserved for raised cards, flyouts, and active input canvases.

### Semantic Tones (Calm & Desaturated)
Never use saturated or neon alert states. Maintain subtle pastels for tinted fills paired with high-contrast text:
- **Conflict / Critical Alert**: Text `#E0564C`, Surface Background `#FDF2F1`, Border `#F8D7D5` (Double bookings, missing keycodes, API channel disconnects).
- **Attention / Warning**: Text `#D97706`, Surface Background `#FEF3C7`, Border `#FDE68A` (Pricing drift, unread inquiry over 30 mins).
- **Success / Synced**: Text `#15803D`, Surface Background `#DCFCE7`, Border `#BBF7D0` (OTA sync complete, message sent, payout processed).
- **Secondary Neutral Text**: `#6B6B6B` for auxiliary metadata, timestamps, and placeholder labels.

## Typography

The type scale pairs three deliberate typefaces:
- **Headline Font (`Space Grotesk`)**: Provides an authoritative, architectural presence with expressive geometric nuances. Used for view titles, card headings, KPI callouts, and drawer headers.
- **Body Font (`Plus Jakarta Sans`)**: Delivers clean, human, legible comfort across communication streams, guest conversation threads, AI summaries, and operational forms.
- **Label & Data Font (`JetBrains Mono`)**: Strict, reliable monospaced engineering font for financial values, nightly rates, cleaning fees, occupancy percentages, timestamps, and model token metrics.

### Typographic Rules
- Always use `tabular-data` for dynamic numbers, prices, payout ledgers, date ranges, and countdown timers to avoid horizontal layout shift.
- Large numerical counters and occupancy rates combine a `Space Grotesk` integer with a muted `JetBrains Mono` currency or unit descriptor.
- Titles must never use pure `#000000`; use `#111111` to prevent high-contrast eye fatigue during nighttime host shifts.

## Layout & Spacing

The system enforces a dense, utilitarian, 8-point baseline rhythm. Dense screens reduce scrolling and deliver the situational awareness needed during property turnover rushes.

### Canvas Grid Model
- **Desktop (>= 1280px)**: 12-column adaptive grid, fixed 64px collapsible icon rail + 240px contextual tool navigation panel, content max width `1440px` centered with `margin-desktop` (32px), `gutter-desktop` (24px).
- **Tablet (768px - 1279px)**: 8-column layout, rail collapses to drawer, `margin-tablet` (24px), `gutter` (16px).
- **Mobile (< 768px)**: 4-column layout, bottom persistent status bar, `margin` (16px), `gutter` (16px).

### Spacing Usage
- `space-2xs` (2px) and `space-xs` (4px): Micro-gaps between badge status dots and text labels; segmented pill button padding.
- `space-sm` (8px): Spacing between input label and field; internal compact table row gaps.
- `space-md` (12px): Standard inner button padding; chip gap arrays; message bubble vertical spacing.
- `space-base` (16px): Standard form element vertical stacks; compact card inner padding.
- `space-lg` (24px): Standard card container padding; multi-column dashboard grid gaps.
- `space-xl` (32px): Separation between distinct dashboard sections (e.g., Unresolved Inquiries vs. Occupancy Trajectory).

## Elevation & Depth

This system avoids fake blur, drop shadows with massive spread, or heavy dark overlays. Hierarchy is created through **low-contrast outlines** and **micro-surface tinting**.

### Hierarchy Levels
- **Canvas Base Level (0)**: Solid `#FAFAF8`. All structural layouts, multi-calendar timelines, and split-screen host dashboards sit on this base.
- **Card / Surface Level (1)**: Solid `#FFFFFF`, bordered by 1px solid `#E5E5E0`. No drop shadow during static rest. On hover for interactive elements, the border transitions smoothly to `#111111` with a discreet tactile micro-shadow (`0 1px 2px rgba(17, 17, 17, 0.05)`).
- **Active Focus / Selection Level (2)**: Pure `#FFFFFF` surface with an inner 2px outline of `#111111` or `#FFF65B` (for AI draft focus blocks).
- **Floating Operational Panels / Popovers (3)**: Solid `#FFFFFF` background, 1px solid `#E5E5E0`, supported by a clean shadow: `0 8px 24px -4px rgba(17, 17, 17, 0.08), 0 2px 6px -1px rgba(17, 17, 17, 0.04)`.
- **Modals & Drawer Sheets (4)**: Solid `#FFFFFF` bordered container backed by an understated scrim: `rgba(17, 17, 17, 0.35)`.

## Shapes

The design uses **Soft (Level 1)** geometry (`0.25rem` / 4px base radius) to evoke the crisp precision of industrial tooling and real-estate blueprints.

### Radius Assignments
- **Base (4px - `rounded-sm`)**: Form inputs, standard buttons, tabular badge containers, metadata tags, and inline keycode blocks.
- **Secondary (8px - `rounded-md`)**: Main dashboard cards, multi-unit calendar cells, action drawers, and modal bodies.
- **Tertiary (12px - `rounded-lg`)**: System notifications, guest chat container sheets, dynamic revenue charts.
- **Full Pill (`9999px`)**: Reserved exclusively for operational status badges (e.g., "AI Draft Ready", "Instant Book"), presence indicators, and the pioneering yellow active navigation indicators.

## Components

### 1. Primary & Secondary Buttons
- **Primary Action (Copilot Core)**: Background `#FFF65B`, 1px solid `#111111`, Text `#111111`, font `Plus Jakarta Sans` 14px weight 600. Border radius 4px. On hover: background shifts to `#F5EC4E`. On active: translates 1px down for a tactile mechanical snap.
- **Secondary Action**: Background `#FFFFFF`, 1px solid `#E5E5E0`, Text `#111111`. Hover: border becomes `#111111`, background `#FAFAF8`.
- **Destructive Action**: Background `#FDF2F1`, 1px solid `#F8D7D5`, Text `#E0564C`. Hover: Background `#FEE2E2`.

### 2. AI Copilot Draft Pill & Banner
- **Draft Status Indicator**: Full pill shape, background `#FFF65B`, 1px solid `#111111`, padding `2px 8px`. Typography: `JetBrains Mono` 11px uppercase bold tracking `0.05em`.
- **Copilot Draft Review Box**: `#FFFFFF` background with a left accent border: 3px solid `#FFF65B`. Shows a subtle "Review AI suggested response" header in 12px secondary text, followed by standard editable text in 14px, and two micro-buttons: "Approve & Send (⌘↵)" in Primary Yellow and "Discard" in Ghost link.

### 3. Cards & Modules
- Standard card uses `#FFFFFF` background, 1px solid `#E5E5E0`, 8px border radius, and internal padding of 24px (`space-lg`). Header areas have bottom border 1px solid `#FAFAF8` to visually organize property details without adding noise.

### 4. Form Inputs & Selectors
- Background `#FFFFFF`, 1px solid `#E5E5E0`, 4px radius, 14px text. Height is strictly 38px for tight desktop density.
- Focus state: border color `#111111`, with no glowing fuzzy focus rings. An inner 1px sharp offset ring provides accessibility.

### 5. Multi-Calendar & Channel Sync Chips
- Compact pills using `JetBrains Mono` 12px.
- **Synced Channel**: Background `#DCFCE7`, border `#BBF7D0`, text `#15803D`.
- **Pricing Drift**: Background `#FEF3C7`, border `#FDE68A`, text `#D97706`.
- **Conflict**: Background `#FDF2F1`, border `#F8D7D5`, text `#E0564C`.

### 6. Tables & Financial Ledgers
- Headers in `Space Grotesk` 12px uppercase bold with `#6B6B6B`.
- Row height: 44px. Separators: 1px horizontal `#E5E5E0`.
- All monetary amounts, dates, and payout calculations are right-aligned using `tabular-data` (`JetBrains Mono`).