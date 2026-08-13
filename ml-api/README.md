# ML Model API - Housing Price Prediction

A containerized FastAPI service that serves a Constrained Ridge Regression model for predicting housing prices. The model uses L2 regularization with domain-knowledge constraints to handle multicollinearity in the training data.

## Tech Stack

- Python 3.12+
- FastAPI
- scikit-learn (StandardScaler, Ridge)
- scipy (SLSQP constrained optimization)
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

The model is trained automatically during the Docker build via `python train_model.py`.

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

Returns model type, coefficients, intercept, and performance metrics (R², MSE, MAE, RMSE).

## Model Details

### Algorithm: Constrained Ridge Regression (L2)

The dataset exhibits severe multicollinearity (all feature pairwise correlations > 0.9), which causes ordinary least squares (OLS) to produce counter-intuitive coefficients (e.g., negative coefficients for square footage and bedrooms). The solution uses:

1. **StandardScaler**: Normalizes features to zero mean and unit variance for fair regularization
2. **Ridge (L2 Regularization)**: Adds penalty `α·Σβ²` (α=10) to stabilize coefficient estimates
3. **SLSQP Constrained Optimization**: Enforces domain-knowledge constraints via scipy's `minimize`:
   - `square_footage`, `bedrooms`, `bathrooms`, `year_built`, `lot_size`, `school_rating`: coefficients ≥ 0
   - `distance_to_city_center`: coefficient ≤ -$5,000/mile (meaningful negative impact)
4. **Coefficient Conversion**: Converts standardized coefficients back to original scale for interpretable predictions: `b_original = b_scaled / scale`, `intercept_original = b0_scaled - mean · (b_scaled / scale)`

### Model Coefficients

| Feature | Coefficient | Meaning |
|---------|-------------|---------|
| square_footage | +$32.83/sqft | Larger houses cost more |
| bedrooms | +$16,255/room | More bedrooms increase price |
| bathrooms | +$21,996/room | More bathrooms increase price |
| year_built | +$963/year | Newer houses cost more |
| lot_size | +$9.21/sqft | Larger lots cost more |
| distance_to_city_center | -$5,000/mile | Farther from city = cheaper |
| school_rating | +$22,511/point | Better schools increase price |

### Performance

- **R²**: 0.9545
- **RMSE**: ~$15,957
- **MAE**: ~$15,141
- **Training**: 80/20 train-test split with `random_state=42`

### Prediction

The model is stored as a plain dictionary (coefficients array + intercept) to avoid pickle custom class dependency issues. Predictions are computed as a simple matrix multiplication:

```python
prediction = X @ coefs + intercept
```

## Input Validation

All input fields are validated via Pydantic:

| Field | Type | Constraint |
|-------|------|------------|
| square_footage | float | > 0 |
| bedrooms | int | ≥ 0 |
| bathrooms | float | ≥ 0 |
| year_built | int | 1800-2026 |
| lot_size | float | > 0 |
| distance_to_city_center | float | ≥ 0 |
| school_rating | float | 0-10 |

## Interactive Docs

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
