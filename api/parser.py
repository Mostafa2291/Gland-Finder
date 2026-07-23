import pdfplumber
import pandas as pd
import re
import os

def clean_stacked_values(val_str):
    """Takes a string with stacked numbers and returns (min_val, max_val)."""
    if pd.isna(val_str) or not str(val_str).strip():
        return None, None
    parts = [p.strip() for p in str(val_str).replace('\n', ' ').split() if p.strip()]
    try:
        vals = sorted([float(re.sub(r'[^\d.]', '', p)) for p in parts if re.sub(r'[^\d.]', '', p)])
        if len(vals) >= 2: return vals[0], vals[-1]
        elif len(vals) == 1: return vals[0], vals[0]
    except ValueError:
        pass
    return None, None

def parse_a2_or_a2f(pdf_path, gland_model, environment):
    """
    A2 / A2F table layout (COMBINED ORDERING REFERENCE is NOT one column - it's built
    from SIZE + TYPE + SUFFIX):
    0 SIZE | 1 TYPE | 2 ORDERING SUFFIX | 3 METRIC | 4 THREAD LENGTH | 5 MIN | 6 MAX |
    7 ACROSS FLATS MAX | 8 ACROSS CORNERS MAX | 9 PROTRUSION LENGTH | 10 SHROUD | 11 WEIGHT

    FIX: the old code searched every cell for the literal gland_model text (e.g. "A2")
    to locate an "ordering reference" column. But column 1 (TYPE) always just contains
    "A2" itself, so it matched immediately on every row and set ordering_reference = "A2"
    for every single size. That made every row a "duplicate" and the QA step collapsed
    16 rows down to 1. We now build the reference directly from columns 0+1+2, and read
    the diameter MIN/MAX straight from their fixed columns (5, 6).
    """
    print(f"Extracting {gland_model} from {pdf_path}...")
    try:
        with pdfplumber.open(pdf_path) as pdf:
            raw_table = pdf.pages[0].extract_table()
            if not raw_table: return pd.DataFrame()
            data_rows = []
            for row in raw_table:
                row_zero = str(row[0]).strip() if row[0] else ""
                if row_zero and row_zero[0].isdigit():
                    clean_row = [str(c).replace('\n', '').strip() if c else "" for c in row]
                    size, gtype, suffix = clean_row[0], clean_row[1], clean_row[2]

                    thread = clean_row[3]
                    for cell in clean_row[:6]:
                        match = re.search(r'(M\d{2,3})', cell)
                        if match:
                            thread = match.group(1)
                            break

                    ordering_ref = f"{size}{gtype}{suffix}"

                    min_dia = float(re.sub(r'[^\d.]', '', clean_row[5])) if clean_row[5] else None
                    max_dia = float(re.sub(r'[^\d.]', '', clean_row[6])) if clean_row[6] else None

                    data_rows.append({
                        'manufacturer': 'CMP', 'gland_model': gland_model, 'gland_size': size,
                        'entry_thread': thread, 'armour_compatibility': 'Unarmoured' if gland_model == 'A2' else 'Unarmoured & Braided',
                        'environment': environment, 'material': 'Brass',
                        'min_cable_dia_mm': min_dia, 'max_cable_dia_mm': max_dia,
                        'ordering_reference': ordering_ref
                    })
            return pd.DataFrame(data_rows)
    except Exception as e:
        print(f"Skipping {gland_model}: {e}")
        return pd.DataFrame()

def parse_cw(pdf_path):
    """
    CW table layout mirrors CW_CIEL's front columns:
    0 SIZE | 1 TYPE | 2 ORDERING SUFFIX | 3 ENTRY THREAD | 4 THREAD LENGTH |
    5 CABLE BEDDING DIAMETER MAX | 6 OVERALL CABLE DIAMETER MIN | 7 OVERALL CABLE DIAMETER MAX | ...

    FIX: same bug as A2 - searching every cell for the literal text "CW" matched
    column 1 (TYPE = "CWC") on every row, collapsing all rows to one ordering
    reference. Reference is now built directly from columns 0+1+2, and min/max
    cable diameter read straight from the fixed Overall Cable Diameter 'B' columns
    (6, 7) instead of scanning/joining text across a variable column range.
    """
    print(f"Extracting CW from {pdf_path}...")
    try:
        with pdfplumber.open(pdf_path) as pdf:
            raw_table = pdf.pages[0].extract_table()
            if not raw_table: return pd.DataFrame()
            data_rows = []
            for row in raw_table:
                row_zero = str(row[0]).strip() if row[0] else ""
                if row_zero and row_zero[0].isdigit():
                    clean_row = [str(c).replace('\n', '').strip() if c else "" for c in row]
                    size, gtype, suffix = clean_row[0], clean_row[1], clean_row[2]

                    thread = clean_row[3]
                    for cell in clean_row[:6]:
                        match = re.search(r'(M\d{2,3})', cell)
                        if match:
                            thread = match.group(1)
                            break

                    ordering_ref = f"{size}{gtype}{suffix}"

                    min_dia = float(re.sub(r'[^\d.]', '', clean_row[6])) if len(clean_row) > 6 and clean_row[6] else None
                    max_dia = float(re.sub(r'[^\d.]', '', clean_row[7])) if len(clean_row) > 7 and clean_row[7] else None

                    data_rows.append({
                        'manufacturer': 'CMP', 'gland_model': 'CW', 'gland_size': size,
                        'entry_thread': thread, 'armour_compatibility': 'SWA',
                        'environment': 'Industrial / Safe', 'material': 'Brass',
                        'min_cable_dia_mm': min_dia, 'max_cable_dia_mm': max_dia,
                        'ordering_reference': ordering_ref
                    })
            return pd.DataFrame(data_rows)
    except Exception as e:
        print(f"Skipping CW: {e}")
        return pd.DataFrame()

def parse_universal_gland(pdf_path, model_key, config):
    print(f"Extracting {model_key} from {pdf_path}...")
    min_col, max_col = config['min_col'], config['max_col']
    materials_map, armour_type = config['materials'], config['armour']

    # Running "previous max" used ONLY for gland families where the datasheet gives
    # a single MAX diameter per row with no MIN column (min_col is None). These
    # sizes form contiguous bands, so a row's true lower bound is the previous
    # row's upper bound (e.g. row N-1 MAX 8.6 -> row N MIN 8.6).
    running_prev_max = None

    try:
        with pdfplumber.open(pdf_path) as pdf:
            raw_table = pdf.pages[0].extract_table()
            if not raw_table: return pd.DataFrame()

            data_rows = []
            for row in raw_table:
                row_zero = str(row[0]).strip() if row[0] else ""
                if not row_zero or not row_zero[0].isdigit():
                    continue

                clean_row = [str(cell).replace('\n', '').strip() if cell else "" for cell in row]

                thread = clean_row[3]
                for cell in clean_row[:6]:
                    match = re.search(r'(M\d{2,3})', cell)
                    if match:
                        thread = match.group(1)
                        break

                size, col1, col2 = clean_row[0], clean_row[1], clean_row[2]
                if ('RA' in col1 or 'AA' in col1) and not ('RA' in col2 or 'AA' in col2):
                    suffix, actual_type = col1, col2
                else:
                    suffix, actual_type = col2, col1
                if len(actual_type) > 10: actual_type = model_key.replace('_', '')
                base_ref = f"{size}{actual_type}{suffix}"

                overall_max = None
                if max_col is not None and max_col < len(clean_row):
                    c_max = re.sub(r'[^\d.]', '', clean_row[max_col])
                    overall_max = float(c_max) if c_max else None

                if min_col is None:
                    # Max-only column: chain the lower bound from the previous row's max.
                    overall_min = running_prev_max
                else:
                    overall_min = 0.0
                    if min_col < len(clean_row):
                        c_min = re.sub(r'[^\d.]', '', clean_row[min_col])
                        overall_min = float(c_min) if c_min else 0.0

                    # --- SMART LOOK-AHEAD FIXER FOR SHIFTED COLUMNS ---
                    # Only applies when we have both an explicit min_col and max_col;
                    # not used for the max-only chaining case above.
                    if overall_min is not None and overall_max is not None:
                        if overall_min > overall_max:
                            true_min = overall_max
                            true_max = overall_min
                            for shift in range(1, 5):
                                idx = max_col + shift
                                if idx < len(clean_row):
                                    val_str = re.sub(r'[^\d.]', '', clean_row[idx])
                                    if val_str:
                                        val = float(val_str)
                                        if val < 5.0:
                                            break
                                        if val > true_max:
                                            true_max = val
                                            break
                            overall_min = true_min
                            overall_max = true_max

                if max_col is not None and overall_max is not None:
                    running_prev_max = overall_max

                for mat_name, mat_suffix in materials_map.items():
                    data_rows.append({
                        'manufacturer': 'CMP',
                        'gland_model': model_key.replace('_', ' '),
                        'gland_size': size,
                        'entry_thread': thread,
                        'armour_compatibility': armour_type,
                        'environment': 'Industrial / Safe',
                        'material': mat_name,
                        'min_cable_dia_mm': overall_min,
                        'max_cable_dia_mm': overall_max,
                        'ordering_reference': f"{base_ref}{mat_suffix}"
                    })
            return pd.DataFrame(data_rows)
    except Exception as e:
        print(f"Skipping {model_key}: {e}")
        return pd.DataFrame()


if __name__ == "__main__":
    # --- UNIVERSAL DATA DICTIONARIES ---
    ALL_MATS = {'Brass': '', 'Nickel Plated Brass': '5', 'Stainless Steel': '4', 'Aluminium': '1'}
    BN_MATS = {'Brass': '', 'Nickel Plated Brass': '5'}

    # 🛠️ HOW TO TUNE THIS: If you look at the CSV and the 'max_cable_dia_mm' is completely wrong
    # for a specific gland, simply change the 'max_col' number here (+1 or -1) and run the script again!
    UNIVERSAL_CONFIG = {
        'BW':       {'min_col': None, 'max_col': 6,  'armour': 'SWA & AWA', 'materials': BN_MATS},
        'BWL':      {'min_col': None, 'max_col': 6,  'armour': 'SWA & AWA', 'materials': BN_MATS},
        'C2KGP':    {'min_col': 6,    'max_col': 7,  'armour': 'SWA & AWA', 'materials': ALL_MATS},
        'A2_SOLO':  {'min_col': 8,    'max_col': 9,  'armour': 'Unarmoured', 'materials': ALL_MATS},
        'A2RC':     {'min_col': 8,    'max_col': 9,  'armour': 'Unarmoured', 'materials': ALL_MATS},
        'BW_SOLO':  {'min_col': None, 'max_col': 6,  'armour': 'SWA & AWA', 'materials': BN_MATS},
        'BWL_CIEL': {'min_col': None, 'max_col': 5,  'armour': 'SWA & AWA', 'materials': ALL_MATS},
        'CW_CIEL':  {'min_col': 6,    'max_col': 7,  'armour': 'SWA',       'materials': ALL_MATS},
        'CW_SOLO':  {'min_col': 6,    'max_col': 7,  'armour': 'SWA',       'materials': ALL_MATS},
        'CX':       {'min_col': 6,    'max_col': 7,  'armour': 'Braid & STA', 'materials': ALL_MATS},
        'CXT':      {'min_col': None, 'max_col': 6,  'armour': 'Braid',     'materials': ALL_MATS},
        'E1U':      {'min_col': 8,    'max_col': 9,  'armour': 'Armoured',  'materials': ALL_MATS},
        'E1W':      {'min_col': 10,   'max_col': 11, 'armour': 'SWA & AWA', 'materials': ALL_MATS},
        'E1W_CIEL': {'min_col': 10,   'max_col': 11, 'armour': 'SWA & AWA', 'materials': ALL_MATS},
        'E1W_SOLO': {'min_col': 8,    'max_col': 9,  'armour': 'SWA & AWA', 'materials': ALL_MATS},
        'E1X':      {'min_col': 10,   'max_col': 11, 'armour': 'Braid & STA', 'materials': ALL_MATS},
        'E2U':      {'min_col': 8,    'max_col': 9,  'armour': 'Lead Sheathed', 'materials': ALL_MATS},
        'E2W':      {'min_col': 10,   'max_col': 11, 'armour': 'Lead Sheathed', 'materials': ALL_MATS},
        'E2W_CIEL': {'min_col': 10,   'max_col': 11, 'armour': 'Lead Sheathed', 'materials': ALL_MATS},
        'E2X':      {'min_col': 10,   'max_col': 11, 'armour': 'Lead Sheathed', 'materials': ALL_MATS},
        'SS2KGP':   {'min_col': 8,    'max_col': 9,  'armour': 'Unarmoured', 'materials': ALL_MATS},
        'SS2KGPPB': {'min_col': 10,   'max_col': 11, 'armour': 'Lead Sheathed', 'materials': ALL_MATS},
    }

    # --- BATCH PROCESSOR ---
    all_dfs = []
    datasheets_dir = "datasheets"

    if not os.path.exists(datasheets_dir):
        print(f"❌ Error: Please create a folder named '{datasheets_dir}' and put your 24 PDFs inside.")
    else:
        for filename in os.listdir(datasheets_dir):
            if not filename.endswith(".pdf"): continue

            filepath = os.path.join(datasheets_dir, filename)
            model_key = filename.replace(" METRIC.pdf", "").replace(" SOLO", "_SOLO").replace(" CIEL", "_CIEL").strip()

            if model_key in ['A2', 'A2F']:
                df = parse_a2_or_a2f(filepath, model_key, "Industrial / Safe")
                all_dfs.append(df)
            elif model_key == 'CW':
                df = parse_cw(filepath)
                all_dfs.append(df)
            elif model_key in UNIVERSAL_CONFIG:
                df = parse_universal_gland(filepath, model_key, UNIVERSAL_CONFIG[model_key])
                all_dfs.append(df)
            else:
                print(f"⚠️ Warning: '{model_key}' is not in our Config Map. Skipping.")

        # --- COMBINE AND QA ---
        if all_dfs:
            master_df = pd.concat(all_dfs, ignore_index=True)

            # QA: The "Duplicate Catch"
            duplicates = master_df[master_df.duplicated(['ordering_reference'], keep=False)]
            if not duplicates.empty:
                print(f"\n⚠️ Dropping {len(duplicates)} duplicate ordering references to ensure clean upload...")
                master_df = master_df.drop_duplicates(subset=['ordering_reference'], keep='first')

            print(f"\n✅ SUCCESS! Total Glands Parsed: {len(master_df)}")
            master_df.to_csv("master_gland_database.csv", index=False)
            print("Saved 'master_gland_database.csv'. You can now review it in Excel!")