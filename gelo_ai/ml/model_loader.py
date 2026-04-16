import os
import json
import logging
import torch
import torch.nn as nn
from torchvision import models

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
            logger.warning(f"Missing model.pt in {self.version_dir} - Falling back to Mock Engine.")
            self.model = "mock"
        else:
            try:
                # Attempt 1: Load as TorchScript (Production preferred)
                self.model = torch.jit.load(model_path, map_location=self.device)
                self.model.eval()
                logger.info(f"TorchScript model loaded successfully to {self.device}")
            except Exception as e:
                logger.warning(f"Could not load as TorchScript (Expected for state_dict files): {e}")
                
                try:
                    # Attempt 2: Load as standard pickle (state_dict or full model)
                    loaded_data = torch.load(model_path, map_location=self.device)
                    
                    if isinstance(loaded_data, dict):
                        # Use 'model_state_dict' if present (common for checkpoints)
                        raw_state_dict = loaded_data.get("model_state_dict", loaded_data)
                        
                        # Fix classifier naming mismatch (e.g., from classifier.1.1... to classifier.1...)
                        state_dict = {}
                        for k, v in raw_state_dict.items():
                            new_key = k.replace("classifier.1.1.", "classifier.1.")
                            state_dict[new_key] = v
                        
                        arch_type = self.config.get("architecture", "efficientnet_v2_s")
                        num_classes = self.config.get("num_classes", 4)
                        
                        logger.info(f"Detected state_dict. Reconstructing architecture: {arch_type}")
                        
                        if arch_type == "efficientnet_v2_s":
                            self.model = models.efficientnet_v2_s(weights=None)
                            in_features = self.model.classifier[1].in_features
                            self.model.classifier[1] = nn.Linear(in_features, num_classes)
                            
                            # Load with strict=False to be more resilient to minor layer naming differences
                            self.model.load_state_dict(state_dict, strict=False)
                            self.model.to(self.device)
                            self.model.eval()
                            logger.info(f"Successfully reconstructed {arch_type} and loaded weights.")
                            
                            # Auto-Sync Metadata from checkpoint to config
                            synced_keys = []
                            for key in ["input_size", "mean", "std"]:
                                if key in loaded_data:
                                    self.config[key] = loaded_data[key]
                                    synced_keys.append(key)
                            
                            if "label_mapping" in loaded_data:
                                # Standardize label mapping: ensure keys are strings (JSON compatible)
                                raw_mapping = loaded_data["label_mapping"]
                                self.labels = {str(k): v for k, v in raw_mapping.items()}
                                synced_keys.append("label_mapping")
                                
                            if synced_keys:
                                logger.info(f"Auto-Sync Complete. Overrode config with metadata from checkpoint: {synced_keys}")
                        else:
                            raise ValueError(f"Unsupported architecture for state_dict loading: {arch_type}")
                    else:
                        self.model = loaded_data
                        self.model.eval()
                        logger.info("Loaded PyTorch model using standard torch.load")
                except Exception as e2:
                    logger.error(f"Critical failure loading model weights: {e2}")
                    self.model = "mock"
                    logger.warning("Starting in Mock Mode to maintain service availability.")

def load_model_package(version: str = "v1") -> ModelPackage:
    """
    Factory to construct and cache the model framework.
    """
    base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "model_package", version)
    logger.info(f"Initializing Model Package from: {base_dir}")
    
    package = ModelPackage(version_dir=base_dir)
    return package
