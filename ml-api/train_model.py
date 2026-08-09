"""Train the housing price regression model and save it."""
import pickle
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import numpy as np

# Load dataset
df = pd.read_csv("data/House Price Dataset.csv")

feature_cols = [
    "square_footage", "bedrooms", "bathrooms", "year_built",
    "lot_size", "distance_to_city_center", "school_rating"
]

X = df[feature_cols]
y = df["price"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = LinearRegression()
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

metrics = {
    "r2_score": round(r2_score(y_test, y_pred), 4),
    "mean_squared_error": round(mean_squared_error(y_test, y_pred), 2),
    "mean_absolute_error": round(mean_absolute_error(y_test, y_pred), 2),
    "root_mean_squared_error": round(np.sqrt(mean_squared_error(y_test, y_pred)), 2),
}

coefficients = dict(zip(feature_cols, [round(c, 4) for c in model.coef_]))
intercept = round(model.intercept_, 4)

model_data = {
    "model": model,
    "feature_names": feature_cols,
    "metrics": metrics,
    "coefficients": coefficients,
    "intercept": intercept,
}

with open("app/model.pkl", "wb") as f:
    pickle.dump(model_data, f)

print("Model trained and saved successfully!")
print(f"Metrics: {metrics}")
print(f"Coefficients: {coefficients}")
print(f"Intercept: {intercept}")
