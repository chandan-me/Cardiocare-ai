import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

def generate_synthetic_data(num_samples=1000):
    np.random.seed(42)
    
    # Generate features
    age = np.random.randint(29, 78, size=num_samples)
    gender = np.random.choice([0, 1], size=num_samples, p=[0.32, 0.68]) # 0: Female, 1: Male
    cp = np.random.choice([0, 1, 2, 3], size=num_samples, p=[0.47, 0.17, 0.28, 0.08]) # Chest pain type
    trestbps = np.random.randint(94, 201, size=num_samples) # Resting blood pressure
    chol = np.random.randint(126, 565, size=num_samples) # Cholesterol
    fbs = np.random.choice([0, 1], size=num_samples, p=[0.85, 0.15]) # Fasting blood sugar
    restecg = np.random.choice([0, 1, 2], size=num_samples, p=[0.49, 0.48, 0.03]) # Rest ECG
    thalach = np.random.randint(71, 203, size=num_samples) # Max heart rate
    exang = np.random.choice([0, 1], size=num_samples, p=[0.67, 0.33]) # Exercise induced angina
    oldpeak = np.round(np.random.uniform(0.0, 6.2, size=num_samples), 1) # ST depression
    slope = np.random.choice([0, 1, 2], size=num_samples, p=[0.07, 0.46, 0.47]) # ST slope
    ca = np.random.choice([0, 1, 2, 3, 4], size=num_samples, p=[0.58, 0.21, 0.12, 0.07, 0.02]) # Major vessels
    thal = np.random.choice([0, 1, 2, 3], size=num_samples, p=[0.01, 0.54, 0.38, 0.07]) # Thalassemia
    
    # Define a risk score to create realistic targets
    # Age + Male + BP > 130 + Chol > 240 + High Oldpeak + low Max HR + Angina = Higher risk
    risk_score = (
        (age - 40) * 0.03 +
        gender * 0.5 +
        (cp == 0).astype(int) * 0.8 + 
        (trestbps > 130).astype(int) * 0.5 +
        (chol > 240).astype(int) * 0.4 +
        fbs * 0.2 +
        (thalach < 130).astype(int) * 0.6 +
        exang * 0.8 +
        oldpeak * 0.5 +
        (ca > 0).astype(int) * 0.9 +
        (thal >= 2).astype(int) * 0.7
    )
    
    # Probability of target being 1 (High Risk)
    prob = 1 / (1 + np.exp(-(risk_score - 2.5)))
    target = np.random.binomial(1, prob)
    
    data = pd.DataFrame({
        'age': age,
        'gender': gender,
        'cp': cp,
        'trestbps': trestbps,
        'chol': chol,
        'fbs': fbs,
        'restecg': restecg,
        'thalach': thalach,
        'exang': exang,
        'oldpeak': oldpeak,
        'slope': slope,
        'ca': ca,
        'thal': thal,
        'target': target
    })
    
    return data

def train_and_save():
    print("Generating synthetic heart disease dataset...")
    df = generate_synthetic_data(1200)
    
    X = df.drop(columns=['target'])
    y = df['target']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Training RandomForestClassifier...")
    clf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    clf.fit(X_train, y_train)
    
    train_acc = clf.score(X_train, y_train)
    test_acc = clf.score(X_test, y_test)
    print(f"Model trained. Train Accuracy: {train_acc:.4f}, Test Accuracy: {test_acc:.4f}")
    
    # Save the model
    model_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(model_dir, 'model.pkl')
    joblib.dump(clf, model_path)
    print(f"Model saved to {model_path}")


if __name__ == '__main__':
    train_and_save()
