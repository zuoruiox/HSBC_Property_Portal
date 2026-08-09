# ML Model API - Housing Price Prediction

A containerized FastAPI service that serves a scikit-learn linear regression model for predicting housing prices.

## Tech Stack

- Python 3.12+
- FastAPI
- scikit-learn
- pandas / numpy
- Pydantic v2

## Quick Start

### Local Development

```bash
pip install -r requirements.txt
python train_model.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Docker

```bash
docker build -t ml-api .
docker run -p 8000:8000 ml-api
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/model-info` | Returns model type, features, coefficients, intercept, and metrics |
| POST | `/predict` | Predict price for a single property |
| POST | `/predict/batch` | Predict prices for a batch of properties |

### Request/Response Examples

**Single Prediction**

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6
  }'
```

Response:
```json
{
  "predicted_price": 258061.41
}
```

**Batch Prediction**

```bash
curl -X POST http://localhost:8000/predict/batch \
  -H "Content-Type: application/json" \
  -d '{"houses": [{...}, {...}]}'
```

**Model Info**

```bash
curl http://localhost:8000/model-info
```

Returns model coefficients, intercept, and performance metrics (R², MSE, MAE, RMSE).

## Model Details

- **Algorithm**: Linear Regression
- **Features**: 7 property attributes
- **Performance**: R² = 0.98, RMSE ≈ $10,277
- **Training**: 80/20 train-test split with random_state=42

## Interactive Docs

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
