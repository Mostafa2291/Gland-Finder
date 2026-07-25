from fastapi import FastAPI, Depends, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Float, Integer, ARRAY
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import NullPool
from urllib.parse import quote_plus
import os
import re
import json
import tempfile
from google import genai

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

# --- RFQ Analyzer (Gemini) configuration ---
# Set GEMINI_API_KEY in your Vercel project's Environment Variables (Settings ->
# Environment Variables) and redeploy. Never hardcode the key here.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

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
    price = Column(Float)

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
            "price": g.price,
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


# --- RFQ Analyzer ---

RFQ_EXTRACTION_PROMPT = """You are a technical engineer in the Oil & Gas sector at Elsewedy Electric.
Analyze the following RFQ text and extract every distinct product line item requested.
Return ONLY a JSON array (no prose, no markdown fences) where each element is an object with:
- "product_category": one of "Cable Glands", "Lighting Fixtures", "Junction Boxes", "Cables", "Other"

If product_category is "Cable Glands", also include:
- "material" (e.g. Brass, Nickel Plated Brass, Stainless Steel, Aluminium)
- "armor" (e.g. SWA, steel wire armour, unarmoured)
- "seal" (e.g. Single Seal, Double Seal)
- "size" (overall/entry thread size or cable outer diameter, e.g. "M20" or "14.5mm")

If product_category is "Lighting Fixtures", also include:
- "type" (Linear, Highbay, Lowbay, Floodlight)
- "temperature" (CCT, e.g. "5000K")
- "power" (Wattage, e.g. "30W")
- "luminous" (Lumens or lm/W, e.g. "1200LM")

Always include if mentioned, else null:
- "part_number"
- "voltage"
- "certificates" (e.g. ATEX, IECEx, Zone 1, Zone 2, Ex db)
- "quantity"

RFQ Text:
{rfq_text}
"""


def _extract_number(text):
    if not text:
        return None
    m = re.search(r"(\d+(?:\.\d+)?)", str(text))
    return float(m.group(1)) if m else None


def _extract_zone(text):
    if not text:
        return None
    m = re.search(r"zone\s*([12])", str(text), re.IGNORECASE)
    return int(m.group(1)) if m else None


def _map_armour(text):
    if not text:
        return None
    t = str(text).lower()
    if any(k in t for k in ["swa", "sta", "armour", "armor"]) and "un" not in t:
        return "Armoured"
    if "unarmoured" in t or "unarmored" in t:
        return "Unarmoured"
    return None


def _map_fixture_category(type_text):
    if not type_text:
        return None
    t = str(type_text).lower()
    if "linear" in t:
        return "linear"
    if "bay" in t or "high" in t or "low" in t:
        return "baylight"
    if "flood" in t or "street" in t:
        return "floodlight"
    return None


def _gland_to_cart_item(g: CableGland):
    return {
        "ordering_reference": g.ordering_reference,
        "manufacturer": g.manufacturer,
        "gland_model": g.gland_model,
        "gland_size": g.gland_size,
        "entry_thread": g.entry_thread,
        "sealing_type": g.sealing_type,
        "armour_compatibility": g.armour_compatibility,
        "environment": g.environment,
        "material": g.material,
        "min_cable_dia_mm": g.min_cable_dia_mm,
        "max_cable_dia_mm": g.max_cable_dia_mm,
        "price": g.price,
    }


def _score_gland(g, armour, sealing, material, cable_od):
    """Every known spec adds to the score; nothing is a hard requirement.
    Returns (score, max_possible_score) so callers can gauge confidence."""
    score, max_score = 0, 0
    if armour:
        max_score += 3
        if g.armour_compatibility and armour.lower() in g.armour_compatibility.lower():
            score += 3
    if sealing:
        max_score += 3
        if g.sealing_type and sealing.lower() in g.sealing_type.lower():
            score += 3
    if material:
        max_score += 2
        if g.material and material.lower() in g.material.lower():
            score += 2
    if cable_od is not None:
        max_score += 4
        if g.min_cable_dia_mm is not None and g.max_cable_dia_mm is not None:
            if g.min_cable_dia_mm <= cable_od <= g.max_cable_dia_mm:
                score += 4
            else:
                dist = min(abs(cable_od - g.min_cable_dia_mm), abs(cable_od - g.max_cable_dia_mm))
                score -= min(dist * 0.5, 4)  # nearby misses cost a little, not everything
    return score, max_score


def _confidence_label(score, max_score):
    if max_score == 0:
        return "low"  # nothing usable was extracted at all
    ratio = score / max_score
    if ratio >= 0.85:
        return "high"
    if ratio >= 0.4:
        return "medium"
    return "low"


@app.post("/api/rfq/analyze")
async def analyze_rfq(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not gemini_client:
        return {"error": "GEMINI_API_KEY is not configured on the server."}

    suffix = os.path.splitext(file.filename or "")[1] or ".bin"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    uploaded = None
    try:
        uploaded = gemini_client.files.upload(file=tmp_path)

        transcript_resp = gemini_client.models.generate_content(
            model="gemini-3.5-flash",
            contents=["Transcribe all text from this file exactly as it appears.", uploaded],
        )
        rfq_text = transcript_resp.text or ""

        extract_resp = gemini_client.models.generate_content(
            model="gemini-3.5-flash",
            contents=RFQ_EXTRACTION_PROMPT.format(rfq_text=rfq_text),
            config={"response_mime_type": "application/json"},
        )

        try:
            products = json.loads(extract_resp.text)
            if not isinstance(products, list):
                products = [products]
        except (json.JSONDecodeError, TypeError):
            return {"error": "Could not parse structured data from the RFQ.", "raw": extract_resp.text}

        results = []
        for prod in products:
            category = (prod.get("product_category") or "").lower()

            if "gland" in category:
                armour = _map_armour(prod.get("armor"))
                sealing = prod.get("seal")
                material = prod.get("material")
                cable_od = _extract_number(prod.get("size"))

                all_glands = db.query(CableGland).all()
                if not all_glands:
                    results.append({
                        "requested": prod, "type": "gland", "matched": False, "item": None,
                        "confidence": "low", "reason": "gland database is empty",
                    })
                    continue

                scored = [(_score_gland(g, armour, sealing, material, cable_od), g) for g in all_glands]
                scored.sort(key=lambda x: -x[0][0])
                (best_score, max_score), best = scored[0]

                results.append({
                    "requested": prod,
                    "type": "gland",
                    "matched": True,
                    "item": _gland_to_cart_item(best),
                    "confidence": _confidence_label(best_score, max_score),
                    "reason": None,
                })

            elif "light" in category or "fixture" in category:
                fx_category = _map_fixture_category(prod.get("type"))
                lumen = _extract_number(prod.get("luminous"))
                zone = _extract_zone(prod.get("certificates"))

                candidates = db.query(Fixture)
                if fx_category:
                    candidates = candidates.filter(Fixture.category == fx_category)
                candidates = candidates.all()

                if not candidates:
                    results.append({
                        "requested": prod, "type": "fixture", "matched": False, "item": None,
                        "confidence": "low", "reason": "no fixtures in the database at all",
                    })
                    continue

                def _fx_score(p):
                    score, max_score = 0, 0
                    if zone is not None:
                        max_score += 4
                        if zone in (p.zones or []):
                            score += 4
                    if lumen is not None:
                        max_score += 4
                        plumens = p.lumens or 0
                        gap_ratio = abs(plumens - lumen) / lumen if lumen else 1
                        score += max(4 - gap_ratio * 4, -2)  # closer lumen match scores higher
                    if fx_category:
                        max_score += 2
                        score += 2  # already filtered to this category above
                    return score, max_score

                scored = [(_fx_score(p), p) for p in candidates]
                scored.sort(key=lambda x: -x[0][0])
                (best_score, max_score), best = scored[0]

                results.append({
                    "requested": prod,
                    "type": "fixture",
                    "matched": True,
                    "item": _f_to_dict(best),
                    "confidence": _confidence_label(best_score, max_score),
                    "reason": None if fx_category else "fixture type wasn't recognized — showing closest match across all categories",
                })

            else:
                results.append({
                    "requested": prod, "type": "other", "matched": False, "item": None,
                    "confidence": "low",
                    "reason": f"category '{prod.get('product_category')}' isn't searchable on this site yet",
                })

        return {"products": results}
    finally:
        if uploaded:
            try:
                gemini_client.files.delete(name=uploaded.name)
            except Exception:
                pass
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("index:app", host="127.0.0.1", port=8000, reload=True)