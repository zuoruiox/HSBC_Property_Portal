"""FastAPI application for housing price prediction."""
import pickle
import os
from typing import List

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import pandas as pd

app = FastAPI(
    title="Housing Price Prediction API",
    description="A regression model API that predicts housing prices based on property features.",
    version="1.0.0",
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

with open(MODEL_PATH, "rb") as f:
    model_data = pickle.load(f)

coefs = np.array(model_data["coefs"], dtype=float)
intercept = float(model_data["intercept"])
feature_names = model_data["feature_names"]
metrics = model_data["metrics"]
coefficients = model_data["coefficients"]
model_type = model_data.get("model_type", "Linear Regression")


def predict(features_df: pd.DataFrame) -> float:
    """Predict using stored coefficients: y = X @ coefs + intercept."""
    X = features_df[feature_names].values.astype(float)
    return float(X @ coefs + intercept)


class HouseFeatures(BaseModel):
    """Single house features for prediction."""
    square_footage: float = Field(..., gt=0, description="Square footage of the house")
    bedrooms: int = Field(..., ge=0, description="Number of bedrooms")
    bathrooms: float = Field(..., ge=0, description="Number of bathrooms")
    year_built: int = Field(..., ge=1800, le=2026, description="Year the house was built")
    lot_size: float = Field(..., gt=0, description="Lot size in sq ft")
    distance_to_city_center: float = Field(..., ge=0, description="Distance to city center in miles")
    school_rating: float = Field(..., ge=0, le=10, description="School rating (0-10)")


class BatchHouseFeatures(BaseModel):
    """Batch of houses for prediction."""
    houses: List[HouseFeatures]


class PredictionResponse(BaseModel):
    predicted_price: float


class BatchPredictionResponse(BaseModel):
    predictions: List[float]


class ModelInfoResponse(BaseModel):
    model_type: str
    features: List[str]
    coefficients: dict
    intercept: float
    metrics: dict


@app.get("/health", tags=["Health"])
def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy", "model_loaded": coefs is not None}


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict_single(house: HouseFeatures):
    """Predict price for a single house."""
    try:
        df = pd.DataFrame([house.model_dump()])
        prediction = predict(df)
        return PredictionResponse(predicted_price=round(prediction, 2))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Prediction"])
def predict_batch(batch: BatchHouseFeatures):
    """Predict prices for a batch of houses."""
    try:
        df = pd.DataFrame([h.model_dump() for h in batch.houses])
        X = df[feature_names].values.astype(float)
        predictions = X @ coefs + intercept
        return BatchPredictionResponse(predictions=[round(float(p), 2) for p in predictions])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")


@app.get("/model-info", response_model=ModelInfoResponse, tags=["Model Info"])
def model_info():
    """Return model coefficients and performance metrics."""
    return ModelInfoResponse(
        model_type=model_type,
        features=feature_names,
        coefficients=coefficients,
        intercept=intercept,
        metrics=metrics,
    )
