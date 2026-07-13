import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load the model
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
model = None

if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Error loading model: {e}")
else:
    print("Warning: model.pkl not found. Please run train_model.py first.")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    global model
    if model is None:
        if os.path.exists(MODEL_PATH):
            try:
                model = joblib.load(MODEL_PATH)
            except Exception as e:
                return jsonify({"error": f"Model is not loaded and failed to load: {str(e)}"}), 500
        else:
            return jsonify({"error": "Model file not found. Please train the model."}), 500
            
    try:
        data = request.get_json(force=True)
        
        # Required features list
        features = [
            'age', 'gender', 'cp', 'trestbps', 'chol', 'fbs', 
            'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'
        ]
        
        # Check if all features exist
        missing_features = [f for f in features if f not in data]
        if missing_features:
            return jsonify({"error": f"Missing features: {missing_features}"}), 400
            
        # Parse inputs to correct type
        input_data = {}
        for f in features:
            if f in ['age', 'gender', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'slope', 'ca', 'thal']:
                input_data[f] = int(data[f])
            else: # oldpeak is float
                input_data[f] = float(data[f])
                
        # Create DataFrame (retains feature names for scikit-learn compatibility)
        df_input = pd.DataFrame([input_data])
        
        # Predict probability
        probabilities = model.predict_proba(df_input)[0]
        prediction = int(model.predict(df_input)[0])
        
        # Confidence is the probability of the predicted class
        confidence = float(probabilities[prediction]) * 100
        
        # High Risk probability specifically (class 1)
        risk_probability = float(probabilities[1]) * 100
        
        return jsonify({
            "prediction": prediction,
            "confidence": round(confidence, 2),
            "risk_probability": round(risk_probability, 2),
            "status": "High Risk" if prediction == 1 else "Healthy"
        })
        
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

if __name__ == '__main__':
    # Running on port 5001 to avoid port 5000 conflicts with Express
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
