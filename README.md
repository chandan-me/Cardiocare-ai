# Heart Disease Prediction & AI Assistant Web Application

A complete, production-quality medical screening web application that assesses a patient's risk of heart disease (cardiovascular disease) using a machine learning Random Forest classifier, and generates customized cardiological guidelines using the Google Gemini AI API.

---

## Technical Stack & Ports

- **React Frontend**: React 19, Vite, React Router DOM, Tailwind CSS (v4), Framer Motion, Chart.js, Axios, React Hook Form, SweetAlert2.
  - **Port**: `http://localhost:3000` (proxied `/api` requests to Express)
- **Express Backend**: Node.js, Express.js, MySQL (via `mysql2`), PDFKit (backend PDF reports), dotenv, cors.
  - **Port**: `http://localhost:5000`
- **Machine Learning API**: Python 3, Flask, scikit-learn, joblib, pandas, numpy.
  - **Port**: `http://localhost:5001`

---

## Architectural Layout

```
heart-disease-prediction/
├── client/                      # Vite + React 19 Frontend
│   ├── src/
│   │   ├── assets/              # Assets & media
│   │   ├── components/          # ProtectedRoute, ErrorBoundary
│   │   ├── context/             # AuthContext (Theme, session state)
│   │   ├── layouts/             # DashboardLayout (collapsible sidebars)
│   │   ├── pages/               # LandingPage, Login, Form, Result, History
│   │   ├── services/            # Axios API config
│   │   ├── index.css            # Tailwind Imports & variables
│   │   └── App.jsx              # Router & Entry Layout
│   └── vite.config.js           # Proxy configurations
├── backend/                     # Node.js + Express Backend
│   ├── config/                  # db.js, schema.sql, setup_db.js
│   ├── controllers/             # authController, predictionController, dashboardController
│   ├── middleware/              # JWT auth.js
│   ├── routes/                  # API routers
│   ├── server.js                # App bootsrapper
│   └── .env                     # Configuration variables
└── python-api/                  # Flask Machine Learning Service
    ├── app.py                   # Prediction API endpoint
    ├── train_model.py           # Dataset Generator & Classifier training
    ├── model.pkl                # Exported model
    └── requirements.txt         # Python libraries
```

---

## Primary Application Features

1. **Aesthetic Landing Page**: Hero dashboard with gradients, statistics cards, and clinical FAQs.
2. **Clinical Authentication**: JWT session validations with customizable "Remember Me" expiry.
3. **Responsive Side-nav Dashboard**: Collapsible navigation with dark/light themes.
4. **Cardiology Intake Form**: Validation of 13 clinical features (BP, Cholesterol, Thalassemia, ST Slope).
5. **Ensemble Risk Assessment**: Machine learning prediction with confidence percentage metrics.
6. **Gemini Recommendations**: Instant personalized Lifestyle, Diet, Exercise, and warning alert blocks.
7. **Relational Database Logs**: SQL history log showing Date, Patient, Outcome, and Confidence.
8. **Exportable CSVs & PDFs**: Direct CSV table downloads and backend-generated medical PDF reports.
9. **Interactive Dashboard Charts**: Chart.js analytics of age bands, risk distributions, and timelines.
