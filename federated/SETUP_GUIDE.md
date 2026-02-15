# Energy Grid Anomaly Detection - Setup Guide

## System Architecture

```
┌─────────────────────┐
│   Frontend (Next.js) │
│  localhost:3000     │
└──────────┬──────────┘
           │
           │ POST /detect-anomaly
           ↓
┌─────────────────────┐
│  Backend (FastAPI)  │
│  localhost:8000     │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ Anomaly Detector    │
│ (IsolationForest)   │
└─────────────────────┘
```

## Quick Start

### Terminal 1: Frontend
```bash
cd c:\Users\CHELSEA SHARMA\Downloads\energy-flow-ui-build
pnpm dev
# Opens: http://localhost:3000
```

### Terminal 2: Backend
```bash
cd c:\Users\CHELSEA SHARMA\Downloads\energy-flow-ui-build\federated
pip install fastapi uvicorn scikit-learn numpy pydantic
python -m uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
# Opens: http://localhost:8000
```

### Terminal 3 (Optional): Flower Server
```bash
cd c:\Users\CHELSEA SHARMA\Downloads\energy-flow-ui-build\federated
python server.py
# Opens: http://localhost:8080
```

---

## Login Credentials

**Demo User:**
- Username: `demo`
- Password: `Demo@123`

**Or create a new account** via Sign Up page

---

## Using the Anomaly Detection Dashboard

### Step 1: Navigate to Dashboard
1. Go to `http://localhost:3000`
2. Login
3. Click **"Anomaly"** tab in sidebar

### Step 2: Run Detection
**Option A: Quick Test (Recommended)**
- Click green **"Run Detection"** button
- System generates sample data automatically
- Backend processes and returns results

**Option B: Upload CSV**
- Click **"Upload CSV"** button
- Select the CSV file (see format below)

### Step 3: View Results

**If ANOMALY Detected:**
- 🔴 Red alert card appears
- Shows anomaly score (%)
- Displays grid metrics
- Status: "Critical - Review Required"

**If NORMAL:**
- 🟢 Green status card appears
- Shows anomaly score (%)
- Displays grid metrics
- Status: "Operating normally"

---

## CSV File Format

### Required Columns
```
node_id,voltage,current,load,battery_level
```

### Valid Example (NORMAL readings):
```csv
node_id,voltage,current,load,battery_level
NODE-001,230,50,45,85
NODE-002,231,51,46,84
NODE-003,229,49,44,86
```

**Expected:** All scores < 70% → Shows NORMAL

### Anomaly Example (ANOMALY readings):
```csv
node_id,voltage,current,load,battery_level
NODE-001,245,120,95,20
NODE-002,210,180,100,10
NODE-003,250,150,99,5
```

**Expected:** All scores > 70% → Shows ANOMALY

---

## Understanding Energy Metrics

| Metric | Normal Range | Anomaly Range |
|--------|--------------|---------------|
| **Voltage** | 220-240V | <200V or >250V |
| **Current** | 30-80A | >150A or <10A |
| **Load** | 30-60% | >90% or <10% |
| **Battery** | 70-100% | <20% or 0% |

---

## API Endpoints (FastAPI)

### 1. POST /detect-anomaly
**Request:**
```json
{
  "node_id": "NODE-001",
  "voltage": 230,
  "current": 50,
  "load": 45,
  "battery_level": 85
}
```

**Response (NORMAL):**
```json
{
  "status": "NORMAL",
  "anomaly_score": 0.23,
  "node_id": "NODE-001",
  "voltage": 230,
  "current": 50,
  "load": 45,
  "battery_level": 85,
  "timestamp": "2026-02-13T15:30:00"
}
```

**Response (ANOMALY):**
```json
{
  "status": "ANOMALY",
  "anomaly_score": 0.87,
  "node_id": "NODE-001",
  "voltage": 245,
  "current": 120,
  "load": 95,
  "battery_level": 20,
  "timestamp": "2026-02-13T15:30:00"
}
```

### 2. GET /statistics
Returns anomaly detection statistics:
```json
{
  "total_readings": 15,
  "anomaly_count": 3,
  "anomaly_rate": 20.0,
  "avg_score": 0.45
}
```

### 3. GET /health
Health check:
```json
{
  "status": "healthy",
  "detector": "initialized",
  "timestamp": "2026-02-13T15:30:00"
}
```

---

## Troubleshooting

### Backend Won't Start
```bash
# Missing dependencies
pip install fastapi uvicorn scikit-learn numpy pydantic

# Port 8000 already in use
python -m uvicorn api_server:app --port 8001 --host 0.0.0.0 --reload
```

### Frontend Can't Connect to Backend
- Check if backend is running on `localhost:8000`
- Check browser console (F12) for CORS errors
- Ensure firewall allows port 8000

### CSV Upload Not Working
- Verify CSV file is properly formatted
- Check file has correct columns: `node_id,voltage,current,load,battery_level`
- Ensure no extra spaces in headers

### Model Not Found Error
```bash
# Automatically creates default model on first run
# Check logs for confirmation
```

---

## Sample CSV Data

File: `sample_energy_data.csv`
Located in: `federated/sample_energy_data.csv`

Contains:
- 6 normal readings (NODE-001 to NODE-006)
- 3 anomalies (NODE-007, NODE-008, NODE-009) - High/Low voltage
- 6 normal readings (NODE-010 to NODE-015)

---

## API Documentation

Once backend starts, visit:
- **Interactive Docs:** `http://localhost:8000/docs`
- **Alternative Docs:** `http://localhost:8000/redoc`

Try API endpoints directly in the browser!

---

## File Structure

```
energy-flow-ui-build/
├── app/
│   ├── page.tsx              (Login page)
│   ├── dashboard/
│   │   └── page.tsx          (Main dashboard)
│   └── signup/
│       └── page.tsx          (Signup page)
├── components/
│   └── dashboard/
│       ├── anomaly-detection.tsx    (Anomaly dashboard)
│       └── anomaly-alert.tsx         (Alert component)
├── federated/
│   ├── anomaly_detection.py         (Detection module)
│   ├── api_server.py                (FastAPI backend)
│   ├── sample_energy_data.csv       (Sample CSV)
│   └── server.py                    (Flower server)
└── lib/
    └── utils.ts              (Safe user data parsing)
```

---

## Next Steps

1. ✅ Start frontend: `pnpm dev`
2. ✅ Start backend: `python -m uvicorn api_server:app --host 0.0.0.0 --port 8000`
3. ✅ Login: `demo` / `Demo@123`
4. ✅ Go to Anomaly tab
5. ✅ Click "Run Detection" or upload CSV
6. ✅ View results!

Happy monitoring! 🚀
