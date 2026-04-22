import pytest
import torch
import numpy as np
from PIL import Image
import io

from ml.preprocessing import preprocess_image_tensor
from ml.predictor import PredictorService

# Mock Config
MOCK_CONFIG = {
    "version": "1.0",
    "architecture": "efficientnet_v2_s",
    "num_classes": 4,
    "input_size": 224,
    "mean": [0.485, 0.456, 0.406],
    "std": [0.229, 0.224, 0.225],
    "inference_threshold": 0.70,
    "enabled_disease_codes": ["L20.9", "D18.0", "MEL_NEV_MOL", "L10"]
}

def generate_mock_image_bytes():
    img = Image.new('RGB', (300, 300), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    return img_byte_arr.getvalue()

def test_preprocess_image_tensor_shape():
    image_bytes = generate_mock_image_bytes()
    tensor = preprocess_image_tensor(image_bytes, MOCK_CONFIG)
    assert tensor.shape == (1, 3, 224, 224), f"Expected shape (1, 3, 224, 224), got {tensor.shape}"

def test_integration_unknown_classification():
    # Setup mock service
    service = PredictorService()
    
    class MockPackage:
        def __init__(self):
            self.version_dir = "/mock/v1"
            self.config = MOCK_CONFIG
            self.labels = {}
            self.model = "mock"
            self.device = torch.device("cpu")
            
    service.set_package(MockPackage())
    
    # Create an input tensor that will yield uniform probabilities [0.25, 0.25, 0.25, 0.25] from the mock logic
    mock_input = torch.randn(1, 3, 224, 224)
    result = service.predict(mock_input)
    
    # Since 0.25 < 0.70 (THRESHOLD), it should classify as Unknown
    assert result["diagnosticStatus"] == "UNKNOWN"
    assert result["diseaseId"] == 0
    assert result["name"] == "Unknown"
    assert result["confidence"] == 0.25

def test_numpy_vs_torchvision_mse():
    # Old Numpy preprocessing logic for comparison
    def old_numpy_preprocess(image_bytes, config):
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        target_size = config["input_size"]
        img = img.resize((target_size, target_size), Image.Resampling.BILINEAR)
        img_arr = np.array(img).astype(np.float32) / 255.0
        mean = np.array(config["mean"]).astype(np.float32)
        std = np.array(config["std"]).astype(np.float32)
        img_arr = (img_arr - mean) / std
        img_arr = np.transpose(img_arr, (2, 0, 1))
        return torch.tensor(img_arr).unsqueeze(0)

    image_bytes = generate_mock_image_bytes()
    
    # Calculate both
    tensor_old = old_numpy_preprocess(image_bytes, MOCK_CONFIG)
    tensor_new = preprocess_image_tensor(image_bytes, MOCK_CONFIG)
    
    # Calculate MSE
    mse = torch.nn.functional.mse_loss(tensor_old, tensor_new).item()
    
    # Note: Bilinear interpolation in PIL vs torchvision might have very slight differences
    # but usually they are within 1e-5 if both use float32.
    assert mse < 1e-5, f"MSE {mse} exceeds acceptable threshold for numpy vs torchvision swappability"

def test_swappability_output_schema():
    service = PredictorService()
    
    class MockPackage:
        def __init__(self):
            self.version_dir = "/mock/v2"
            self.config = MOCK_CONFIG
            self.labels = {}
            self.model = "mock"
            self.device = torch.device("cpu")
            
    service.set_package(MockPackage())
    
    mock_input = torch.randn(1, 3, 224, 224)
    result = service.predict(mock_input)
    
    # Validate schema
    assert "diseaseId" in result
    assert "code" in result
    assert "diagnosticStatus" in result
    assert "name" in result
    assert "confidence" in result
