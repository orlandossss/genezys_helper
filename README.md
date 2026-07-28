# genezys_helper

Genezys helper application rebuilt using the pygenezys Python library.

## Project Structure

```
genezys_helper/
├── backend/          # FastAPI backend using pygenezys
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── routers/
│       ├── __init__.py
│       ├── leaderboard.py
│       ├── marketplace.py
│       ├── cards.py
│       ├── matches.py
│       ├── transactions.py
│       └── profile.py
└── frontend/         # React frontend (modified from original)
    ├── src/
    ├── public/
    └── package.json
```

## Features

- **Marketplace**: Browse current card listings with filtering and sorting
- **Profile**: View your cards, match history, and transaction history
- **Arena**: Optimize decks with arena score calculator and card ranker
- **Leaderboard**: Division rankings with deck visibility

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

Backend will be available at http://localhost:8000

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

Frontend will be available at http://localhost:3000

## API Endpoints

- `GET /health` - Health check
- `GET /marketplace` - Marketplace listings
- `GET /cards` - User's card collection (requires auth)
- `GET /matches` - Match history (requires auth)
- `GET /transactions` - Transaction history (requires auth)
- `GET /leaderboard/division` - Division leaderboard (requires auth)
- `GET /profile` - User profile (requires auth)

## Authentication

The app uses Genezys session tokens for authentication:

1. Log into app.genezys.xyz in your browser
2. Open DevTools (F12) → Network tab
3. Find any request and copy the `Authorization` header value
4. Paste it in the app when prompted

Tokens expire after ~1 hour.

## Changes from Original

**Removed features:**
- MongoDB database and caching
- Athletes database and RSS article scraping
- Sales history tracking and analytics dashboard
- Card registry and contribution system

**Kept features:**
- All live data from Genezys API via pygenezys
- Marketplace browsing
- Profile management
- Arena optimization tools
- Leaderboard rankings

## Tech Stack

**Backend:**
- FastAPI
- pygenezys
- uvicorn

**Frontend:**
- React
- Recharts (for Arena visualizations)
- Lucide React (icons)

## License

MIT
