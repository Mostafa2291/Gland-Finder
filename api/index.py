from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Float, Integer
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from urllib.parse import quote_plus

# --- 1. Database Configuration ---
DB_USER = "postgres.beluqoyvuchhoiyhbcfe"
DB_PASSWORD = "F@ceb00k2077420"
DB_HOST = "aws-0-eu-west-1.pooler.supabase.com"
DB_PORT = "6543"
DB_NAME = "postgres"

encoded_password = quote_plus(DB_PASSWORD)
SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# pool_pre_ping helps since serverless functions may reconnect often;
# NullPool avoids keeping idle connections open between invocations.
from sqlalchemy.pool import NullPool
engine = create_engine(SQLALCHEMY_DATABASE_URL, poolclass=NullPool)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. Database Model ---
class CableGland(Base):
    __tablename__ = "cable_glands"
    id = Column(Integer, primary_key=True)
    ordering_reference = Column(String)
    manufacturer = Column(String)
    gland_model = Column(String)
    gland_size = Column(String)
    entry_thread = Column(String)
    armour_compatibility = Column(String)
    environment = Column(String)
    min_cable_dia_mm = Column(Float)
    max_cable_dia_mm = Column(Float)
    max_inner_bedding_dia_mm = Column(Float)
    min_armour_thickness_mm = Column(Float)
    max_armour_thickness_mm = Column(Float)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 3. FastAPI Application ---
app = FastAPI(title="Cable Gland Technical Office API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def gland_to_dict(g: CableGland) -> dict:
    return {
        "ordering_reference": g.ordering_reference,
        "manufacturer": g.manufacturer,
        "gland_model": g.gland_model,
        "gland_size": g.gland_size,
        "entry_thread": g.entry_thread,
        "armour_compatibility": g.armour_compatibility,
        "environment": g.environment,
        "min_cable_dia_mm": g.min_cable_dia_mm,
        "max_cable_dia_mm": g.max_cable_dia_mm,
        "max_inner_bedding_dia_mm": g.max_inner_bedding_dia_mm,
        "min_armour_thickness_mm": g.min_armour_thickness_mm,
        "max_armour_thickness_mm": g.max_armour_thickness_mm,
    }

@app.get("/api/search")
def search_glands(
    armour: str = Query(None),
    environment: str = Query(None),
    overall_dia: float = Query(None),
    inner_dia: float = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(CableGland)

    if armour:
        query = query.filter(CableGland.armour_compatibility.ilike(f"%{armour}%"))
    if environment:
        query = query.filter(CableGland.environment.ilike(f"%{environment}%"))
    if overall_dia is not None:
        query = query.filter(
            CableGland.min_cable_dia_mm <= overall_dia,
            CableGland.max_cable_dia_mm >= overall_dia
        )
    if inner_dia is not None:
        query = query.filter(
            (CableGland.max_inner_bedding_dia_mm >= inner_dia) |
            (CableGland.max_inner_bedding_dia_mm.is_(None))
        )

    results = query.all()
    return {
        "matches_found": len(results),
        "recommended_glands": [gland_to_dict(g) for g in results]
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok"}