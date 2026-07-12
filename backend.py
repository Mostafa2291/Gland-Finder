from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from urllib.parse import quote_plus
import uvicorn

# --- 1. Database Configuration ---
DB_USER = "postgres"
DB_PASSWORD = "P@ssw0rd"  # CHANGE THIS to your pgAdmin password!
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "gland_db"

encoded_password = quote_plus(DB_PASSWORD)
SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. Database Model ---
class CableGland(Base):
    __tablename__ = "cable_glands"
    ordering_reference = Column(String, primary_key=True)
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

# ADDED: CORS Middleware to allow the React frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def read_root():
    return {"message": "API is running! React frontend can now connect."}

@app.get("/api/search")
def search_glands(
    armour: str = Query(None, description="e.g., SWA, Unarmoured"),
    environment: str = Query(None, description="e.g., Industrial, Hazardous"),
    overall_dia: float = Query(None, description="Cable Overall Diameter (mm)"),
    inner_dia: float = Query(None, description="Cable Inner Bedding Diameter (mm) - For SWA"),
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
        "recommended_glands": results
    }

if __name__ == "__main__":
    print("Starting API Server with CORS on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)