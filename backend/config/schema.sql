CREATE DATABASE IF NOT EXISTS heart_disease_db;
USE heart_disease_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  avatar VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  patient_name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  gender INT NOT NULL, -- 0 = Female, 1 = Male
  cp INT NOT NULL, -- Chest Pain Type
  trestbps INT NOT NULL, -- Resting Blood Pressure
  chol INT NOT NULL, -- Cholesterol
  fbs INT NOT NULL, -- Fasting Blood Sugar
  restecg INT NOT NULL, -- Resting ECG
  thalach INT NOT NULL, -- Max Heart Rate
  exang INT NOT NULL, -- Exercise Induced Angina
  oldpeak DECIMAL(3,1) NOT NULL, -- ST depression
  slope INT NOT NULL, -- Slope of peak exercise ST segment
  ca INT NOT NULL, -- Number of major vessels colored by fluoroscopy
  thal INT NOT NULL, -- Thalassemia
  result VARCHAR(50) NOT NULL, -- 'Healthy' or 'High Risk'
  confidence DECIMAL(5,2) NOT NULL, -- Prediction confidence percent
  recommendations TEXT NULL, -- Gemini recommendation content
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
