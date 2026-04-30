# CineVault

A full-stack media tracking application for movies, anime, and TV shows with price monitoring, Blu-ray deal tracking, and AI-powered recommendations.

![CineVault](https://img.shields.io/badge/React-19.2.5-61DAFB?style=flat&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.14-009688?style=flat&logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-4.13.2-47A248?style=flat&logo=mongodb)

## Features

- **Media Catalog** — Track movies, anime, and TV shows with detailed metadata
- **Blu-ray & Price Tracking** — Monitor price drops and find the best deals
- **Streaming Availability** — See where content is available to stream
- **AI Recommendations** — Get personalized suggestions via Gemini AI
- **User Library** — Save and organize your watched/favorite content
- **Price Charts** — Visualize pricing history for Blu-ray releases
- **Chatbot** — Ask questions about movies, anime, and TV shows

## Tech Stack

### Frontend
- React 19
- Tailwind CSS
- Axios

### Backend
- FastAPI
- Python 3.x
- MongoDB (Motor)
- Uvicorn
- Pydantic Settings
- Python JOSE + Passlib (Authentication)

## Project Structure

```
Cinvault/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service layer
│   │   └── assets/         # Static assets
│   ├── public/             # Public assets
│   └── package.json        # Frontend dependencies
│
├── server/                 # FastAPI backend
│   ├── app/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── models/        # Data models
│   │   ├── auth/          # Authentication
│   │   └── utils/         # Utilities
│   ├── requirements.txt    # Backend dependencies
│   └── .env               # Environment variables
│
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   # source .venv/bin/activate  # Linux/Mac
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the server directory:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/cinevault
    JWT_SECRET=replace-with-a-long-random-secret
    TMDB_API_KEY=
    WATCHMODE_API_KEY=
    GEMINI_API_KEY=
    GEMINI_MODEL=gemini-2.5-flash
    CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

5. Start the backend server:
   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`