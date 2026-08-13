# HSBC Property Portal (Next.js Frontend)

A unified Next.js web portal that hosts two applications — Property Value Estimator and Market Analysis Dashboard — with shared navigation, consistent design system, responsive layout, and modern UI/UX.

## Tech Stack

- Next.js 16 (App Router, React Server Components)
- React 19
- TypeScript
- Tailwind CSS
- Recharts (data visualization)
- Lucide React (icons)

## Quick Start

### Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

### Production Build

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t portal .
docker run -p 3000:3000 portal
```

## Environment Variables

Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_ESTIMATOR_API=http://localhost:8001
NEXT_PUBLIC_MARKET_API=http://localhost:8002
NEXT_PUBLIC_ML_API=http://localhost:8000
```

| Variable | Default (Browser) | Default (Server) | Description |
|----------|-------------------|------------------|-------------|
| `NEXT_PUBLIC_ESTIMATOR_API` | `http://localhost:8001` | - | Property Estimator API URL (client-side) |
| `NEXT_PUBLIC_MARKET_API` | `http://localhost:8002` | - | Market Analysis API URL (client-side) |
| `NEXT_PUBLIC_ML_API` | `http://localhost:8000` | - | ML Model API URL (client-side) |
| `SERVER_ESTIMATOR_API` | - | `http://property-estimator:8001` | Estimator API URL (server-side, Docker) |
| `SERVER_MARKET_API` | - | `http://market-analysis:8002` | Market API URL (server-side, Docker) |
| `SERVER_ML_API` | - | `http://ml-api:8000` | ML API URL (server-side, Docker) |

The API client in `src/lib/api.ts` automatically selects the correct URL based on the execution environment (server vs. client) using `typeof window === 'undefined'`.

## Application Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with Navigation + Suspense boundary
│   ├── page.tsx                # Home page (landing) - Server Component
│   ├── loading.tsx             # Global loading state (spinner)
│   ├── error.tsx               # Global error boundary with reset button
│   ├── globals.css             # Global styles (Tailwind + Geist fonts)
│   ├── estimator/
│   │   └── page.tsx            # App 1: Property Value Estimator - Client Component
│   └── analysis/
│       ├── page.tsx            # App 2: Market Analysis Dashboard - Server Component
│       └── AnalysisDashboard.tsx  # Interactive dashboard - Client Component
├── components/
│   └── Navigation.tsx          # Shared responsive navigation bar with mobile menu
├── hooks/
│   └── useApi.ts               # Custom React hooks (useApi, useEstimatorApi, useMarketApi)
└── lib/
    └── api.ts                  # API URL resolution and fetch utilities
```

## Architecture

### Server Components vs Client Components

- **Server Components** (default): `layout.tsx`, `page.tsx` (home), `analysis/page.tsx`
  - Fetch initial data on the server (SSR) for fast first paint
  - No JavaScript sent to client for these components
  - Use Docker internal service names for API calls
- **Client Components** (`"use client"`): `Navigation.tsx`, `estimator/page.tsx`, `AnalysisDashboard.tsx`, `loading.tsx`, `error.tsx`
  - Handle interactivity (forms, buttons, state)
  - Use `localhost` URLs for browser-side API calls

### Routing (Next.js App Router)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `app/page.tsx` | Landing page with hero and feature cards |
| `/estimator` | `app/estimator/page.tsx` | Property Value Estimator form and results |
| `/analysis` | `app/analysis/page.tsx` | Market Analysis Dashboard with charts and tables |

### Loading and Error States

- **`loading.tsx`**: Automatically used by Next.js as a Suspense fallback during page loads and server data fetching
- **`error.tsx`**: React Error Boundary that catches errors in child components, displays a friendly message with a "Try again" reset button
- **`layout.tsx`**: Wraps `{children}` in `<Suspense fallback={<Loading />}>` for additional loading coverage

## Pages & Features

### Home (`/`)
- Hero section with call-to-action buttons
- Feature cards for each application
- Responsive layout (mobile-friendly)

### Property Estimator (`/estimator`)
- **Estimate Tab**: Property details form with client-side validation, instant price prediction, result display, and bar chart of recent estimates
- **History Tab**: Table of all past estimations with checkboxes for comparison
- **Compare Tab**: Side-by-side property cards with comparison bar chart
- **Form Validation**:
  - Real-time error messages on invalid input
  - Input constraints: `step`, `min`, `max` HTML attributes
  - String-based state management (no auto-zero on empty input)
  - Errors clear on input change
  - Submit blocked if validation fails
- **Responsive**: Single-column layout on mobile, two-column on desktop

### Market Analysis (`/analysis`)
- **Stats Cards**: Total properties, average price, price range, average square footage, average school rating
- **Charts**:
  - Pie chart: Price distribution by price ranges
  - Bar chart: Average price by bedroom count
- **What-If Analysis**: Enter base property features and see how changes affect predicted price across 6 scenarios
  - Same validation rules as the Estimator form
  - Results displayed in a sortable table with color-coded changes (green for positive, red for negative)
- **Property Listings Table**:
  - Filterable by bedrooms, price range, school rating
  - Sortable by all columns
  - Horizontal scroll on mobile
  - CSV export button
- **Responsive**: Stats cards 2-column on mobile, 4-column on desktop; filters wrap on small screens

## Design System

- **Color Scheme**: HSBC red/blue primary, with semantic colors (green for positive changes, red for errors/negative changes)
- **Typography**: Geist Sans / Geist Mono fonts via `next/font`
- **Components**: Cards, buttons, forms, tables with consistent Tailwind styling
- **Accessibility**: ARIA labels (`aria-invalid`, `aria-describedby`, `role="alert"`), focus-visible outlines, semantic HTML
- **Responsive**: Mobile-first responsive design with Tailwind breakpoints (`sm:`, `md:`, `lg:`)
  - Hamburger menu on mobile (`md:hidden`)
  - Grid columns adapt from 1 to 2 to 4
  - Tables with horizontal scroll on small screens
- **Loading States**: Spinner components with Suspense boundaries
- **Error Handling**: Error boundaries with retry functionality
- **Hydration**: `suppressHydrationWarning` on `<body>` for browser extension compatibility

## Custom Hooks

### `useApi<T>`
Generic hook for API requests with:
- `data`, `loading`, `error` state management
- AbortController for request cancellation on unmount
- Auto-execute on mount or manual trigger

### `useEstimatorApi`
Encapsulates Property Estimator API calls: `estimate()`, `getHistory()`, `clearHistory()`

### `useMarketApi`
Encapsulates Market Analysis API calls: `getStats()`, `getProperties()`, `runWhatIf()`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production (standalone output for Docker) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
