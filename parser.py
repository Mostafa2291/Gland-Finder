import pdfplumber
import pandas as pd
import re
import os
from sqlalchemy import create_engine
from urllib.parse import quote_plus

def clean_stacked_values(val_str):
    """
    Takes a string with stacked numbers (e.g. "6.1\n11.5" or "8.7  3.2")
    and returns a tuple of (min_val, max_val).
    """
    if pd.isna(val_str) or not str(val_str).strip():
        return None, None
    
    # Replace newlines with spaces and split by whitespace
    parts = [p.strip() for p in str(val_str).replace('\n', ' ').split() if p.strip()]
    
    try:
        # Convert to floats and sort to guarantee (min, max) order
        vals = sorted([float(re.sub(r'[^\d.]', '', p)) for p in parts if re.sub(r'[^\d.]', '', p)])
        if len(vals) >= 2:
            return vals[0], vals[-1]
        elif len(vals) == 1:
            return vals[0], vals[0]
    except ValueError:
        pass
    
    return None, None

def parse_a2_or_a2f(pdf_path, gland_model, environment):
    print(f"Extracting {gland_model} from {pdf_path}...")
    
    with pdfplumber.open(pdf_path) as pdf:
        raw_table = pdf.pages[0].extract_table()
        if not raw_table:
            return pd.DataFrame()
            
        data_rows = []
        for row in raw_table:
            if row[0] and any(char.isdigit() for char in row[0]):
                size = str(row[0]).replace('\n', '')
                thread = str(row[1]).split('\n')[0].strip()
                
                # Dynamically find the Ordering Ref by searching for the model name
                # This detects if pdfplumber shifted the columns due to vertical lines
                ref_idx = 9 # Standard index
                for i, cell in enumerate(row):
                    if cell and gland_model in str(cell).upper():
                        ref_idx = i
                        break
                        
                ordering_ref = str(row[ref_idx]).replace('\n', '').strip()
                
                # If the index shifted to 10, it means the Min/Min column was split into two!
                if ref_idx >= 10:
                    val1, _ = clean_stacked_values(row[5])
                    val2, _ = clean_stacked_values(row[6])
                    
                    # Safely assign min and max ensuring we don't crash on None
                    vals = [v for v in [val1, val2] if v is not None]
                    min_dia = min(vals) if vals else None
                    max_dia = max(vals) if vals else None
                else:
                    min_dia, max_dia = clean_stacked_values(row[5])
                
                data_rows.append({
                    'manufacturer': 'CMP',
                    'gland_model': gland_model,
                    'gland_size': size,
                    'entry_thread': thread,
                    'armour_compatibility': 'Unarmoured' if gland_model == 'A2' else 'Unarmoured & Braided',
                    'environment': environment,
                    'min_cable_dia_mm': min_dia,
                    'max_cable_dia_mm': max_dia,
                    'max_inner_bedding_dia_mm': None, 
                    'min_armour_thickness_mm': None,  
                    'max_armour_thickness_mm': None,  
                    'ordering_reference': ordering_ref
                })
        return pd.DataFrame(data_rows)

def parse_cw(pdf_path):
    print(f"Extracting CW from {pdf_path}...")
    
    with pdfplumber.open(pdf_path) as pdf:
        raw_table = pdf.pages[0].extract_table()
        if not raw_table:
            return pd.DataFrame()
            
        data_rows = []
        for row in raw_table:
            if row[0] and any(char.isdigit() for char in row[0]):
                size = str(row[0]).replace('\n', '')
                thread = str(row[1]).replace('\n', '')
                
                # Dynamically find the Ordering Ref for CW
                ref_idx = 9
                for i, cell in enumerate(row):
                    if cell and 'CW' in str(cell).upper():
                        ref_idx = i
                        break
                        
                ordering_ref = str(row[ref_idx]).replace('\n', '').strip()
                
                # Safely extract bedding max (stripping out hidden newlines)
                bedding_str = str(row[3]).replace('\n', '').strip()
                bedding_max = float(bedding_str) if bedding_str.replace('.', '', 1).isdigit() else None
                
                # --- TRULY BULLETPROOF EXTRACTION LOGIC ---
                # Grab ALL text between Bedding Max (col 3) and the Ordering Reference.
                # This guarantees we don't miss numbers even if pdfplumber merges the last 3 columns.
                raw_text = " ".join(str(row[i]) for i in range(4, ref_idx) if i < len(row) and row[i])
                parts = [p.strip() for p in raw_text.replace('\n', ' ').split() if p.strip()]
                
                # Strip out any non-numeric characters and convert to a clean list of floats
                vals = []
                for p in parts:
                    clean_p = re.sub(r'[^\d.]', '', p)
                    if clean_p:
                        try:
                            vals.append(float(clean_p))
                        except ValueError:
                            pass
                
                # We know the strict physical sequence of numbers in the CMP CW datasheet row:
                # [Overall Dia 1, Overall Dia 2, Armour 1, Armour 2, Flats, Corners, Protrusion]
                
                # The first two numbers ALWAYS belong to Overall Cable Diameter
                dia_vals = vals[:2] if len(vals) >= 2 else vals
                # The next two numbers ALWAYS belong to Armour Range
                arm_vals = vals[2:4] if len(vals) >= 4 else (vals[2:] if len(vals) > 2 else [])
                
                min_dia = min(dia_vals) if dia_vals else None
                max_dia = max(dia_vals) if dia_vals else None
                
                min_arm = min(arm_vals) if arm_vals else None
                max_arm = max(arm_vals) if arm_vals else None
                
                data_rows.append({
                    'manufacturer': 'CMP',
                    'gland_model': 'CW',
                    'gland_size': size,
                    'entry_thread': thread,
                    'armour_compatibility': 'SWA',
                    'environment': 'Industrial / Safe',
                    'min_cable_dia_mm': min_dia,
                    'max_cable_dia_mm': max_dia,
                    'max_inner_bedding_dia_mm': bedding_max,
                    'min_armour_thickness_mm': min_arm,
                    'max_armour_thickness_mm': max_arm,
                    'ordering_reference': ordering_ref
                })
        return pd.DataFrame(data_rows)

if __name__ == "__main__":
    # --- 1. Process all three files ---
    df_a2 = parse_a2_or_a2f("datasheets/A2-Cable-Gland-Catalogue-CMP-UK.pdf", "A2", "Industrial / Safe")
    df_a2f = parse_a2_or_a2f("datasheets/A2F-Cable-Gland-Catalogue-CMP-UK.pdf", "A2F", "Hazardous / Ex")
    df_cw = parse_cw("datasheets/CW-Cable-Gland-Catalogue-CMP-UK (1).pdf")
    
    # --- 2. Combine into a single Master Database Table ---
    master_df = pd.concat([df_a2, df_a2f, df_cw], ignore_index=True)
    
    print("\n--- Consolidated Database Preview ---")
    print(master_df[['gland_model', 'gland_size', 'armour_compatibility', 'min_cable_dia_mm', 'max_cable_dia_mm']].head(10))
    print("\nTotal Glands Parsed:", len(master_df))
    
    # --- 3. Export to CSV (Ready for PostgreSQL import) ---
    script_directory = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_directory, "master_gland_database.csv")
    
    master_df.to_csv(output_path, index=False)
    print(f"\nSuccessfully saved backup to: {output_path}")

    # --- 4. Upload to PostgreSQL Database ---
    # NOTE: Replace 'your_password_here' with your actual pgAdmin master password
    DB_USER = "postgres"
    DB_PASSWORD = "P@ssw0rd"
    DB_HOST = "localhost"
    DB_PORT = "5432"
    DB_NAME = "gland_db" # Make sure you created this empty database in pgAdmin!

    print("\nAttempting to connect to PostgreSQL...")
    try:
        # Encode the password to safely escape special characters like '@'
        encoded_password = quote_plus(DB_PASSWORD)
        
        # Create the database engine using the encoded password
        engine = create_engine(f"postgresql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
        
        # Upload the dataframe to a SQL table called 'cable_glands'
        master_df.to_sql('cable_glands', engine, if_exists='replace', index=False)
        
        print("SUCCESS: Uploaded the data to the 'cable_glands' table in PostgreSQL!")
    except Exception as e:
        print(f"\nFAILED to upload to PostgreSQL. Error:\n{e}")
        print("\nTroubleshooting:")
        print("1. Did you create the 'gland_db' database in pgAdmin?")
        print("2. Did you change the DB_PASSWORD in the script to match yours?")
        print("3. Did you install sqlalchemy and psycopg2-binary?")