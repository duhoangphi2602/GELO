class DownloadError(Exception):
    """Raised when the image download fails due to network or timeout issues."""
    pass

class InvalidImageError(Exception):
    """Raised when the downloaded file is not a valid image or exceeds size limits."""
    pass

class ModelDownloadError(Exception):
    """Raised when the model download fails due to network or timeout issues."""
    pass

class ModelInvalidError(Exception):
    """Raised when the downloaded file is not a valid model or exceeds size limits."""
    pass

class ModelNotLoadedError(Exception):
    """Raised when prediction is requested but the model hasn't been initialized."""
    pass
