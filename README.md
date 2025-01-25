# Revenue Forecast Application

This is a full-stack application for managing revenue forecasts, built with Next.js and FastAPI.

## Project Structure
```
.
├── backend/
│   └── main.py
├── frontend/
│   └── pages/
│       └── index.tsx
└── requirements.txt
```

## Setup Instructions

### Backend Setup
1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the FastAPI server:
```bash
uvicorn backend.main:app --reload --port 8000
```

### Frontend Setup
1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Run the development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Features
- Input form for revenue forecast data
- 13-year projection capability
- Real-time data validation
- Responsive design
- REST API backend
