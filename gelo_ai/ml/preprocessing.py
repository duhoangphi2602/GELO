import io
import httpx
import logging
import numpy as np
import torch
from PIL import Image, UnidentifiedImageError
from .exceptions import DownloadError, InvalidImageError

logger = logging.getLogger("preprocessing")

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

async def fetch_image_async(image_url: str, timeout: float = 5.0) -> bytes:
    logger.info(f"Downloading image from {image_url} (timeout={timeout}s)")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(image_url, timeout=timeout)
            response.raise_for_status()
            
            content_type = response.headers.get("Content-Type", "")
            if not content_type.startswith("image/"):
                raise InvalidImageError(f"Invalid content type: {content_type}")
                
            image_data = response.content
            if len(image_data) > MAX_IMAGE_SIZE_BYTES:
                raise InvalidImageError("Image exceeds maximum size limits (10MB)")
                
            return image_data
    except httpx.RequestError as e:
        logger.error(f"Network error while downloading: {e}")
        raise DownloadError("Failed to fetch image due to network error")
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error {e.response.status_code} while downloading")
        raise DownloadError(f"Server responded with {e.response.status_code}")

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

    # Read config
    input_size = config.get("input_size", [3, 224, 224]) # [C, H, W]
    target_width = input_size[2]
    target_height = input_size[1]
    
    normalization = config.get("normalize", {})
    mean_list = normalization.get("mean", [0.485, 0.456, 0.406])
    std_list = normalization.get("std", [0.229, 0.224, 0.225])

    # 1. Resize
    img = img.resize((target_width, target_height), Image.Resampling.BILINEAR)
    
    # 2. To Numpy & Rescale [0, 1]
    img_arr = np.array(img).astype(np.float32) / 255.0
    
    # 3. Normalize
    mean = np.array(mean_list).astype(np.float32)
    std = np.array(std_list).astype(np.float32)
    img_arr = (img_arr - mean) / std

    # 4. Transpose (H, W, C) -> (C, H, W)
    img_arr = np.transpose(img_arr, (2, 0, 1))

    # 5. Convert to Tensor & Add Batch Dimension
    tensor = torch.tensor(img_arr).unsqueeze(0)

    return tensor

async def download_and_preprocess(image_url: str, config: dict) -> torch.Tensor:
    image_bytes = await fetch_image_async(image_url)
    tensor = preprocess_image_tensor(image_bytes, config)
    return tensor
