from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Genezys Helper API",
    version="1.0.0"
)

# CORS middleware - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router includes
from routers import leaderboard, marketplace, cards, matches, transactions, profile, cups, match
app.include_router(leaderboard.router)
app.include_router(marketplace.router)
app.include_router(cards.router)
app.include_router(matches.router)
app.include_router(transactions.router)
app.include_router(profile.router)
app.include_router(cups.router)
app.include_router(match.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
