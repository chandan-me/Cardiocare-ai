# 🩺 Cardiocare AI — Clinical Heart Disease Prediction & AI Assistant

Cardiocare AI is a premium, production-grade medical screening web application that predicts a patient's risk of heart disease (cardiovascular disease) using a machine learning classifier, and generates customized cardiological guidelines using the Google Gemini AI API.

---

## ⚡ Key Features

1. **Aesthetic Diagnostic Dashboard**: Premium, dark-mode-ready interface with responsive collateral grids.
2. **Ensemble Risk Assessment**: Machine learning prediction with confidence percentage metrics.
3. **Gemini Cardiological Recommendations**: Personalized Lifestyle, Diet, Exercise, and warning alert blocks.
4. **Relational Database Logs**: SQL history log showing Date, Patient, Outcome, and Confidence.
5. **Interactive Analytics Charts**: Chart.js analytics of age bands, risk distributions, and timelines.
6. **Exportable PDF Reports**: Backend-generated, high-fidelity PDF medical reports.
7. **Clinical Authentication**: JWT session validations with a dynamic password visibility toggle.
8. **Editable Clinical Profiles**: Ability to edit clinician name, institution, specialization, license, and phone number, with active sync to TiDB Cloud.

---

## 🚀 Local Setup & Installation

Follow these step-by-step instructions to clone the repository and run Cardiocare AI on your local machine.

### Prerequisites
* **Node.js** (v16 or higher)
* **Python** (v3.8 or higher)
* **MySQL** (Optional: the backend automatically switches to a portable JSON-file database if no local SQL server is active).

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/chandan-me/Cardiocare-ai.git
cd Cardiocare-ai
```

---

### Step 2: Set Up the Python ML Server
1. Navigate to the `python-api` folder:
   ```bash
   cd python-api
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Create virtual environment
   python -m venv venv

   # Activate virtual environment (Windows PowerShell)
   .\venv\Scripts\activate

   # Activate virtual environment (Mac/Linux)
   source venv/bin/activate
   ```
3. Install dependencies and start the server:
   ```bash
   pip install -r requirements.txt
   python app.py
   ```
* The Machine Learning API will start running on **`http://localhost:5001`**.

---

### Step 3: Set Up the Node.js Express Backend
1. Open a new terminal window, navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Create your local environment configuration file:
   Create a file named **`.env`** in the `backend` directory and add the following keys:
   ```env
   PORT=5000
   JWT_SECRET=super_secret_session_key_change_me
   FLASK_API_URL=http://localhost:5001/predict
   GEMINI_API_KEY=your_actual_gemini_api_key_here

   # Database Settings (Uncomment if using local MySQL, otherwise it will auto-fallback to fallback_db.json)
   # DB_HOST=localhost
   # DB_USER=root
   # DB_PASSWORD=your_mysql_password
   # DB_NAME=heart_disease_db
   # DB_PORT=3306
   ```
4. Initialize the Database (Optional — if using MySQL):
   ```bash
   node config/setup_db.js
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```
* The Backend API will start running on **`http://localhost:5000`**.

---

### Step 4: Set Up the React Frontend Client
1. Open a new terminal window, navigate to the `client` folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your environment configuration file:
   Create a file named **`.env`** in the `client` directory and add the following line:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend developer server:
   ```bash
   npm run dev
   ```
* The Frontend UI will start running on **`http://localhost:3000`** (or `http://localhost:5173`).

---

## 🔑 Default Login Credentials

If you are running the database for the first time, the seeder automatically creates a default administrator credential:
* **Email:** `admin@pulse.org`
* **Password:** `admin123`

You can also click the **"Register Clinical User"** link on the login page to create a custom profile.

---

## 📂 Project Architecture

```text
Cardiocare-ai/
├── client/                      # React 19 Frontend (Vite)
│   ├── src/
│   │   ├── context/             # AuthContext (Theme, session state)
│   │   ├── layouts/             # Collapsible sidebars
│   │   ├── pages/               # Login, Form, Result, History, Profile
│   │   └── services/            # Axios API config
│   └── vercel.json              # Client routing rewrite configs
├── backend/                     # Node.js + Express Backend
│   ├── config/                  # db.js, schema.sql, setup_db.js
│   ├── controllers/             # Auth, Predictions, Dashboard
│   ├── middleware/              # JWT authorization
│   └── vercel.json              # Serverless API routes
└── python-api/                  # Flask Machine Learning Service
    ├── app.py                   # Prediction API endpoint
    ├── train_model.py           # Classifier training script
    ├── model.pkl                # Exported Random Forest model
    └── requirements.txt         # Python packages list
```
