import duckdb
import pandas as pd
from fastapi import FastAPI, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
import sys, os
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "scraper"))
from scrape import get_all_articles_table

app = FastAPI()

# CORS configuration from environment variable
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

CSV_PATH = os.path.join(os.path.dirname(__file__), "data", "ACM_data.csv")

FILTER_COLUMNS = [
    "Produit", "Importateur", "Fournisseur", "Provenance",
    "N° Lot", "Fabrication", "Expiration", "article_code", "Référence"
]

REFRESH_STATUS = {"running": False, "last_error": None, "last_error_time": None, "last_success_time": None}

# Global DuckDB connection
db = None


def init_db():
    """Initialize DuckDB connection with CSV data."""
    global db
    if not os.path.exists(CSV_PATH):
        print(f"❌ CSV file not found at {CSV_PATH}")
        return False
    
    print(f"Loading data with DuckDB from {CSV_PATH}...")
    db = duckdb.connect(":memory:")
    
    try:
        db.execute(f"CREATE TABLE data AS SELECT * FROM read_csv_auto('{CSV_PATH}')")
        print("✅ CSV loaded into DuckDB")
    except Exception as e:
        print(f"❌ Error loading CSV: {e}")
        return False
    
    # Rename "N" column to "Référence" if it exists
    try:
        db.execute("ALTER TABLE data RENAME COLUMN N TO Référence")
    except:
        pass
    
    row_count = db.execute("SELECT COUNT(*) FROM data").fetchall()[0][0]
    print(f"✅ Data loaded: {row_count} rows")
    return True


@app.on_event("startup")
def startup_event():
    """Load CSV on startup."""
    init_db()


@app.get("/data/all")
def get_all_data():
    """Get all data at once for client-side caching and filtering."""
    print(f"GET /data/all - fetching data...")
    
    if db is None:
        print("❌ Database not initialized")
        return {"rows": [], "columns": [], "options": {}}
    
    try:
        print("  1. Fetching all rows from database...")
        result = db.execute("SELECT * FROM data").fetchall()
        print(f"  ✓ Got {len(result)} rows")
        
        print("  2. Getting column names...")
        columns = [desc[0] for desc in db.execute("SELECT * FROM data LIMIT 0").description]
        print(f"  ✓ Got {len(columns)} columns")
        
        print("  3. Converting rows to dictionaries...")
        rows = [dict(zip(columns, row)) for row in result]
        print(f"  ✓ Converted all rows")
        
        print("  4. Getting filter options...")
        options = {}
        for col in FILTER_COLUMNS:
            try:
                opts = db.execute(f'SELECT DISTINCT "{col}" FROM data WHERE "{col}" IS NOT NULL ORDER BY "{col}"').fetchall()
                options[col] = [o[0] for o in opts]
                print(f"    ✓ {col}: {len(options[col])} unique values")
            except Exception as col_err:
                print(f"    ⚠ {col}: Error - {col_err}")
                options[col] = []
        
        print(f"✅ /data/all complete - returning {len(rows)} rows")
        return {"rows": rows, "columns": columns, "options": options}
        
    except Exception as e:
        print(f"❌ Error in /data/all: {e}")
        import traceback
        traceback.print_exc()
        return {"rows": [], "columns": [], "options": {}}


def run_refresh():
    """Refresh data from scraper."""
    global db
    REFRESH_STATUS["running"] = True
    REFRESH_STATUS["last_error"] = None
    REFRESH_STATUS["last_error_time"] = None
    try:
        print("Starting refresh...")
        new_data = get_all_articles_table()
        if new_data is not None:
            # Rename N to Référence if exists
            if "N" in new_data.columns:
                new_data = new_data.rename(columns={"N": "Référence"})
            new_data.to_csv(CSV_PATH, index=False)
            print("CSV updated, reloading...")
            init_db()  # Reload the database
            print("Refresh complete!")
            REFRESH_STATUS["last_success_time"] = datetime.now().isoformat()
        else:
            error_msg = "No data returned from scraper"
            print(f"Refresh error: {error_msg}")
            REFRESH_STATUS["last_error"] = error_msg
            REFRESH_STATUS["last_error_time"] = datetime.now().isoformat()
    except Exception as e:
        error_msg = str(e)
        print(f"Refresh error: {error_msg}")
        REFRESH_STATUS["last_error"] = error_msg
        REFRESH_STATUS["last_error_time"] = datetime.now().isoformat()
    finally:
        REFRESH_STATUS["running"] = False


@app.post("/refresh")
def refresh(background_tasks: BackgroundTasks):
    """Trigger data refresh."""
    if REFRESH_STATUS["running"]:
        return {"status": "already_running"}
    background_tasks.add_task(run_refresh)
    return {"status": "started"}


@app.get("/refresh-status")
def refresh_status():
    """Get refresh status."""
    return REFRESH_STATUS


@app.get("/health")
def health():
    """Health check endpoint."""
    status = "ready" if db is not None else "not_ready"
    return {"status": status, "db_initialized": db is not None, "csv_exists": os.path.exists(CSV_PATH)}