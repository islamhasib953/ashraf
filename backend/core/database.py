"""
Database connection, session management and base model.
Uses SQLAlchemy with connection pooling for performance.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool
from core.config import settings

# ─── Engine Setup ─────────────────────────────────────────────────
connect_args = {}
pool_kwargs = {}

if "sqlite" in settings.DATABASE_URL:
    # SQLite for local development
    connect_args = {"check_same_thread": False}
    pool_kwargs = {"poolclass": StaticPool}
else:
    # PostgreSQL for production — use connection pooling
    pool_kwargs = {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,  # verify connection health before use
        "pool_recycle": 300,    # recycle connections every 5 minutes
    }

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **pool_kwargs
)

# Enable WAL mode for SQLite (better concurrent read performance)
if "sqlite" in settings.DATABASE_URL:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ─── Dependency ───────────────────────────────────────────────────
def get_db():
    """FastAPI dependency: yields a DB session, always closes on done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
