import os
import json
import logging
import torch

logger = logging.getLogger("model_loader")

class ModelPackage:
    def __init__(self, version_dir: str):
        self.version_dir = version_dir
        self.config = {}
        self.labels = {}
        self.model = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._load_all()

    def _load_all(self):
        # 1. Load config
        config_path = os.path.join(self.version_dir, "config.json")
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Missing config.json in {self.version_dir}")
        with open(config_path, "r") as f:
            self.config = json.load(f)

        # 2. Load labels
        labels_path = os.path.join(self.version_dir, "labels.json")
        if not os.path.exists(labels_path):
            raise FileNotFoundError(f"Missing labels.json in {self.version_dir}")
        with open(labels_path, "r") as f:
            self.labels = json.load(f)

        # 3. Load model weight
        model_path = os.path.join(self.version_dir, "model.pt")
        if not os.path.exists(model_path):
            logger.warning(f"Missing model.pt in {self.version_dir} - Loading Mock Architecture instead for testing!")
            self.model = "mock"
        else:
            try:
                # Load torch model. Using JIT is common for production, or standard state_dict if architecture is present.
                # Assuming standard TorchScript for framework independence:
                self.model = torch.jit.load(model_path, map_location=self.device)
                self.model.eval()
                logger.info(f"PyTorch model successfully loaded to {self.device}")
            except Exception as e:
                logger.error(f"Error loading torch model {model_path}: {e}")
                # Optional fallback to general torch.load
                try:
                    self.model = torch.load(model_path, map_location=self.device)
                    self.model.eval()
                    logger.info("Loaded PyTorch model using standard torch.load")
                except Exception as e2:
                    raise RuntimeError("Failed to load model weights. Ensure it is a valid torchscript or pt file.") from e2

def load_model_package(version: str = "v1") -> ModelPackage:
    """
    Factory to construct and cache the model framework.
    """
    base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "model_package", version)
    logger.info(f"Initializing Model Package from: {base_dir}")
    
    package = ModelPackage(version_dir=base_dir)
    return package
