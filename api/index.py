from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import NullPool
from urllib.parse import quote_plus

# --- 1. Database Configuration ---
DB_USER = "postgres.beluqoyvuchhoiyhbcfe"
DB_PASSWORD = "F@ceb00k2077420"
DB_HOST = "aws-0-eu-west-1.pooler.supabase.com"
DB_PORT = "6543"
DB_NAME = "postgres"

encoded_password = quote_plus(DB_PASSWORD)
SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# NullPool is CRITICAL for Vercel. Serverless functions spin up and down constantly. 
# This prevents them from holding open zombie connections and crashing Supabase.
engine = create_engine(SQLALCHEMY_DATABASE_URL, poolclass=NullPool)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. Database Model ---
# This EXACTLY matches the master_gland_database.csv we created.
class CableGland(Base):
    __tablename__ = "glands" # Ensure this matches your Supabase table name!
    
    ordering_reference = Column(String, primary_key=True)
    manufacturer = Column(String)
    gland_model = Column(String)
    gland_size = Column(String)
    entry_thread = Column(String)
    sealing_type = Column(String)
    armour_compatibility = Column(String)
    environment = Column(String)
    ex_rating = Column(String)
    material = Column(String)
    min_cable_dia_mm = Column(Float)
    max_cable_dia_mm = Column(Float)

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

@app.get("/api/search")
def search_glands(
    armour: str = Query(None),
    environment: str = Query(None),
    sealing: str = Query(None),
    material: str = Query(None),
    cable_od: float = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(CableGland)

    # Apply filters dynamically if they are provided
    if armour and armour != "All":
        query = query.filter(CableGland.armour_compatibility.ilike(f"%{armour}%"))
        
    if environment and environment != "All":
        query = query.filter(CableGland.environment.ilike(f"%{environment}%"))
        
    if sealing and sealing != "All":
        query = query.filter(CableGland.sealing_type.ilike(f"%{sealing}%"))
        
    if material and material != "All":
        query = query.filter(CableGland.material.ilike(f"%{material}%"))
        
    if cable_od is not None:
        # The Cable OD MUST be greater than or equal to the minimum, AND less than or equal to the maximum
        query = query.filter(
            CableGland.min_cable_dia_mm <= cable_od,
            CableGland.max_cable_dia_mm >= cable_od
        )

    results = query.all()
    
    # Return as JSON
    return [
        {
            "ordering_reference": g.ordering_reference,
            "manufacturer": g.manufacturer,
            "gland_model": g.gland_model,
            "gland_size": g.gland_size,
            "entry_thread": g.entry_thread,
            "sealing_type": g.sealing_type,
            "armour_compatibility": g.armour_compatibility,
            "environment": g.environment,
            "ex_rating": g.ex_rating,
            "material": g.material,
            "min_cable_dia_mm": g.min_cable_dia_mm,
            "max_cable_dia_mm": g.max_cable_dia_mm,
        }
        for g in results
    ]

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Vercel API is running!"}