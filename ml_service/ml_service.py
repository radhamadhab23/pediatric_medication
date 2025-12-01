# ml_service/ml_service.py

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sys
import traceback

app = FastAPI()

# --- Model Loading ---
model = None
model_load_error = None

try:
    # Load the trained model
    # Make sure dosage_model.pkl is in the same folder as this file
    model = joblib.load("dosage_model.pkl")
    print("INFO:     Model loaded successfully.")
except Exception as e:
    # Capture the error to report it later
    model_load_error = traceback.format_exc()
    print(f"ERROR:    Error loading model: {e}", file=sys.stderr)
    print(model_load_error, file=sys.stderr)


# This is the schema of the data that will come from Node.js
class DosageRequest(BaseModel):
    medicineName: str
    weight: float
    # age is optional – add if your model uses it
    age: float | None = None

@app.get("/")
def read_root():
    """Root endpoint to check API status and model loading status."""
    if model_load_error:
        raise HTTPException(status_code=500, detail=f"API is running, but model failed to load: {model_load_error}")
    return {"status": "API is running and model loaded successfully."}


@app.post("/predict")
def predict_dosage(request: DosageRequest):
    """
    Expect JSON from Node.js like: 
    {
      "medicineName": "Adrenaline IV",
      "weight": 12.5,
      "age": 4   // optional
    }
    """
    if model is None:
        raise HTTPException(status_code=500, detail=f"Model is not loaded. See server logs for details. Error: {model_load_error}")

    try:
        # Map Node fields to model input columns
        # This assumes your model was trained on columns: ['weight_kg', 'medicine']
        data = pd.DataFrame([{
            "weight_kg": request.weight,
            "medicine": request.medicineName
            # If you trained with age too, add "age": request.age or default
        }])
        
        pred = model.predict(data)[0]
        return {"predicted_dosage_mg": float(pred)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error during prediction: {str(e)}")
