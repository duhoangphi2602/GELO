import io
import os
import httpx
import logging
import torch
from torchvision import transforms
from PIL import Image, UnidentifiedImageError
from .exceptions import DownloadError, InvalidImageError

logger = logging.getLogger("preprocessing")

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

async def fetch_image_async(image_url: str, timeout: float = 10.0) -> bytes:
    logger.info(f"Downloading image from {image_url} (timeout={timeout}s)")
    try:
        # Check environment variable for SSL verification (default to True for security)
        ssl_verify_str = os.getenv("SSL_VERIFY", "True").lower()
        verify_ssl = ssl_verify_str in ("true", "1", "yes")
        if not verify_ssl:
            logger.warning("SSL Verification is DISABLED. Do not use this in production.")

        async with httpx.AsyncClient(verify=verify_ssl) as client:
            response = await client.get(image_url, timeout=timeout)
            response.raise_for_status()
            
            content_type = response.headers.get("Content-Type", "")
            if not content_type.startswith("image/"):
                raise InvalidImageError(f"Invalid content type: {content_type} for URL: {image_url}")
                
            image_data = response.content
            if len(image_data) > MAX_IMAGE_SIZE_BYTES:
                raise InvalidImageError(f"Image from {image_url} exceeds maximum size limits (10MB)")
                
            return image_data
    except httpx.RequestError as e:
        logger.error(f"Network error while downloading {image_url}: {str(e)}")
        raise DownloadError(f"Failed to fetch image due to network error: {str(e)}")
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error {e.response.status_code} while downloading {image_url}")
        raise DownloadError(f"Server responded with {e.response.status_code} for {image_url}")
    except Exception as e:
        logger.error(f"Unexpected error while fetching {image_url}: {str(e)}")
        raise DownloadError(f"Error fetching image: {str(e)}")

def preprocess_image_tensor(image_bytes: bytes, config: dict) -> torch.Tensor:
    """
    Parses bytes and executes preprocessing dynamically driven by the config.json.
    Returns PyTorch Tensor shape (1, C, H, W).
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img = img.convert("RGB")
    except UnidentifiedImageError:
        raise InvalidImageError("Downloaded file is not a valid or readable image")

    # Read config robustly
    raw_input_size = config.get("input_size", [3, 224, 224])
    if isinstance(raw_input_size, int):
        target_width = raw_input_size
        target_height = raw_input_size
    else:
        # Assuming [C, H, W] or [H, W]
        target_width = raw_input_size[-1]
        target_height = raw_input_size[-2]
    
    # Normalization: handle both root keys and nested 'normalize' key
    norm_config = config.get("normalize", config) 
    mean_list = norm_config.get("mean", [0.485, 0.456, 0.406])
    std_list = norm_config.get("std", [0.229, 0.224, 0.225])

    # 1. Setup transforms
    preprocess = transforms.Compose([
        transforms.Resize((target_height, target_width), interpolation=transforms.InterpolationMode.BILINEAR),
        transforms.ToTensor(), # Converts to [0, 1] and [C, H, W]
        transforms.Normalize(mean=mean_list, std=std_list)
    ])

    # 2. Apply transforms
    tensor = preprocess(img)

    # 3. Add Batch Dimension
    tensor = tensor.unsqueeze(0)

    return tensor

async def download_and_preprocess(image_url: str, config: dict) -> torch.Tensor:
    image_bytes = await fetch_image_async(image_url)
    tensor = preprocess_image_tensor(image_bytes, config)
    return tensor
