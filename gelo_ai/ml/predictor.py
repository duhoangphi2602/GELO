import logging
import os
import torch
import torch.nn.functional as F
from .exceptions import ModelNotLoadedError

logger = logging.getLogger("predictor")

THRESHOLD = 0.75

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
            # Use os.path.basename to get 'v1' regardless of / or \ separator
            return os.path.basename(self._package.version_dir.rstrip('/\\'))
        return "unknown"

    @property
    def config(self):
        return self._package.config if self._package else {}

    @property
    def is_ready(self):
        return self._package is not None and self._package.model is not None

    def predict(self, tensor_input: torch.Tensor) -> dict:
        """
        Receives an ensemble Batch Tensor representing N images of the same patient skin region.
        Shape: (N, C, H, W)
        """
        if not self.is_ready:
            raise ModelNotLoadedError("Model package is not fully loaded")

        logger.info(f"Running Ensemble Inference on batch shape {tensor_input.shape}")
        
        # Determine num_classes
        num_classes = self._package.config.get("num_classes", 1)
        model = self._package.model

        # 1. Inference Matrix
        if model == "mock":
            # Just mimicking a batch output score
            N = tensor_input.shape[0]
            if num_classes > 1:
                prob_tensor = torch.tensor([[0.88, 0.12] for _ in range(N)])
            else:
                prob_tensor = torch.tensor([[0.88] for _ in range(N)])
        else:
            with torch.no_grad():
                tensor_input = tensor_input.to(self._package.device)
                logits = model(tensor_input) # output (N, Classes)
                
                # 2. Probability Scaling
                if num_classes == 1:
                    prob_tensor = torch.sigmoid(logits)
                else:
                    prob_tensor = F.softmax(logits, dim=1)
                
        # 3. Ensemble Average (Mean Probability Vector across the N images)
        mean_probs = torch.mean(prob_tensor, dim=0) # Shape: (Classes,)

        # 4. Find Max Confidence & Index
        if num_classes == 1:
            confidence = mean_probs[0].item()
            predicted_idx = 1 if confidence >= 0.5 else 0
            max_conf = confidence if predicted_idx == 1 else (1.0 - confidence)
        else:
            max_conf_val, max_idx = torch.max(mean_probs, dim=0)
            predicted_idx = max_idx.item()
            max_conf = max_conf_val.item()

        # 5. Unknown Handling & Thresholding
        if max_conf < THRESHOLD:
            logger.info(f"Ensemble Confidence {max_conf:.2f} below threshold {THRESHOLD}. Classifying as Unknown.")
            return {
                "label": -1,
                "name": "Unknown",
                "confidence": max_conf
            }

        # 6. Mapping to Labels Dictionary
        labels_dict = self._package.labels
        idx_str = str(predicted_idx)
        if idx_str in labels_dict:
            disease_id = labels_dict[idx_str].get("id", None)
            status = labels_dict[idx_str].get("status", "DISEASE")
            name = labels_dict[idx_str].get("name", "Unknown")
        else:
            disease_id = predicted_idx
            status = "DISEASE"
            name = "Unknown"

        logger.info(f"Ensemble Result -> Status: {status}, ID: {disease_id} with Confidence {max_conf:.4f}")
        return {
            "label": disease_id,
            "diagnosticStatus": status,
            "diseaseId": disease_id,
            "confidence": max_conf,
            "name": name
        }

# Global singleton
predictor = PredictorService()
