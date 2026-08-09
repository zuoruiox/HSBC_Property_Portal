"""FastAPI backend for Property Value Estimator (App 1)."""
import os
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx

app = FastAPI(title="Property Value Estimator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ML_API_URL = os.getenv("ML_API_URL", "http://localhost:8000")

# In-memory history storage (for demo purposes)
estimation_history: List[dict] = []


class HouseFeaturesInput(BaseModel):
    square_footage: float = Field(..., gt=0, description="Square footage of the house")
    bedrooms: int = Field(..., ge=0, description="Number of bedrooms")
    bathrooms: float = Field(..., ge=0, description="Number of bathrooms")
    year_built: int = Field(..., ge=1800, le=2026, description="Year built")
    lot_size: float = Field(..., gt=0, description="Lot size in sq ft")
    distance_to_city_center: float = Field(..., ge=0, description="Distance to city center in miles")
    school_rating: float = Field(..., ge=0, le=10, description="School rating (0-10)")
    property_name: Optional[str] = Field(None, description="Optional name for the property")


class EstimationResult(BaseModel):
    id: int
    property_name: Optional[str]
    features: dict
    predicted_price: float
    timestamp: str


class BatchEstimationInput(BaseModel):
    houses: List[HouseFeaturesInput]


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/estimate", response_model=EstimationResult)
async def estimate_price(house: HouseFeaturesInput):
    """Submit property details and get a price estimate."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{ML_API_URL}/predict",
                json={
                    "square_footage": house.square_footage,
                    "bedrooms": house.bedrooms,
                    "bathrooms": house.bathrooms,
                    "year_built": house.year_built,
                    "lot_size": house.lot_size,
                    "distance_to_city_center": house.distance_to_city_center,
                    "school_rating": house.school_rating,
                },
            )
            response.raise_for_status()
            prediction = response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail=f"ML service unavailable: {str(e)}")

    result = {
        "id": len(estimation_history) + 1,
        "property_name": house.property_name or f"Property {len(estimation_history) + 1}",
        "features": house.model_dump(exclude={"property_name"}),
        "predicted_price": prediction["predicted_price"],
        "timestamp": datetime.now().isoformat(),
    }
    estimation_history.append(result)
    return EstimationResult(**result)


@app.post("/estimate/batch", response_model=List[EstimationResult])
async def estimate_batch(batch: BatchEstimationInput):
    """Submit multiple properties for estimation."""
    results = []
    for house in batch.houses:
        result = await estimate_price(house)
        results.append(result)
    return results


@app.get("/history", response_model=List[EstimationResult])
def get_history():
    """Get estimation history."""
    return estimation_history


@app.delete("/history")
def clear_history():
    """Clear estimation history."""
    estimation_history.clear()
    return {"status": "cleared"}


@app.get("/compare")
def compare_properties(ids: str):
    """Compare multiple properties by their IDs (comma-separated)."""
    id_list = [int(i) for i in ids.split(",")]
    results = [r for r in estimation_history if r["id"] in id_list]
    if not results:
        raise HTTPException(status_code=404, detail="No properties found")
    return {"properties": results, "count": len(results)}
