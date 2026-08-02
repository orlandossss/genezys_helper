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

## Getting a token

`pygenezys` does not log in on your behalf — you provide your own session
token, the same one the website itself uses:

1. Log into [app.genezys.xyz](https://app.genezys.xyz) in your browser.
2. Open your browser's developer tools (F12) or right-click and click on 'inspect' <img width="1871" height="860" alt="inspected" src="https://github.com/user-attachments/assets/cfb1a386-a34e-46f9-bf93-3ec9cd8f7806" />

3. Go to the Network tab. <img width="1885" height="821" alt="2" src="https://github.com/user-attachments/assets/0b03177a-32f9-4ef3-916d-b6679e837572" />

4. Reload the page and find any request to `app.genezys.xyz`.<img width="1917" height="862" alt="5" src="https://github.com/user-attachments/assets/751245f6-52e9-44cc-b96c-62db6526d2a3" />

5. Copy the value of the `Authorization` request header — that's your token.<img width="1873" height="755" alt="6" src="https://github.com/user-attachments/assets/c01b1cb6-31c0-4a31-8579-c2f278b3f161" />


This token is short-lived (roughly one hour). Once it expires, repeat the
steps above to get a new one and pass it to `set_token()` (see below)
instead of creating a new client.


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
