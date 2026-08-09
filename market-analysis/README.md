# Market Analysis Service (App 2 - Java Backend)

Spring Boot 3.4 backend for the Property Market Analysis Dashboard. Provides REST APIs for market statistics, property filtering, what-if analysis, and data export. Integrates with the ML model API for predictions.

## Tech Stack

- Java 21
- Spring Boot 3.4.4
- Spring Web (REST APIs)
- Spring Cache + Caffeine (performance caching)
- Spring Validation
- Apache Commons CSV (data loading)
- Jackson (JSON serialization with snake_case naming)
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
| `ml.api.url` | `http://localhost:8000` | ML Model API URL |

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Aggregate market statistics |
| GET | `/api/price-distribution` | Price distribution by price ranges |
| GET | `/api/price-by-bedrooms` | Average price grouped by bedroom count |
| GET | `/api/properties` | Filterable and sortable property listings |
| POST | `/api/predict` | Get price prediction from ML model |
| POST | `/api/what-if` | Run what-if scenario analysis |
| GET | `/api/export/csv` | Export filtered properties as CSV |

### Query Parameters for `/api/properties`

| Parameter | Type | Description |
|-----------|------|-------------|
| `minBedrooms` | int | Minimum number of bedrooms |
| `maxBedrooms` | int | Maximum number of bedrooms |
| `minPrice` | double | Minimum price |
| `maxPrice` | double | Maximum price |
| `minSchoolRating` | double | Minimum school rating |
| `sortBy` | string | Sort field (id, price, squareFootage, yearBuilt, schoolRating) |
| `sortDir` | string | Sort direction (asc, desc) |

### What-If Analysis Example

```bash
curl -X POST http://localhost:8002/api/what-if \
  -H "Content-Type: application/json" \
  -d '{
    "square_footage": 1800,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 2000,
    "lot_size": 7500,
    "distance_to_city_center": 5,
    "school_rating": 8
  }'
```

Returns the base prediction plus scenarios for adding sqft, bedrooms, bathrooms, improving school rating, and moving closer to the city.

## Features

- **Caching**: Caffeine cache with 10-minute TTL for stats, distributions, and predictions
- **CORS**: Configured to allow cross-origin requests
- **BOM Handling**: CSV loader handles UTF-8 BOM in data files
- **Snake_case JSON**: Automatic conversion between camelCase (Java) and snake_case (API)
- **Validation**: Jakarta Bean Validation on prediction requests
- **CSV Export**: Download filtered property data as CSV file

## Project Structure

```
src/main/java/com/hsbc/marketanalysis/
├── MarketAnalysisApplication.java   # Spring Boot entry point
├── config/
│   └── AppConfig.java               # Caching, CORS, ObjectMapper config
├── client/
│   └── MlApiClient.java             # REST client for ML API
├── controller/
│   └── MarketAnalysisController.java # REST endpoints
├── service/
│   ├── DataLoaderService.java       # CSV data loading
│   └── MarketAnalysisService.java   # Business logic
├── model/
│   └── Property.java                # Property entity
└── dto/
    ├── MarketStats.java             # Statistics response
    ├── PredictionRequest.java       # Prediction input
    ├── PredictionResponse.java      # Prediction output
    └── WhatIfResult.java            # What-if scenario result
```
