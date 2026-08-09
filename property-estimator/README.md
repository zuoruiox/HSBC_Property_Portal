# Property Value Estimator (App 1 - Python Backend)

FastAPI backend for the Property Value Estimator application. Handles form submissions, integrates with the ML model API, manages estimation history, and supports property comparison.

## Tech Stack

- Python 3.12+
- FastAPI
- httpx (for ML API communication)
- Pydantic v2 (data validation)

## Quick Start

### Local Development

```bash
pip install -r requirements.txt
ML_API_URL=http://localhost:8000 uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Docker

```bash
docker build -t property-estimator .
docker run -p 8001:8001 -e ML_API_URL=http://ml-api:8000 property-estimator
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ML_API_URL` | `http://localhost:8000` | URL of the ML prediction API |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/estimate` | Submit property features and get a price estimate |
| POST | `/estimate/batch` | Submit multiple properties for estimation |
| GET | `/history` | Retrieve all past estimations |
| DELETE | `/history` | Clear estimation history |
| GET | `/compare?ids=1,2,3` | Compare multiple properties by ID |

### Request Example

```bash
curl -X POST http://localhost:8001/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6,
    "property_name": "My Dream Home"
  }'
```

### Response Example

```json
{
  "id": 1,
  "property_name": "My Dream Home",
  "features": {
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6
  },
  "predicted_price": 258061.41,
  "timestamp": "2026-08-09T16:54:51.325605"
}
```

## Features

- **Data Validation**: Pydantic models validate all input fields with appropriate constraints
- **Error Handling**: Graceful error responses when ML service is unavailable
- **History Tracking**: In-memory storage of all estimations (for demo purposes)
- **CORS Enabled**: Configured to allow cross-origin requests from the frontend

## Interactive Docs

- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc
