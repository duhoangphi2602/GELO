import logging
import time
import asyncio
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ml.model_loader import load_model_package
from ml.predictor import predictor
from ml.preprocessing import download_and_preprocess
from ml.exceptions import DownloadError, InvalidImageError, ModelNotLoadedError

# Setup basic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("api")

# Lifespan context replacing on_event("startup")
@asynccontextmanager
async def lifespan(app: FastAPI):
    # PRELOAD MODEL PACKAGE
    try:
        package = load_model_package(version="v1")
        predictor.set_package(package)
        logger.info("FastAPI ready to receive predict requests.")
    except Exception as e:
        logger.error(f"Critical error on startup: {e}")
        
    yield
    # Cleanup resources (if any)
    logger.info("Service shutting down...")

app = FastAPI(title="Gelo AI Diagnostic Service", lifespan=lifespan)

# Allow CORS for NestJS backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Logging Middleware per User Request (Latency)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - Status: {response.status_code} - Latency: {process_time:.4f}s")
    return response

# Pydantic schemas
class PredictRequest(BaseModel):
    image_urls: List[str]  # Expected: ['/uploads/abc.jpg', ...]
    scan_id: Optional[int] = None

@app.get("/ai/health")
async def health_check():
    """NestJS will call this before processing a scan."""
    return {
        "status": "online",
        "model_loaded": predictor.is_ready,
        "model_version": predictor.version
    }

@app.post("/ai/predict")
async def predict(body: PredictRequest):
    if not predictor.is_ready:
        raise HTTPException(status_code=503, detail="AI Service is currently initializing or model failed to load.")
        
    # Standardize URLs (Support Cloudinary or local paths)
    host = "http://localhost:3000"
    full_urls = []
    for url in body.image_urls:
        if url.startswith("http"):
            full_urls.append(url)
        else:
            full_urls.append(f"{host}{url if url.startswith('/') else '/' + url}")
    
    try:
        # Preprocessing Pipeline (Async HTTP -> PyTorch Tensor) (1, C, H, W) -> list
        tasks = [download_and_preprocess(url, predictor.config) for url in full_urls]
        tensors = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions (fault-tolerance for ensemble)
        valid_tensors = []
        for t in tensors:
            if isinstance(t, Exception):
                logger.warning(f"Skipping failed image tensor: {type(t).__name__} - {str(t)}")
            else:
                valid_tensors.append(t)
        
        if not valid_tensors:
            raise InvalidImageError("All provided images failed to download or preprocess.")
            
        import torch
        batch_tensor = torch.cat(valid_tensors, dim=0) # Stacks (1, C, H, W) -> (N, C, H, W)
        
        # Inference (Singleton)
        result = predictor.predict(batch_tensor)
        
        return {
            "disease_id": result.get("diseaseId"),
            "diagnosticStatus": result.get("diagnosticStatus", "DISEASE"),
            "name": result.get("name", "Unknown"),
            "confidence": result["confidence"],
            "model_version": predictor.version
        }
    except DownloadError as e:
        logger.error(f"DownloadError on batch: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except InvalidImageError as e:
        logger.error(f"InvalidImageError on batch: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected processing error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during ML pipeline")
