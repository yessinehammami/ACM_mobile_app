from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import os
import logging
from datetime import datetime
from scrape import get_all_articles_table

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="ACM Data API")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
CSV_PATH = os.path.join(DATA_DIR, "ACM_data.csv")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Global state for scraping status
scraper_state = {
    "last_update": None,
    "is_scraping": False,
    "next_update": None,
    "status": "idle"
}


def scrape_data():
    """Background task to scrape data"""
    global scraper_state
    
    if scraper_state["is_scraping"]:
        logger.info("Scraping already in progress, skipping...")
        return
    
    scraper_state["is_scraping"] = True
    scraper_state["status"] = "scraping"
    
    def progress_callback(current, total, label):
        logger.info(f"Scraping progress: {current}/{total} - {label}")
    
    try:
        logger.info("Starting data scrape...")
        result = get_all_articles_table(progress_callback=progress_callback)
        
        if result is not None:
            result.to_csv(CSV_PATH, index=False)
            scraper_state["last_update"] = datetime.now().isoformat()
            scraper_state["status"] = "success"
            logger.info(f"✓ Scraping completed! Saved {len(result)} rows to {CSV_PATH}")
        else:
            scraper_state["status"] = "no_data"
            logger.warning("No data scraped")
            
    except Exception as e:
        scraper_state["status"] = "error"
        logger.error(f"✗ Scraping failed: {str(e)}", exc_info=True)
    finally:
        scraper_state["is_scraping"] = False


# Initialize scheduler
scheduler = BackgroundScheduler()

# Schedule weekly scraping (Saturday at 23:59 / 11:59 PM)
scheduler.add_job(
    scrape_data,
    CronTrigger(day_of_week=5, hour=23, minute=59),  # Saturday 11:59 PM
    id='weekly_scrape',
    name='Weekly ACM data scrape (Saturday 23:59)',
    replace_existing=True
)

# Add a startup job to check data immediately
scheduler.add_job(
    scrape_data,
    'date',
    run_date=None,  # Run immediately on startup if data is missing
    id='startup_check',
    name='Startup data check',
    replace_existing=True
)


@app.on_event("startup")
async def startup_event():
    """Start the scheduler on app startup"""
    logger.info("Starting scheduler...")
    scheduler.start()
    
    # Check if we need to scrape on startup
    if not os.path.exists(CSV_PATH):
        logger.info("No existing data found, scraping on startup...")
        scrape_data()


@app.on_event("shutdown")
async def shutdown_event():
    """Shut down the scheduler"""
    logger.info("Shutting down scheduler...")
    scheduler.shutdown()


@app.get("/api/data/csv")
async def get_csv():
    """Serve the CSV file"""
    if not os.path.exists(CSV_PATH):
        raise HTTPException(status_code=404, detail="Data not available yet. Scraping in progress...")
    return FileResponse(CSV_PATH, media_type="text/csv", filename="ACM_data.csv")


@app.get("/api/status")
async def get_status():
    """Get the current scraper status"""
    return JSONResponse({
        "last_update": scraper_state["last_update"],
        "is_scraping": scraper_state["is_scraping"],
        "status": scraper_state["status"],
        "data_available": os.path.exists(CSV_PATH),
        "next_scheduled_update": "Every Monday at 2:00 AM"
    })


@app.post("/api/scrape/now")
async def scrape_now():
    """Manually trigger a scrape (useful for testing)"""
    if scraper_state["is_scraping"]:
        return JSONResponse(
            {"message": "Scraping already in progress"},
            status_code=202
        )
    
    # Run scrape in background
    scheduler.add_job(scrape_data, 'date', run_date=None)
    
    return JSONResponse({
        "message": "Scraping started",
        "status": "in_progress"
    })


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "ACM Data API",
        "version": "1.0.0",
        "endpoints": {
            "csv": "/api/data/csv",
            "status": "/api/status",
            "manual_scrape": "/api/scrape/now (POST)"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
