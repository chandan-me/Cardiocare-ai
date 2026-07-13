# Installation & Setup Guide

Follow the steps below to configure, train, and run the Heart Disease Prediction web application locally.

---

## Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18 or higher) & **npm** (v9 or higher)
- **Python** (v3.10 to v3.12)
- **MySQL Server** (running locally on port 3306)

---

## Step 1: Database Setup

1. Start your local MySQL server.
2. Open the `backend/.env` file and update the database settings to match your MySQL server:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   DB_NAME=heart_disease_db
   DB_PORT=3306
   ```
3. Navigate to the `backend` folder and run the database setup command:
   ```bash
   cd backend
   npm run db:setup
   ```
   This will automatically connect to MySQL, create the `heart_disease_db` database, and construct the `users` and `predictions` tables.

---

## Step 2: Machine Learning Service Setup

1. Navigate to the `python-api` directory:
   ```bash
   cd python-api
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Train the Random Forest Classifier model:
   ```bash
   python train_model.py
   ```
   *This trains the classifier and generates `model.pkl`.*
5. Run the Flask prediction server:
   ```bash
   python app.py
   ```
   *The Flask microservice will start listening on `http://localhost:5001`.*

---

## Step 3: Express Backend Setup

1. Open a new terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the Node.js dependencies:
   ```bash
   npm install
   ```
3. (Optional) Set up your Google Gemini API key in `backend/.env` to enable dynamic recommendations:
   ```env
   GEMINI_API_KEY=AIzaSy...your_actual_key...
   ```
4. Start the Express API server:
   ```bash
   npm start
   ```
   *The Express backend will start listening on `http://localhost:5000`.*

---

## Step 4: React Frontend Setup

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install the React packages:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000` to access the application.

---

## Troubleshooting

- **MySQL Access Denied**: Ensure `DB_USER` and `DB_PASSWORD` in `backend/.env` match your local MySQL configuration.
- **Flask API Offline**: The Express server will fall back to high-quality mock predictions if the Flask ML API is offline, but training the model and starting the Flask server is required for live ML classifications.
- **Gemini Recommendations Fallback**: If `GEMINI_API_KEY` is not provided in `.env`, the system automatically falls back to static rule-based clinical guides.
