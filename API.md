# API Documentation

This document describes the REST API endpoints exposed by the Node.js/Express backend and the Flask Machine Learning service.

---

## 1. Authentication Endpoints (`/api/auth`)

### Register Account
- **Endpoint**: `POST /api/auth/register`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Dr. Alice Smith",
    "email": "alice.smith@hospital.org",
    "password": "securepassword123"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "name": "Dr. Alice Smith",
      "email": "alice.smith@hospital.org",
      "role": "admin",
      "avatar": null
    }
  }
  ```

### User Login
- **Endpoint**: `POST /api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "alice.smith@hospital.org",
    "password": "securepassword123",
    "rememberMe": true
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "name": "Dr. Alice Smith",
      "email": "alice.smith@hospital.org",
      "role": "admin",
      "avatar": null
    }
  }
  ```

### User Logout
- **Endpoint**: `POST /api/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

---

## 2. Prediction Endpoints (`/api`)

### Run Risk Assessment
- **Endpoint**: `POST /api/predict`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "patient_name": "Jane Doe",
    "age": 54,
    "gender": 0,
    "cp": 2,
    "trestbps": 130,
    "chol": 220,
    "fbs": 0,
    "restecg": 1,
    "thalach": 150,
    "exang": 0,
    "oldpeak": 1.6,
    "slope": 1,
    "ca": 0,
    "thal": 2
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 12,
    "patient_name": "Jane Doe",
    "age": 54,
    "gender": 0,
    "result": "Healthy",
    "confidence": 91.2,
    "recommendations": "### Lifestyle Tips\n- ...",
    "created_at": "2026-07-13T10:55:00.000Z"
  }
  ```

### Get Prediction Logs (Paginated & Filtered)
- **Endpoint**: `GET /api/predictions`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page` (optional, default: `1`)
  - `limit` (optional, default: `10`)
  - `search` (optional, matches patient name)
  - `result` (optional, values: `Healthy` or `High Risk`)
- **Response (200 OK)**:
  ```json
  {
    "predictions": [
      {
        "id": 12,
        "user_id": 1,
        "patient_name": "Jane Doe",
        "age": 54,
        "gender": 0,
        "cp": 2,
        "trestbps": 130,
        "chol": 220,
        "fbs": 0,
        "restecg": 1,
        "thalach": 150,
        "exang": 0,
        "oldpeak": "1.6",
        "slope": 1,
        "ca": 0,
        "thal": 2,
        "result": "Healthy",
        "confidence": "91.20",
        "created_at": "2026-07-13T10:55:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

### Get Prediction Details
- **Endpoint**: `GET /api/predictions/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  *Returns the full database record of the prediction (including recommendations text).*

### Delete Prediction Log
- **Endpoint**: `DELETE /api/predictions/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "message": "Prediction record deleted successfully"
  }
  ```

### Generate PDF Report
- **Endpoint**: `POST /api/generate-report`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "id": 12
  }
  ```
- **Response (200 OK)**:
  *Streams a downloadable binary PDF report file (`application/pdf`).*

---

## 3. Dashboard Endpoints (`/api/dashboard`)

### Get Dashboard Analytics
- **Endpoint**: `GET /api/dashboard/stats`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "cards": {
      "totalPredictions": 1,
      "totalPatients": 1,
      "highRiskCount": 0,
      "healthyCount": 1
    },
    "charts": {
      "pie": {
        "labels": ["Healthy", "High Risk"],
        "data": [1, 0]
      },
      "bar": {
        "labels": ["Under 40", "40 - 49", "50 - 59", "60+"],
        "healthy": [0, 0, 1, 0],
        "highRisk": [0, 0, 0, 0]
      },
      "line": {
        "labels": ["Jul 2026"],
        "healthy": [1],
        "highRisk": [0],
        "total": [1]
      }
    }
  }
  ```

---

## 4. Python Flask ML API (`:5001`)

### Service Health
- **Endpoint**: `GET /health`
- **Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "model_loaded": true
  }
  ```

### Classify Cardiovascular Data
- **Endpoint**: `POST /predict`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "age": 54,
    "gender": 0,
    "cp": 2,
    "trestbps": 130,
    "chol": 220,
    "fbs": 0,
    "restecg": 1,
    "thalach": 150,
    "exang": 0,
    "oldpeak": 1.6,
    "slope": 1,
    "ca": 0,
    "thal": 2
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "prediction": 0,
    "confidence": 91.2,
    "risk_probability": 8.8,
    "status": "Healthy"
  }
  ```
