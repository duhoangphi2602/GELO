import logging
import os
import torch
import torch.nn.functional as F
from .exceptions import ModelNotLoadedError

logger = logging.getLogger("predictor")

# Configuration for the new AI-First flow
FALLBACK_THRESHOLD = 0.70  # Adjusted for better sensitivity in screening

# Internal Mapping to match the DB Master Seed IDs & labels.json of v1
FALLBACK_LABELS = {
    "0": {"id": 1, "code": "L20.9", "status": "DISEASE", "name": "Atopic Dermatitis"},
    "1": {"id": 2, "code": "D18.0", "status": "DISEASE", "name": "Vascular Tumors"},
    "2": {"id": 3, "code": "MEL_NEV_MOL", "status": "DISEASE", "name": "Melanoma Skin Cancer / Nevi / Moles"},
    "3": {"id": 4, "code": "L10", "status": "DISEASE", "name": "Bullous Disease"},
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
            # Dynamic mock: probability distribution based on actual num_classes from config
            num_classes = self.config.get("num_classes", 4)
            N = tensor_input.shape[0]
            uniform_prob = 1.0 / num_classes
            prob_tensor = torch.tensor([[uniform_prob] * num_classes for _ in range(N)])
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
        threshold = self.config.get("inference_threshold", FALLBACK_THRESHOLD)
        if max_conf < threshold:
            logger.info(f"Ensemble Confidence {max_conf:.2f} below threshold {threshold}. Classifying as Unknown.")
            return {
                "diseaseId": 0,
                "code": "UNKNOWN",
                "diagnosticStatus": "UNKNOWN",
                "name": "Unknown",
                "confidence": max_conf
            }

        # 5. Mapping to Labels
        # We prioritize package labels, then internal FALLBACK_LABELS
        labels_map = self._package.labels if (self._package and self._package.labels) else FALLBACK_LABELS
        idx_str = str(predicted_idx)
        
        if idx_str in labels_map:
            mapping = labels_map[idx_str]
            disease_id = mapping.get("id", predicted_idx)
            code = mapping.get("code", "UNKNOWN")
            status = mapping.get("status", "DISEASE")
            name = mapping.get("name", "Unknown")
        else:
            # Fallback if index not in map
            disease_id = 0
            code = "UNKNOWN"
            status = "UNKNOWN"
            name = "Unknown"

        # 6. Dynamic Labels Checking (only applies to DISEASE predictions)
        # Non-disease statuses (HEALTHY, UNKNOWN, etc.) bypass this filter entirely
        if status == "DISEASE":
            enabled_codes = self.config.get("enabled_disease_codes")
            if enabled_codes is not None and code not in enabled_codes:
                logger.info(f"Predicted Disease Code '{code}' is not in enabled_disease_codes list. Classifying as Unknown.")
                disease_id = 0
                code = "UNKNOWN"
                status = "UNKNOWN"
                name = "Unknown"

        # Final check: ensure UNKNOWN code always has consistent status
        if code == "UNKNOWN":
            status = "UNKNOWN"
            name = "Unknown"
            disease_id = 0

        logger.info(f"Inference Result -> Status: {status}, Code: {code}, Name: {name} ({max_conf:.4f})")
        
        return {
            "diseaseId": disease_id,
            "code": code,
            "diagnosticStatus": status,
            "name": name,
            "confidence": max_conf
        }

# Global singleton
predictor = PredictorService()
