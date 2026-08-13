"""Train the housing price regression model and save it."""
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge as SklearnRidge
from scipy.optimize import minimize

# Load dataset
df = pd.read_csv("data/House Price Dataset.csv")

feature_cols = [
    "square_footage", "bedrooms", "bathrooms", "year_built",
    "lot_size", "distance_to_city_center", "school_rating"
]

X = df[feature_cols].values
y = df["price"].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Standardize features for stable optimization
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

n_features = X_train_scaled.shape[1]
alpha = 10  # L2 regularization strength

dist_idx = feature_cols.index("distance_to_city_center")

# Domain-knowledge constraint: distance_to_city_center should have a meaningful
# negative coefficient (at least -$5000 per mile). All other features >= 0.
min_dist_penalty = 5000
min_dist_scaled = min_dist_penalty * scaler.scale_[dist_idx]

# Objective: Ridge loss = ||y - Xb - b0||^2 + alpha * ||b||^2
def objective(params):
    b0 = params[0]
    b = params[1:]
    residuals = y_train - (X_train_scaled @ b + b0)
    return np.sum(residuals ** 2) + alpha * np.sum(b ** 2)

# Constraints
constraints = []
for i in range(n_features):
    if i == dist_idx:
        constraints.append({
            "type": "ineq",
            "fun": lambda p, idx=i, mm=min_dist_scaled: -p[idx + 1] - mm,
        })
    else:
        constraints.append({
            "type": "ineq",
            "fun": lambda p, idx=i: p[idx + 1],
        })

# Initial guess from unconstrained Ridge
ridge_init = SklearnRidge(alpha=alpha)
ridge_init.fit(X_train_scaled, y_train)
x0 = np.concatenate([[ridge_init.intercept_], ridge_init.coef_])

result = minimize(
    objective, x0, method="SLSQP", constraints=constraints,
    options={"maxiter": 10000, "ftol": 1e-12}
)

b0_scaled = result.x[0]
b_scaled = result.x[1:]

# Convert standardized coefficients back to original scale
b_original = b_scaled / scaler.scale_
b0_original = float(b0_scaled - np.sum(b_scaled * scaler.mean_ / scaler.scale_))

y_pred = X_test @ b_original + b0_original

metrics = {
    "r2_score": round(float(r2_score(y_test, y_pred)), 4),
    "mean_squared_error": round(float(mean_squared_error(y_test, y_pred)), 2),
    "mean_absolute_error": round(float(mean_absolute_error(y_test, y_pred)), 2),
    "root_mean_squared_error": round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 2),
}

coefficients = dict(zip(feature_cols, [round(float(c), 4) for c in b_original]))
intercept = round(b0_original, 4)

# Store model as plain dict with coefs and intercept (no custom class needed for pickle)
model_data = {
    "coefs": b_original.tolist(),
    "intercept": b0_original,
    "feature_names": feature_cols,
    "metrics": metrics,
    "coefficients": coefficients,
    "model_type": "Constrained Ridge Regression (L2)",
    "alpha": alpha,
}

with open("app/model.pkl", "wb") as f:
    pickle.dump(model_data, f)

print("Model trained and saved successfully!")
print(f"Metrics: {metrics}")
print(f"Coefficients: {coefficients}")
print(f"Intercept: {intercept}")
