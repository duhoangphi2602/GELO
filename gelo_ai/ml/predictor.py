import logging
import os
import torch
import torch.nn.functional as F
from .exceptions import ModelNotLoadedError

logger = logging.getLogger("predictor")

# Configuration for the new AI-First flow
THRESHOLD = 0.70  # Adjusted for better sensitivity in screening

# Internal Mapping to match the DB Master Seed IDs & labels.json of v1
DEFAULT_LABELS = {
    "0": {"id": 1, "status": "DISEASE", "name": "Atopic Dermatitis"},
    "1": {"id": 2, "status": "DISEASE", "name": "Vascular Tumors"},
    "2": {"id": 3, "status": "DISEASE", "name": "Melanoma Skin Cancer / Nevi / Moles"},
    "3": {"id": 4, "status": "DISEASE", "name": "Bullous Disease"},
}

class PredictorService:
    def __init__(self):
        self._package = None

    def set_package(self, package):
        """Inject the loaded ModelPackage containing config, labels, and the torch model."""
        self._package = package
        logger.info(f"Predictor service armed with package version {package.version_dir}")

    @property
    def version(self):
        if self._package:
            return os.path.basename(self._package.version_dir.rstrip('/\\'))
        return "v1.0.0-engine"

    @property
    def config(self):
        # We match the efficientnet_v2_s architecture with 4 classes
        return self._package.config if self._package else {"num_classes": 4}

    @property
    def is_ready(self):
        # We allow "Ready" even without a package for Mock/Transition testing
        return True

    def predict(self, tensor_input: torch.Tensor) -> dict:
        """
        Receives an ensemble Batch Tensor representing N images of the same patient skin region.
        Shape: (N, C, H, W)
        """
        # 1. Inference Matrix Logic
        # Since v1 is deleted, we default to Mock Logic if no model is loaded
        is_mock = self._package is None or self._package.model == "mock"

        if is_mock:
            # Mocking a batch output score for 4 classes (Uniform distribution to avoid bias)
            N = tensor_input.shape[0]
            prob_tensor = torch.tensor([[0.25, 0.25, 0.25, 0.25] for _ in range(N)])
        else:
            with torch.no_grad():
                model = self._package.model
                tensor_input = tensor_input.to(self._package.device)
                logits = model(tensor_input)
                prob_tensor = F.softmax(logits, dim=1)

        # 2. Ensemble Average (Mean Probability Vector across the N images)
        mean_probs = torch.mean(prob_tensor, dim=0) # Shape: (Classes,)

        # 3. Find Max Confidence & Index
        max_conf_val, max_idx = torch.max(mean_probs, dim=0)
        predicted_idx = max_idx.item()
        max_conf = max_conf_val.item()

        # 4. Unknown Handling & Thresholding
        if max_conf < THRESHOLD:
            logger.info(f"Ensemble Confidence {max_conf:.2f} below threshold {THRESHOLD}. Classifying as Unknown.")
            return {
                "diseaseId": 0,
                "diagnosticStatus": "UNKNOWN",
                "name": "Unknown",
                "confidence": max_conf
            }

        # 5. Mapping to Labels
        # We prioritize package labels, then internal DEFAULT_LABELS
        labels_map = self._package.labels if (self._package and self._package.labels) else DEFAULT_LABELS
        idx_str = str(predicted_idx)
        
        if idx_str in labels_map:
            mapping = labels_map[idx_str]
            disease_id = mapping.get("id", predicted_idx)
            status = mapping.get("status", "DISEASE")
            name = mapping.get("name", "Unknown")
        else:
            # Fallback if index not in map
            disease_id = predicted_idx + 1 # Assuming IDs start at 1 if node index is disease rank
            status = "DISEASE"
            name = "Unknown"

        # Final check for ID 0
        if disease_id == 0:
            status = "UNKNOWN"

        logger.info(f"Inference Result -> Status: {status}, ID: {disease_id}, Name: {name} ({max_conf:.4f})")
        
        return {
            "diseaseId": disease_id,
            "diagnosticStatus": status,
            "name": name,
            "confidence": max_conf
        }

# Global singleton
predictor = PredictorService()
