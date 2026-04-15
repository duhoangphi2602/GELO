import logging
import time
import asyncio
import os
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel

from ml.model_loader import load_model_package
from ml.predictor import predictor
from ml.preprocessing import download_and_preprocess
from ml.exceptions import DownloadError, InvalidImageError, ModelNotLoadedError

# Internal Security
API_KEY = os.getenv("INTERNAL_API_KEY")
if not API_KEY:
    # In a production environment, this should probably raise an error.
    # For now, we log a critical warning.
    logging.getLogger("api").warning("INTERNAL_API_KEY is not set! API will be inaccessible.")

api_key_header = APIKeyHeader(name="X-Internal-Api-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    if not API_KEY or api_key != API_KEY:
        raise HTTPException(
            status_code=403,
            detail="Could not validate internal credentials"
        )
    return api_key

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
        # Check if v1 exists before loading
        base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_package", "v1")
        if os.path.exists(base_dir):
            package = load_model_package(version="v1")
            predictor.set_package(package)
            logger.info("FastAPI ready with model package v1.")
        else:
            logger.warning("No model package found at startup. AI Service running in Engine-Only (Mock) mode.")
    except Exception as e:
        logger.error(f"Error during package initialization: {e}")
        
    yield
    # Cleanup resources (if any)
    logger.info("Service shutting down...")

app = FastAPI(title="Gelo AI Diagnostic Service", lifespan=lifespan)

# Allow CORS for NestJS backend & Frontend
backend_url = os.getenv("BACKEND_URL", "http://localhost:3000")
cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[backend_url, cors_origin],
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

@app.post("/ai/predict", dependencies=[Depends(verify_api_key)])
async def predict(body: PredictRequest):
    if not predictor.is_ready:
        raise HTTPException(status_code=503, detail="AI Service is currently initializing or model failed to load.")
        
    # Standardize URLs (Support Cloudinary or local paths)
    host = os.getenv("BACKEND_URL", "http://localhost:3000")
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
