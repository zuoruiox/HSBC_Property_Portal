# HSBC Property Portal (Next.js Frontend)

A unified Next.js web portal that hosts two applications — Property Value Estimator and Market Analysis Dashboard — with shared navigation, consistent design system, and modern UI/UX.

## Tech Stack

- Next.js 16 (App Router)
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

Create a `.env.local` file:

```env
NEXT_PUBLIC_ESTIMATOR_API=http://localhost:8001
NEXT_PUBLIC_MARKET_API=http://localhost:8002
NEXT_PUBLIC_ML_API=http://localhost:8000
```

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_ESTIMATOR_API` | `http://localhost:8001` | Property Estimator backend URL |
| `NEXT_PUBLIC_MARKET_API` | `http://localhost:8002` | Market Analysis backend URL |
| `NEXT_PUBLIC_ML_API` | `http://localhost:8000` | ML Model API URL |

## Application Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with navigation
│   ├── page.tsx                # Home page (landing)
│   ├── loading.tsx             # Global loading state
│   ├── error.tsx               # Global error boundary
│   ├── globals.css             # Global styles (Tailwind)
│   ├── estimator/
│   │   └── page.tsx            # App 1: Property Value Estimator
│   └── analysis/
│       └── page.tsx            # App 2: Market Analysis Dashboard
├── components/
│   └── Navigation.tsx          # Shared navigation bar
├── lib/
│   └── api.ts                  # API client utilities
└── hooks/                      # Custom React hooks
```

## Pages & Features

### Home (`/`)
- Hero section with call-to-action buttons
- Feature cards for each application
- Architecture overview showing all services

### Property Estimator (`/estimator`)
- **Estimate Tab**: Property details form with client-side validation, instant price prediction, result display, and bar chart of recent estimates
- **History Tab**: Table of all past estimations with checkboxes for comparison
- **Compare Tab**: Side-by-side property cards with comparison bar chart
- Form validation for all 7 property features
- Visual price display with formatted currency
- Responsive grid layout

### Market Analysis (`/analysis`)
- **Stats Cards**: Total properties, average price, price range, average school rating
- **Charts**: Pie chart (price distribution), bar chart (avg price by bedrooms)
- **What-If Analysis**: Enter base property features and see how changes (add sqft, bedroom, bathroom, school rating, proximity to city) affect predicted price
- **Property Table**: Filterable by bedrooms, price, school rating; sortable by all columns
- **CSV Export**: Download filtered property data

## Design System

- **Color Scheme**: Blue primary, with semantic colors (green for positive, red for errors, purple for accents)
- **Typography**: Geist Sans / Geist Mono fonts
- **Components**: Cards, buttons, forms, tables with consistent styling
- **Accessibility**: ARIA labels, focus-visible outlines, semantic HTML
- **Responsive**: Mobile-first responsive design with Tailwind breakpoints
- **Loading States**: Spinner components with Suspense boundaries
- **Error Handling**: Error boundaries with retry functionality
- **Transitions**: Smooth CSS transitions on interactive elements

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production (standalone output) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
