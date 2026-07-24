from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Float, Integer, ARRAY
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

engine = create_engine(SQLALCHEMY_DATABASE_URL, poolclass=NullPool)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. Database Model ---
class CableGland(Base):
    __tablename__ = "glands"

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

class Fixture(Base):
    __tablename__ = "fixtures"

    id = Column(Integer, primary_key=True)
    category = Column(String)          # 'linear' | 'baylight' | 'floodlight'
    model = Column(String)
    family = Column(String)
    variant = Column(String)
    tagline = Column(String)
    zones = Column(ARRAY(Integer))
    marking = Column(String)
    tclass = Column(String)
    watt = Column(Float)
    lumens = Column(Float)
    cd = Column(Float)
    eff = Column(Float)
    freq = Column(String)
    lifetime_hours = Column(Float)
    cct = Column(Float)
    dim_l = Column(Float)
    dim_w = Column(Float)
    dim_h = Column(Float)
    cri = Column(Float)
    pf = Column(Float)
    ral = Column(String)
    ik = Column(String)
    ip = Column(String)
    weight = Column(Float)
    price = Column(Float)
    material = Column(String)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 3. FastAPI Application ---
app = FastAPI(title="Cable Gland Selector")

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
    thread: str = Query(None),
    cable_od: float = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(CableGland)

    if armour and armour != "All":
        query = query.filter(CableGland.armour_compatibility.ilike(f"%{armour}%"))

    if environment and environment != "All":
        query = query.filter(CableGland.environment.ilike(f"%{environment}%"))

    if sealing and sealing != "All":
        query = query.filter(CableGland.sealing_type.ilike(f"%{sealing}%"))

    if material and material != "All":
        query = query.filter(CableGland.material.ilike(f"%{material}%"))

    if thread and thread != "All":
        query = query.filter(CableGland.entry_thread.ilike(f"%{thread}%"))

    if cable_od is not None:
        query = query.filter(
            CableGland.min_cable_dia_mm <= cable_od,
            CableGland.max_cable_dia_mm >= cable_od
        )

    results = query.all()

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

IP_RANK = {"IP65": 1, "IP66": 2, "IP67": 3, "IP68": 4}
TCLASS_MAXTEMP = {"T1": "450\u00b0C", "T2": "300\u00b0C", "T3": "200\u00b0C",
                   "T4": "135\u00b0C", "T5": "100\u00b0C", "T6": "85\u00b0C"}


def _f_to_dict(p: Fixture):
    return {
        "model": p.model, "family": p.family, "variant": p.variant,
        "tagline": p.tagline, "zones": p.zones, "marking": p.marking,
        "tclass": p.tclass, "watt": p.watt, "lumens": p.lumens, "cd": p.cd,
        "eff": p.eff, "freq": p.freq, "lifetime_hours": p.lifetime_hours,
        "cct": p.cct, "dims": {"l": p.dim_l, "w": p.dim_w, "h": p.dim_h}
                 if (p.dim_l or p.dim_w or p.dim_h) else None,
        "cri": p.cri, "pf": p.pf, "ral": p.ral, "ik": p.ik, "ip": p.ip,
        "weight": p.weight, "price": p.price, "material": p.material,
    }


@app.get("/api/fixtures/search")
def search_fixtures(
    category: str = Query(...),          # linear | baylight | floodlight
    lumen: float = Query(...),
    zone: int = Query(...),
    watt: float = Query(None),
    material: str = Query(None),
    diml: float = Query(None),
    dimw: float = Query(None),
    dimh: float = Query(None),
    efficiency: float = Query(None),
    ip: str = Query(None),
    db: Session = Depends(get_db),
):
    products = db.query(Fixture).filter(Fixture.category == category).all()

    scored = []
    for p in products:
        hard_fail = False
        fail_reasons = []

        zones = p.zones or []
        if zone not in zones:
            hard_fail = True
            fail_reasons.append(f"not certified for zone {zone}")
        if ip and IP_RANK.get(p.ip, 0) < IP_RANK.get(ip, 0):
            hard_fail = True
            fail_reasons.append(f"rated {p.ip}, needs {ip}")
        if material and (p.material or "aluminium") != material:
            hard_fail = True
            fail_reasons.append(f"is {p.material}, not {material}")

        # Tier 0 = meets/exceeds requested lumen output (preferred, closest wins).
        # Tier 1 = falls short (only used if nothing reaches requested output).
        plumens = p.lumens or 0
        tier = 0 if plumens >= lumen else 1
        lumen_gap = abs(plumens - lumen)

        # Zone-2 searches prefer fixtures certified specifically for zone 2+ over
        # broader zone-1-and-up fixtures that also happen to cover zone 2.
        zone_priority = 1 if (zone == 2 and 1 in zones) else 0

        secondary_penalty = 0.0
        if watt:
            secondary_penalty += (p.watt - watt) * 3 if p.watt and p.watt > watt else 0
        if diml and p.dim_l and p.dim_l > diml:
            secondary_penalty += (p.dim_l - diml) * 2
        if dimw and p.dim_w and p.dim_w > dimw:
            secondary_penalty += (p.dim_w - dimw) * 2
        if dimh and p.dim_h and p.dim_h > dimh:
            secondary_penalty += (p.dim_h - dimh) * 2
        if efficiency and (p.eff or 0) < efficiency:
            secondary_penalty += (efficiency - (p.eff or 0)) * 5

        scored.append({
            "p": p, "tier": tier, "lumen_gap": lumen_gap,
            "zone_priority": zone_priority, "secondary_penalty": secondary_penalty,
            "hard_fail": hard_fail, "fail_reasons": fail_reasons,
        })

    scored.sort(key=lambda s: (
        s["hard_fail"], s["tier"], s["lumen_gap"], s["zone_priority"], s["secondary_penalty"]
    ))

    viable = [s for s in scored if not s["hard_fail"]]

    if not viable:
        closest = scored[0] if scored else None
        return {
            "match": False,
            "closest": {
                "model": closest["p"].model,
                "fail_reasons": closest["fail_reasons"],
            } if closest else None,
        }

    best = viable[0]
    alternates = viable[1:3]

    return {
        "match": True,
        "best": _f_to_dict(best["p"]),
        "meets_lumen": best["tier"] == 0,
        "tclass_max_temp": TCLASS_MAXTEMP.get(best["p"].tclass),
        "alternates": [_f_to_dict(a["p"]) for a in alternates],
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Vercel API is running!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("index:app", host="127.0.0.1", port=8000, reload=True)