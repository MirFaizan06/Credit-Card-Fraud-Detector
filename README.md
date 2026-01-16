# Fraud Detector

A web-based fraud detection system using Machine Learning to analyze transaction risk.

## Features

- Real-time fraud probability analysis
- 14 risk factors covering 28 PCA components (V1-V28)
- User-friendly interface with Bootstrap 5
- Personalized results with optional name input

## Tech Stack

- **Backend:** Python, Flask
- **ML:** scikit-learn, NumPy, joblib
- **Frontend:** HTML, Bootstrap 5, Font Awesome

## Installation

1. Clone the repository
2. Create virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   ```
3. Install dependencies:
   ```bash
   pip install flask joblib numpy scikit-learn
   ```
4. Run the application:
   ```bash
   python app.py
   ```
5. Open http://127.0.0.1:5000 in browser

## How It Works

The model uses PCA (Principal Component Analysis) to analyze 28 behavioral features:

| Risk Factor | PCA Components | Description |
|-------------|----------------|-------------|
| Unusual Location | V1-V2 | Transaction from new city/country |
| Currency Mismatch | V3-V4 | Different currency than usual |
| New Device | V5-V6 | Unrecognized device |
| Suspicious IP | V7-V8 | IP flagged for malicious activity |
| Rapid Transactions | V9-V10 | Multiple transactions in short time |
| Unusual Amount | V11-V12 | Amount differs from normal spending |
| Odd Time | V13-V14 | Transaction at unusual hour |
| High-Risk Merchant | V15-V16 | Merchant in high-fraud category |
| Card Not Present | V17-V18 | Online/phone transaction |
| Failed Auth Attempts | V19-V20 | Multiple wrong PIN/CVV tries |
| New Account | V21-V22 | Account created recently |
| Address Mismatch | V23-V24 | Shipping differs from billing |
| Suspicious Email | V25-V26 | Disposable or risky email domain |
| Unusual Behavior | V27-V28 | Different typing/mouse patterns |

## Risk Levels

- **High (>75%):** Block transaction immediately
- **Medium (30-75%):** Request additional verification
- **Low (<30%):** Safe to proceed

## Project Structure

```
Fraud_Detecto_Web/
├── app.py              # Flask application
├── models/
│   └── fraud_model.pkl # Trained ML model
├── templates/
│   └── index.html      # Web interface
└── README.md
```

## Input Fields

- **Transaction Amount (₹):** Value in rupees (e.g., 2500.00)
- **Transaction Time (seconds):** Seconds since first transaction (3600 = 1 hour)
- **Risk Factors:** Select all conditions that apply

## Deployment Guide

### Deploy to Render (Free)

1. Create account at [render.com](https://render.com)
2. Push code to GitHub repository
3. In Render dashboard, click **New > Web Service**
4. Connect your GitHub repo
5. Configure:
   - **Name:** fraud-detector
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
6. Click **Create Web Service**
7. Wait for deployment (2-3 minutes)

### Deploy to Railway (Free)

1. Create account at [railway.app](https://railway.app)
2. Push code to GitHub repository
3. In Railway dashboard, click **New Project > Deploy from GitHub repo**
4. Select your repository
5. Railway auto-detects Python and deploys
6. Go to **Settings > Generate Domain** to get your URL

### Required Files for Deployment

Create `requirements.txt`:
```
flask==3.1.2
gunicorn==21.2.0
joblib==1.5.3
numpy==2.4.1
scikit-learn==1.8.0
```

Create `Procfile` (for some platforms):
```
web: gunicorn app:app
```

## Author

Submitted for academic examination.
