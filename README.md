# HSBC Property Intelligence Platform

A full-stack property valuation and market analysis platform built with a microservices architecture. The system uses a machine learning model to predict housing prices and provides two independent applications — a Property Value Estimator (Python backend) and a Market Analysis Dashboard (Java backend) — unified through a Next.js web portal.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js Portal (:3000)                  │
│              App Router + Tailwind CSS + Recharts         │
├────────────────────────┬────────────────────────────────┤
│  Property Estimator    │     Market Analysis Dashboard   │
│  (App 1)               │          (App 2)                │
├────────────────────────┼────────────────────────────────┤
│  FastAPI (Python)      │   Spring Boot 3.4 (Java 21)     │
│  Port: 8001            │   Port: 8002                    │
├────────────────────────┴────────────────────────────────┤
│           ML Model API (FastAPI + scikit-learn)          │
│                  Port: 8000                              │
│         Linear Regression (R² = 0.98)                    │
└─────────────────────────────────────────────────────────┘
```

## Services

| Service | Tech Stack | Port | Description |
|---------|-----------|------|-------------|
| `ml-api` | Python 3.12, FastAPI, scikit-learn | 8000 | ML regression model serving predictions |
| `property-estimator` | Python 3.12, FastAPI | 8001 | Property value estimation with history & comparison |
| `market-analysis` | Java 21, Spring Boot 3.4.4 | 8002 | Market analytics, what-if analysis, CSV export |
| `portal` | Next.js 16, React, Tailwind CSS | 3000 | Unified web portal with App Router |

## Quick Start

### Prerequisites

- Python 3.12+
- Java 21+
- Maven 3.9+
- Node.js 20+
- Docker & Docker Compose (optional, for containerized deployment)

### Option 1: Run with Docker Compose (Recommended)

```bash
docker-compose up --build
```

All services will start and be available at their respective ports.

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
| GET | `/model-info` | Model coefficients and performance metrics |
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
| POST | `/api/what-if` | What-if scenario analysis |
| GET | `/api/export/csv` | Export filtered data as CSV |

## Features

### App 1: Property Value Estimator
- Property details form with client-side validation
- Instant price predictions with visual results
- Bar chart of recent estimates
- Estimation history tracking
- Side-by-side property comparison with charts

### App 2: Market Analysis Dashboard
- Key market statistics cards (avg price, price range, etc.)
- Interactive charts: price distribution pie chart, avg price by bedrooms bar chart
- What-if scenario analysis (see how changes affect price)
- Filterable and sortable property data table
- CSV data export
- Caching with Caffeine for performance

### ML Model
- Algorithm: Linear Regression (scikit-learn)
- Features: square footage, bedrooms, bathrooms, year built, lot size, distance to city center, school rating
- Performance: R² = 0.98, RMSE ≈ $10,277

## Project Structure

```
.
├── ml-api/                    # ML prediction model service
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py            # FastAPI application
│   ├── data/                  # Training dataset
│   ├── train_model.py         # Model training script
│   ├── Dockerfile
│   └── requirements.txt
├── property-estimator/        # App 1 backend (Python)
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── market-analysis/           # App 2 backend (Java/Spring Boot)
│   ├── src/main/java/com/hsbc/marketanalysis/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── model/
│   │   ├── dto/
│   │   ├── client/
│   │   └── config/
│   ├── src/main/resources/
│   ├── Dockerfile
│   └── pom.xml
├── portal/                    # Next.js frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── page.tsx       # Home page
│   │   │   ├── estimator/     # Property Estimator (App 1)
│   │   │   └── analysis/      # Market Analysis (App 2)
│   │   ├── components/        # Shared components
│   │   └── lib/               # API utilities
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml         # Multi-service orchestration
├── House Price Dataset.csv    # Training data
├── Test Data For Prediction.csv # Test data
└── Test Data Predictions.csv  # Model predictions for test data
```

## Environment Variables

| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `ML_API_URL` | property-estimator | `http://localhost:8000` | URL of the ML API service |
| `ml.api.url` | market-analysis | `http://localhost:8000` | URL of the ML API service |
| `NEXT_PUBLIC_ESTIMATOR_API` | portal | `http://localhost:8001` | Estimator API URL |
| `NEXT_PUBLIC_MARKET_API` | portal | `http://localhost:8002` | Market Analysis API URL |
| `NEXT_PUBLIC_ML_API` | portal | `http://localhost:8000` | ML API URL |

## Dataset

The model is trained on a dataset of 50 properties with the following features:
- `square_footage` - Size of the house in square feet
- `bedrooms` - Number of bedrooms
- `bathrooms` - Number of bathrooms
- `year_built` - Year the house was constructed
- `lot_size` - Size of the lot in square feet
- `distance_to_city_center` - Distance to city center in miles
- `school_rating` - School district rating (0-10 scale)
- `price` - Actual sale price (target variable)

## Technologies

- **Backend (Python)**: FastAPI, scikit-learn, pandas, numpy, httpx, Pydantic
- **Backend (Java)**: Spring Boot 3.4.4, Spring Web, Spring Cache, Caffeine, Apache Commons CSV, Jackson
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Recharts, Lucide React
- **DevOps**: Docker, Docker Compose, Maven
