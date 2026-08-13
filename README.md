# HSBC Property Intelligence Platform

A full-stack property valuation and market analysis platform built with a microservices architecture. The system uses a machine learning model to predict housing prices and provides two independent applications — a Property Value Estimator (Python backend) and a Market Analysis Dashboard (Java backend) — unified through a Next.js web portal.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js Portal (:3000)                  │
│         App Router (RSC) + Tailwind CSS + Recharts       │
│  ┌──────────────────┬──────────────────────────────────┐ │
│  │ Property Estimator│     Market Analysis Dashboard    │ │
│  │    (App 1)        │            (App 2)               │ │
│  └──────────────────┴──────────────────────────────────┘ │
├────────────────────────┬────────────────────────────────┤
│  FastAPI (Python)      │   Spring Boot 3.4 (Java 21)     │
│  Port: 8001            │   Port: 8002                    │
│  Client-side validation│   Caffeine caching, CSV export  │
├────────────────────────┴────────────────────────────────┤
│           ML Model API (FastAPI + scikit-learn)          │
│                  Port: 8000                              │
│    Constrained Ridge Regression (L2), R² = 0.95          │
└─────────────────────────────────────────────────────────┘
```

## Services

| Service | Tech Stack | Port | Description |
|---------|-----------|------|-------------|
| `ml-api` | Python 3.12, FastAPI, scikit-learn, scipy | 8000 | ML regression model serving predictions |
| `property-estimator` | Python 3.12, FastAPI | 8001 | Property value estimation with history & comparison |
| `market-analysis` | Java 21, Spring Boot 3.4.4, Caffeine | 8002 | Market analytics, what-if analysis, CSV export |
| `portal` | Next.js 16, React 19, Tailwind CSS, Recharts | 3000 | Unified web portal with App Router |

## Quick Start

### Prerequisites

- Python 3.12+
- Java 21+
- Maven 3.9+
- Node.js 20+
- Docker & Docker Compose (optional, for containerized deployment)

### Option 1: Run with Docker Compose (Recommended)

```bash
docker compose up --build -d
```

All services will start and be available at their respective ports. The ML model is trained automatically during the Docker build.

To stop all services:

```bash
docker compose down
```

### Option 2: Run Locally (Development)

#### 1. Start ML Model API

```bash
cd ml-api
pip install -r requirements.txt
python train_model.py          # Train and save the model
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Visit http://localhost:8000/docs for Swagger/OpenAPI documentation.

#### 2. Start Property Estimator (Python Backend)

```bash
cd property-estimator
pip install -r requirements.txt
ML_API_URL=http://localhost:8000 uvicorn app.main:app --host 0.0.0.0 --port 8001
```

Visit http://localhost:8001/docs for API documentation.

#### 3. Start Market Analysis (Java Backend)

```bash
cd market-analysis
mvn clean package -DskipTests
java -jar target/market-analysis-1.0.0.jar
```

The API will be available at http://localhost:8002/api/health.

#### 4. Start Next.js Portal

```bash
cd portal
npm install
npm run dev
```

Visit http://localhost:3000 to access the web portal.

## API Endpoints

### ML Model API (`:8000`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/model-info` | Model type, coefficients, and performance metrics |
| POST | `/predict` | Predict price for a single property |
| POST | `/predict/batch` | Predict prices for multiple properties |

### Property Estimator (`:8001`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/estimate` | Get a price estimate for a property |
| POST | `/estimate/batch` | Batch estimation |
| GET | `/history` | Get estimation history |
| DELETE | `/history` | Clear estimation history |
| GET | `/compare?ids=1,2,3` | Compare multiple properties |

### Market Analysis (`:8002`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Aggregate market statistics |
| GET | `/api/price-distribution` | Price distribution data |
| GET | `/api/price-by-bedrooms` | Average price by bedroom count |
| GET | `/api/properties` | Filterable/sortable property listings |
| POST | `/api/predict` | Price prediction via ML model |
| POST | `/api/what-if` | What-if scenario analysis (6 scenarios) |
| GET | `/api/export/csv` | Export filtered data as CSV |

## Features

### App 1: Property Value Estimator
- Property details form with client-side validation and appropriate error messages
- Input constraints: square_footage/lot_size > 0 (float), bedrooms ≥ 0 (integer), bathrooms ≥ 0 (float), year_built 1800-2026 (integer), distance ≥ 0 (float), school_rating 0-10 (float)
- Instant price predictions with visual results
- Bar chart of recent estimates
- Estimation history tracking
- Side-by-side property comparison with charts

### App 2: Market Analysis Dashboard
- Key market statistics cards (avg price, price range, total properties, avg sqft)
- Interactive charts: price distribution pie chart, avg price by bedrooms bar chart
- What-if scenario analysis (6 scenarios: +200 sqft, +1 bedroom, +1 bathroom, school rating +1, 1 mile closer to city)
- Filterable and sortable property data table
- CSV data export
- Caching with Caffeine (10-minute TTL, max 1000 entries) for performance optimization

### Frontend (Next.js Portal)
- Next.js App Router for routing between and within applications
- Consistent design system across both applications (responsive layout, mobile hamburger menu)
- Server Components for initial data loading, Client Components for interactivity
- Proper loading and error states at the layout level (loading.tsx, error.tsx, Suspense)
- Client-side form validation with real-time error clearing
- Custom React hooks (`useApi`, `useEstimatorApi`, `useMarketApi`) for data fetching
- Hydration warning suppression for browser extension compatibility

### ML Model
- Algorithm: Constrained Ridge Regression (L2 regularization, α=10)
- Optimization: SLSQP (Sequential Least Squares Quadratic Programming) with domain-knowledge constraints
- Features: square footage, bedrooms, bathrooms, year built, lot size, distance to city center, school rating
- Performance: R² = 0.9545, RMSE ≈ $15,957
- Coefficient constraints: all features ≥ 0 except distance_to_city_center ≤ -$5,000/mile

## Model Details

The model uses **Constrained Ridge Regression** to handle severe multicollinearity in the dataset (all feature pairwise correlations > 0.9):

1. **StandardScaler** normalizes features for fair regularization
2. **Ridge (L2)** adds penalty `α·Σβ²` to stabilize coefficient estimates
3. **SLSQP constraints** enforce domain knowledge:
   - square_footage, bedrooms, bathrooms, year_built, lot_size, school_rating: coefficients ≥ 0
   - distance_to_city_center: coefficient ≤ -$5,000 (meaningful negative impact)
4. Coefficients are converted back to original scale for interpretable predictions

| Feature | Coefficient | Meaning |
|---------|-------------|---------|
| square_footage | +$32.83/sqft | Larger houses cost more |
| bedrooms | +$16,255/room | More bedrooms increase price |
| bathrooms | +$21,996/room | More bathrooms increase price |
| year_built | +$963/year | Newer houses cost more |
| lot_size | +$9.21/sqft | Larger lots cost more |
| distance_to_city_center | -$5,000/mile | Farther from city = cheaper |
| school_rating | +$22,511/point | Better schools increase price |

## Project Structure

```
.
├── ml-api/                    # ML prediction model service
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI application (prediction via X @ coefs + intercept)
│   │   └── model.pkl          # Trained model (generated by train_model.py)
│   ├── data/                  # Training dataset
│   │   └── House Price Dataset.csv
│   ├── train_model.py         # Model training script (Constrained Ridge via SLSQP)
│   ├── Dockerfile
│   └── requirements.txt
├── property-estimator/        # App 1 backend (Python)
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py            # FastAPI application with history & comparison
│   ├── Dockerfile
│   └── requirements.txt
├── market-analysis/           # App 2 backend (Java/Spring Boot)
│   ├── src/main/java/com/hsbc/marketanalysis/
│   │   ├── controller/        # REST controllers
│   │   ├── service/           # Business logic, data loading, caching
│   │   ├── model/             # Domain models (Property, etc.)
│   │   ├── dto/               # Request/Response DTOs
│   │   ├── client/            # ML API client (RestTemplate)
│   │   └── config/            # Caffeine cache configuration
│   ├── src/main/resources/
│   │   ├── data/              # Dataset (same as ml-api/data/)
│   │   └── application.properties
│   ├── Dockerfile
│   └── pom.xml
├── portal/                    # Next.js frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── layout.tsx     # Root layout with Navigation + Suspense
│   │   │   ├── loading.tsx    # Loading state (spinner)
│   │   │   ├── error.tsx      # Error boundary with reset
│   │   │   ├── page.tsx       # Home page
│   │   │   ├── estimator/     # Property Estimator (App 1)
│   │   │   └── analysis/      # Market Analysis (App 2)
│   │   ├── components/        # Shared components (Navigation, etc.)
│   │   ├── hooks/             # Custom hooks (useApi, useEstimatorApi, useMarketApi)
│   │   └── lib/               # API utilities (server/client URL resolution)
│   ├── Dockerfile
│   ├── next.config.ts
│   └── package.json
├── docker-compose.yml         # Multi-service orchestration
├── House Price Dataset.csv    # Source dataset (50 properties)
├── Test Data For Prediction.csv
└── Test Data Predictions.csv
```

## Environment Variables

| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `ML_API_URL` | property-estimator | `http://localhost:8000` | URL of the ML API service |
| `ml.api.url` | market-analysis | `http://localhost:8000` | URL of the ML API service (container: `http://ml-api:8000`) |
| `NEXT_PUBLIC_ESTIMATOR_API` | portal | `http://localhost:8001` | Estimator API URL (browser-side) |
| `NEXT_PUBLIC_MARKET_API` | portal | `http://localhost:8002` | Market API URL (browser-side) |
| `NEXT_PUBLIC_ML_API` | portal | `http://localhost:8000` | ML API URL (browser-side) |
| `SERVER_MARKET_API` | portal | `http://market-analysis:8002` | Market API URL (server-side, Docker) |
| `SERVER_ESTIMATOR_API` | portal | `http://property-estimator:8001` | Estimator API URL (server-side, Docker) |
| `SERVER_ML_API` | portal | `http://ml-api:8000` | ML API URL (server-side, Docker) |

## Dataset

The model is trained on a dataset of 50 properties with the following features:
- `square_footage` - Size of the house in square feet (float, > 0)
- `bedrooms` - Number of bedrooms (integer, ≥ 0)
- `bathrooms` - Number of bathrooms (float, ≥ 0)
- `year_built` - Year the house was constructed (integer, 1800-2026)
- `lot_size` - Size of the lot in square feet (float, > 0)
- `distance_to_city_center` - Distance to city center in miles (float, ≥ 0)
- `school_rating` - School district rating (float, 0-10 scale)
- `price` - Actual sale price (target variable)

## Technologies

- **Backend (Python)**: FastAPI, scikit-learn, scipy, pandas, numpy, httpx, Pydantic
- **Backend (Java)**: Spring Boot 3.4.4, Spring Web, Spring Cache, Caffeine, Apache Commons CSV, Jackson, RestTemplate
- **Frontend**: Next.js 16 (App Router, RSC), React 19, TypeScript, Tailwind CSS, Recharts, Lucide React
- **ML**: Constrained Ridge Regression (L2) with SLSQP optimization, StandardScaler
- **DevOps**: Docker, Docker Compose, Maven
