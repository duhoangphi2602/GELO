import os
import json
import logging
import re
import torch
import torch.nn as nn

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
        """Main orchestration of package loading."""
        try:
            self._load_config()
            self._load_labels()
            self._load_model_weights()
        except Exception as e:
            logger.error(f"Failed to initialize model package from {self.version_dir}: {e}")
            self.model = "mock"

    def _load_config(self):
        config_path = os.path.join(self.version_dir, "config.json")
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Missing config.json in {self.version_dir}")
        with open(config_path, "r") as f:
            self.config = json.load(f)

    def _load_labels(self):
        labels_path = os.path.join(self.version_dir, "labels.json")
        if not os.path.exists(labels_path):
            raise FileNotFoundError(f"Missing labels.json in {self.version_dir}")
        with open(labels_path, "r") as f:
            self.labels = json.load(f)

    def _load_model_weights(self):
        """Attempts to load weights using multiple strategies."""
        model_path = self._get_model_file()
        if not model_path:
            logger.warning(f"No weight file (model.pt/pth) found in {self.version_dir}. Falling back to Mock.")
            self.model = "mock"
            return

        # Strategy 1: TorchScript (Standard for production)
        try:
            self.model = torch.jit.load(model_path, map_location=self.device)
            self.model.eval()
            logger.info(f"Successfully loaded TorchScript model to {self.device}")
            return
        except Exception as e:
            logger.info(f"File is not TorchScript ({e}). Attempting to load as state_dict...")

        # Strategy 2: State Dict / Full Pickle
        try:
            checkpoint = torch.load(model_path, map_location=self.device)
            
            # Extract state_dict if it's wrapped in a checkpoint dict
            raw_state_dict = checkpoint.get("model_state_dict", checkpoint) if isinstance(checkpoint, dict) else checkpoint
            
            if isinstance(raw_state_dict, nn.Module):
                # Full model was saved
                self.model = raw_state_dict
                self.model.eval()
                logger.info("Loaded full PyTorch model via torch.load")
            else:
                # Standard state_dict loading
                self._reconstruct_from_state_dict(raw_state_dict)
                
        except Exception as e:
            logger.error(f"Critical error loading model weights: {e}")
            self.model = "mock"

    def _get_model_file(self):
        for ext in ["model.pt", "model.pth"]:
            path = os.path.join(self.version_dir, ext)
            if os.path.exists(path):
                return path
        return None

    def _reconstruct_from_state_dict(self, raw_state_dict):
        """Reconstructs architecture and loads cleaned state_dict."""
        arch_type = self.config.get("architecture", "efficientnet_v2_s")
        num_classes = self.config.get("num_classes", 4)
        
        from .models.factory import ModelFactory
        self.model = ModelFactory.create(model_type=arch_type, num_classes=num_classes, config=self.config)
        
        # Clean and map state dict keys
        clean_dict = self._clean_state_dict(raw_state_dict)
        
        if self._has_custom_classifier_head(clean_dict):
            self._apply_custom_classifier_head(clean_dict)

        missing, unexpected = self.model.load_state_dict(clean_dict, strict=False)
        
        if missing:
            logger.warning(f"Weights missing for layers (using random init): {missing}")
        if unexpected:
            logger.debug(f"Unexpected layers ignored: {unexpected}")
        
        # Cảnh báo nếu tỉ lệ key không khớp quá cao (dấu hiệu weights sai chuẩn)
        total_keys = len(clean_dict)
        if total_keys > 0 and len(missing) / total_keys > 0.5:
            logger.warning(
                f"Over 50% of weights are missing. Model may have been trained with a different "
                f"library. Consider re-saving weights in timm format for best compatibility."
            )
            
        self.model.to(self.device)
        self.model.eval()
        logger.info(f"Model architecture '{arch_type}' reconstructed and weights loaded.")

    def _has_custom_classifier_head(self, state_dict):
        classifier_weights = [k for k in state_dict if re.match(r'^classifier\.\d+\.weight$', k)]
        return len(classifier_weights) >= 2

    def _apply_custom_classifier_head(self, state_dict):
        """Replace the model classifier with a sequential head matching checkpoint layer positions."""
        if not hasattr(self.model, 'classifier'):
            return

        sequence_keys = sorted(
            [k for k in state_dict if re.match(r'^classifier\.(\d+)\.weight$', k)],
            key=lambda k: int(re.match(r'^classifier\.(\d+)\.weight$', k).group(1))
        )
        indices = [int(re.match(r'^classifier\.(\d+)\.weight$', k).group(1)) for k in sequence_keys]
        max_idx = max(indices)

        layers = []
        prev_out = None
        for idx in range(max_idx + 1):
            if idx in indices:
                weight_key = next(k for k in sequence_keys if int(re.match(r'^classifier\.(\d+)\.weight$', k).group(1)) == idx)
                out_features, in_features = state_dict[weight_key].shape
                layers.append(nn.Linear(in_features, out_features))
                prev_out = out_features
            else:
                layers.append(nn.Identity())

        self.model.classifier = nn.Sequential(*layers)
        logger.info(
            f"Applied custom sequential classifier head with indices {indices} to model {type(self.model).__name__}."
        )

    def _clean_state_dict(self, state_dict):
        """
        Normalizes state_dict keys by removing common wrapper prefixes.
        Focuses on standard prefix removals only.
        For best results, models should be saved in timm-compatible format.
        """
        new_dict = {}
        for k, v in state_dict.items():
            # Remove common prefixes from DataParallel or wrapper modules
            key = k.replace('module.', '').replace('model.', '')
            new_dict[key] = v
        return new_dict

def load_model_package(version: str = "v1") -> ModelPackage:
    """Entry point for loading a model version. Includes memory cleanup."""
    from .models.factory import ModelFactory
    ModelFactory.clear_memory()
    
    base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "model_package", version)
    logger.info(f"Initializing Model Package from: {base_dir}")
    return ModelPackage(version_dir=base_dir)
