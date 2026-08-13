# Market Analysis Service (App 2 - Java Backend)

Spring Boot 3.4 backend for the Property Market Analysis Dashboard. Provides REST APIs for market statistics, property filtering, what-if scenario analysis, and data export. Integrates with the ML model API for predictions via RestTemplate.

## Tech Stack

- Java 21
- Spring Boot 3.4.4
- Spring Web (REST APIs)
- Spring Cache + Caffeine (in-memory performance caching)
- Spring Validation (Jakarta Bean Validation)
- Apache Commons CSV (data loading with BOM handling)
- Jackson (JSON serialization with snake_case/PropertyNamingStrategies)
- RestTemplate (ML API HTTP client)
- Maven (build tool)

## Quick Start

### Prerequisites

- Java 21+
- Maven 3.9+

### Local Development

```bash
mvn clean package -DskipTests
java -jar target/market-analysis-1.0.0.jar
```

Or run with Maven directly:

```bash
mvn spring-boot:run
```

### Docker

```bash
docker build -t market-analysis .
docker run -p 8002:8002 -e ml.api.url=http://ml-api:8000 market-analysis
```

## Configuration

Application properties (`src/main/resources/application.properties`):

| Property | Default | Description |
|----------|---------|-------------|
| `server.port` | `8002` | Server port |
| `spring.application.name` | `market-analysis` | Application name |
| `ml.api.url` | `http://localhost:8000` | ML Model API URL (container: `http://ml-api:8000`) |

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Aggregate market statistics (cached) |
| GET | `/api/price-distribution` | Price distribution by price ranges (cached) |
| GET | `/api/price-by-bedrooms` | Average price grouped by bedroom count (cached) |
| GET | `/api/properties` | Filterable and sortable property listings |
| POST | `/api/predict` | Get price prediction from ML model (cached) |
| POST | `/api/what-if` | Run what-if scenario analysis (6 scenarios) |
| GET | `/api/export/csv` | Export filtered properties as CSV file |

### Query Parameters for `/api/properties`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `minBedrooms` | int | - | Minimum number of bedrooms |
| `maxBedrooms` | int | - | Maximum number of bedrooms |
| `minPrice` | double | - | Minimum price |
| `maxPrice` | double | - | Maximum price |
| `minSchoolRating` | double | - | Minimum school rating |
| `sortBy` | string | `id` | Sort field (id, price, squareFootage, yearBuilt, schoolRating) |
| `sortDir` | string | `asc` | Sort direction (asc, desc) |

### What-If Analysis

The `/api/what-if` endpoint takes a base property and returns 6 scenarios:

| Scenario | Change |
|----------|--------|
| Base Scenario | No change (baseline prediction) |
| Add 200 sqft | square_footage +200 |
| Add 1 bedroom | bedrooms +1 |
| Add 1 bathroom | bathrooms +1 |
| School rating +1 | school_rating +1 |
| 1 mile closer to city | distance_to_city_center -1 |

Each scenario includes the predicted price, absolute difference from baseline, and percentage change.

Example:

```bash
curl -X POST http://localhost:8002/api/what-if \
  -H "Content-Type: application/json" \
  -d '{
    "squareFootage": 1800,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 2000,
    "lotSize": 7500,
    "distanceToCityCenter": 5,
    "schoolRating": 8
  }'
```

## Caching

Caffeine cache is configured in `AppConfig.java` with 4 cache regions:

| Cache Name | Purpose | TTL | Max Entries |
|------------|---------|-----|-------------|
| `marketStats` | Market statistics | 10 minutes | 1000 |
| `priceDistribution` | Price distribution data | 10 minutes | 1000 |
| `priceByBedrooms` | Avg price by bedrooms | 10 minutes | 1000 |
| `predictions` | ML model predictions | 10 minutes | 1000 |

Caching is applied via Spring's `@Cacheable` annotation on service methods. Identical prediction requests return cached results without calling the ML API.

## Features

- **Caching**: Caffeine cache with 10-minute TTL for stats, distributions, and predictions
- **CORS**: Configured to allow cross-origin requests from the frontend portal
- **BOM Handling**: CSV loader handles UTF-8 BOM (`0xEF 0xBB 0xBF`) in data files
- **Snake_case JSON**: Automatic conversion between camelCase (Java fields) and snake_case (API JSON) via `PropertyNamingStrategies.SNAKE_CASE`
- **Validation**: Jakarta Bean Validation (`@Valid`, `@Positive`, `@Min`, `@Max`, etc.) on prediction requests
- **CSV Export**: Download filtered property data as CSV file with proper Content-Disposition headers
- **ML API Client**: Uses RestTemplate with ObjectMapper for proper JSON serialization to the ML API
- **Data Loading**: CSV data loaded once at startup via `@PostConstruct`, with classpath and filesystem fallback paths

## Project Structure

```
src/main/java/com/hsbc/marketanalysis/
├── MarketAnalysisApplication.java   # Spring Boot entry point (@EnableCaching)
├── config/
│   └── AppConfig.java               # Caffeine cache manager, CORS, ObjectMapper, RestTemplate
├── client/
│   └── MlApiClient.java             # REST client for ML API (RestTemplate + @Cacheable)
├── controller/
│   └── MarketAnalysisController.java # REST endpoints
├── service/
│   ├── DataLoaderService.java       # CSV data loading at startup (BOM-aware)
│   └── MarketAnalysisService.java   # Business logic, filtering, stats, what-if
├── model/
│   └── Property.java                # Property entity (POJO)
└── dto/
    ├── MarketStats.java             # Statistics response DTO
    ├── PriceDistributionItem.java   # Price distribution bucket DTO
    ├── PriceByBedroomsItem.java     # Bedroom grouping DTO
    ├── PredictionRequest.java       # Prediction input (with validation)
    ├── PredictionResponse.java      # Prediction output DTO
    └── WhatIfResult.java            # What-if scenario result DTO
```

## Dataset

The service loads property data from `src/main/resources/data/House Price Dataset.csv` (50 properties) at startup. The same dataset is used by the ML API for model training.
